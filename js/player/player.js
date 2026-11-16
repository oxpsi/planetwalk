// Player physics: a point-with-radius on a circular heightfield planet.
// Planet center is world origin; "radial" = away from center, +θ = tangent.
import { surfaceRadiusAt, slopeAt } from '../planet/generator.js';

// Module-level input flags; main.js sets these from the keyboard.
export const input = { left: false, right: false, run: false, jump: false };

const G = 620;                 // gravity u/s² toward planet center
const R = 9;                   // player radius
const WALK = 130;              // walk speed u/s
const RUN = 300;               // run speed u/s
const ACCEL = 1400;            // ground acceleration u/s²
const FRICTION = 1200;         // ground deceleration u/s² (no input)
const AIR_CTRL = 0.3;          // air control fraction of ACCEL
const JUMP_V = 260;            // radial jump impulse u/s
const COYOTE = 0.08;           // s of jump forgiveness after leaving ground
const BUFFER = 0.1;            // s a jump press is buffered before landing
const SLIDE_ENTER = 50 * Math.PI / 180;
const SLIDE_EXIT = 45 * Math.PI / 180;

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.grounded = false;
    this.facing = 1;
    this.sliding = false;
    this.phase = 0;
    this.state = 'idle';
    this.coyote = 0;           // internal timers
    this.buffer = 0;
  }

  update(dt, planet) {
    const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    if (dir !== 0) this.facing = dir;

    // Work in polar frame: vr = radial-out, vt = tangential (+θ reads as right).
    let a = Math.atan2(this.y, this.x);
    let ux = Math.cos(a), uy = Math.sin(a);
    let vr = this.vx * ux + this.vy * uy;
    let vt = -this.vx * uy + this.vy * ux;

    vr -= G * dt; // gravity, always toward the center

    // Slide transitions with hysteresis (enter >50°, exit <45°).
    const slope = slopeAt(planet, a);
    if (this.sliding) {
      if (!this.grounded || Math.abs(slope) < SLIDE_EXIT) this.sliding = false;
    } else if (this.grounded && Math.abs(slope) > SLIDE_ENTER &&
               (dir * slope > 0 || vt * slope > 0)) {
      this.sliding = true; // steep and moving (or pushing) uphill
    }

    // Locomotion.
    const max = input.run ? RUN : WALK;
    if (this.sliding) {
      vt += -G * Math.sin(slope) * dt; // gravity's component along the surface
    } else if (this.grounded) {
      if (dir !== 0) {
        const target = dir * max;
        vt = vt < target ? Math.min(target, vt + ACCEL * dt)
                         : Math.max(target, vt - ACCEL * dt);
      } else {
        const s = Math.sign(vt);
        vt -= s * FRICTION * dt;
        if (Math.sign(vt) !== s) vt = 0;
      }
    } else if (dir !== 0) {
      const target = dir * max, ac = ACCEL * AIR_CTRL;
      vt = vt < target ? Math.min(target, vt + ac * dt)
                       : Math.max(target, vt - ac * dt);
    }

    // Jump: buffered press + coyote time.
    this.buffer = input.jump ? BUFFER : Math.max(0, this.buffer - dt);
    this.coyote = this.grounded ? COYOTE : Math.max(0, this.coyote - dt);
    if (this.buffer > 0 && this.coyote > 0) {
      vr = JUMP_V;
      this.grounded = false;
      this.sliding = false;
      this.buffer = 0;
      this.coyote = 0;
      input.jump = false; // consume
    }

    // Back to Cartesian and integrate.
    this.vx = vr * ux - vt * uy;
    this.vy = vr * uy + vt * ux;
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Ground collision: push out along radial, kill inward radial velocity.
    a = Math.atan2(this.y, this.x);
    ux = Math.cos(a);
    uy = Math.sin(a);
    const rest = surfaceRadiusAt(planet, a) + R;
    const d = Math.hypot(this.x, this.y);
    if (d < rest) {
      const k = rest / d;
      this.x *= k;
      this.y *= k;
      const vr2 = this.vx * ux + this.vy * uy;
      if (vr2 < 0) {
        this.vx -= vr2 * ux;
        this.vy -= vr2 * uy;
      }
      this.grounded = true;
    } else {
      this.grounded = false;
    }

    // Animation state + cycle phase (cadence ~ sqrt(speed), breathe when idle).
    const sp = Math.abs(vt);
    if (this.sliding) this.state = 'slide';
    else if (!this.grounded) this.state = vr > 20 ? 'jump' : 'fall';
    else if (sp > 6) this.state = (input.run || sp > WALK + 20) ? 'run' : 'walk';
    else this.state = 'idle';
    this.phase += (this.grounded ? (sp > 6 ? Math.sqrt(sp) * 0.9 : 2.0) : 0) * dt;
  }
}

// Place the player standing on top of the planet (angle -π/2, zero velocity).
export function spawnOnPlanet(planet) {
  const a = -Math.PI / 2;
  const r = surfaceRadiusAt(planet, a) + R;
  return new Player(Math.cos(a) * r, Math.sin(a) * r);
}
