// Draws the planet in world coordinates; the caller has already applied the
// camera transform. Only the visible angular arc is drawn, culled by angle.
import { surfaceRadiusAt } from './generator.js';

const TAU = Math.PI * 2;
const BODY = '#9a9a9a';
const CRUST = '#4a4a4a';
const DITHER = '#8c8c8c';
const ROCK = '#7a7a7a';
const TUFT = '#5f5f5f';
const DROP = 400;      // body extends this far below the base radius
const MARGIN = 0.06;   // extra arc (rad) so geometry never pops in at edges

function hash01(x) {
  return ((x * 2654435761) >>> 0) / 4294967296;
}

// Signed angular distance a - cam, wrapped to [-PI, PI].
function relAngle(a, cam) {
  let d = (a - cam) % TAU;
  if (d > TAU / 2) d -= TAU;
  else if (d < -TAU / 2) d += TAU;
  return d;
}

// Angular rock: small irregular k-gon centered on the surface point.
function drawRock(ctx, e, r) {
  const k = 5 + (e.v % 3);
  const cx = Math.cos(e.a) * r;
  const cy = Math.sin(e.a) * r;
  ctx.beginPath();
  for (let j = 0; j < k; j++) {
    const th = (j / k) * TAU + e.v * 1.13;
    const sj = e.s * (0.55 + 0.5 * hash01(e.v * 131 + j * 17));
    const x = cx + Math.cos(th) * sj;
    const y = cy + Math.sin(th) * sj;
    if (j === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
}

// Grass tuft: 3-5 short strokes fanning outward from the surface point.
function drawTuft(ctx, e, r) {
  const m = 3 + (e.v % 3);
  const ux = Math.cos(e.a);
  const uy = Math.sin(e.a);
  const tx = -uy;
  const ty = ux;
  ctx.beginPath();
  for (let j = 0; j < m; j++) {
    const f = m === 1 ? 0 : j / (m - 1) - 0.5;
    const bx = ux * r + tx * f * e.s * 0.8;
    const by = uy * r + ty * f * e.s * 0.8;
    ctx.moveTo(bx, by);
    ctx.lineTo(bx + ux * e.s * 0.9 + tx * f * e.s * 0.9,
               by + uy * e.s * 0.9 + ty * f * e.s * 0.9);
  }
  ctx.stroke();
}

export class PlanetRenderer {
  constructor(planet) {
    this.planet = planet;
  }

  draw(ctx, camAngle, camX, camY, viewW, viewH, zoom) {
    const p = this.planet;
    const n = p.samples;
    const step = TAU / n;
    const height = p.height;

    // Visible half-angle: viewport half-diagonal at the camera's radius.
    const d = 0.5 * Math.hypot(viewW, viewH) / zoom;
    const rc = Math.max(1, Math.hypot(camX, camY));
    const half = 2 * Math.asin(Math.min(1, d / (2 * rc))) + MARGIN;

    let i0 = Math.floor((camAngle - half) / step);
    let i1 = Math.ceil((camAngle + half) / step);
    if (i1 - i0 >= n) { i0 = 0; i1 = n; } // whole planet in view: one full loop

    // Body: surface arc closed down to a flat base at radius - DROP.
    const baseR = p.radius - DROP;
    ctx.beginPath();
    for (let i = i0; i <= i1; i++) {
      const a = i * step;
      const r = p.radius + height[((i % n) + n) % n];
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      if (i === i0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.lineTo(Math.cos(i1 * step) * baseR, Math.sin(i1 * step) * baseR);
    ctx.lineTo(Math.cos(i0 * step) * baseR, Math.sin(i0 * step) * baseR);
    ctx.closePath();
    ctx.fillStyle = BODY;
    ctx.fill();

    // Dither band: stable specks scattered just under the crust.
    ctx.fillStyle = DITHER;
    for (let i = i0; i < i1; i++) {
      const j = ((i % n) + n) % n;
      const q = (j * 2654435761) >>> 0;
      if (q % 4 === 3) continue;
      const a = (i + 0.5 + (q % 13) / 13 - 0.5) * step;
      const r = p.radius + height[j] - (5 + (q % 11) * 1.3);
      ctx.fillRect(Math.cos(a) * r, Math.sin(a) * r, 1.8, 1.8);
    }

    // Crust outline along the surface only.
    ctx.beginPath();
    for (let i = i0; i <= i1; i++) {
      const a = i * step;
      const r = p.radius + height[((i % n) + n) % n];
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      if (i === i0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = CRUST;
    ctx.lineWidth = 2 / zoom;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Decor, culled to the visible arc.
    const rocks = p.decor.rocks;
    const tufts = p.decor.tufts;
    ctx.fillStyle = ROCK;
    for (let k = 0; k < rocks.length; k++) {
      const e = rocks[k];
      const rel = relAngle(e.a, camAngle);
      if (rel <= half && rel >= -half) {
        drawRock(ctx, e, surfaceRadiusAt(p, e.a));
      }
    }
    ctx.strokeStyle = TUFT;
    ctx.lineWidth = 1.2;
    for (let k = 0; k < tufts.length; k++) {
      const e = tufts[k];
      const rel = relAngle(e.a, camAngle);
      if (rel <= half && rel >= -half) drawTuft(ctx, e, surfaceRadiusAt(p, e.a));
    }
  }
}
