# PLANETWALK — design & contracts

A tiny sidescroller where you walk around a procedurally generated tiny planet.
Vanilla ES modules + Canvas 2D. No build step, no dependencies. Everything greyscale.

## Feel & look
- Sky: white `#ffffff`. Terrain: grey body `#9a9a9a`, darker crust outline `#4a4a4a`.
- Character: near-black `#1e1e1e` procedural stick-rig with real animation states.
- Unique-but-cheap rendering: flat grey planet, 2px crust line, sparse procedural
  decor (angular rocks, grass tufts), faint dither/noise band under the crust.
- Camera: follows player, rotated so "up" always points away from planet center
  → planet curvature visibly curves away at screen edges.

## World model
- Planet center at world origin (0,0). Canvas coords: x right, y DOWN.
- Terrain = heightmap over a full circle: `h[i]`, i in `[0, N)`, N=720 samples.
  Surface radius at sample i: `R + h[i]` (h can be negative). Base `R = 1400`.
  Noise is periodic by construction (circular lattice, wrap-around indexing).
- Linear interpolation between samples for collision & rendering.
- Decor: arrays of `{a (angle), s (size), t (type)}` placed by seeded RNG.

## Physics (player.js)
- Player is a point with radius `r=9` at Cartesian `(x,y)`, velocity `(vx,vy)`.
- Gravity: `g = 620 u/s²` toward planet center (unit vector `-pos/|pos|`).
- Grounded when `|pos| >= surfaceRadiusAt(angle) - r` (pushed out, radial vel killed).
- Move: walk 130 u/s, run 300 u/s (hold Shift), accel 1400, ground friction 1200.
- Jump: impulse 260 u/s along radial-out. Coyote time 0.08s, jump buffer 0.1s.
- Slope rule: terrain slope angle from local gradient. If |slope| > 50° and the
  player would move uphill → enter SLIDE: input control ~0, accelerate down-slope,
  leave slide when slope < 45° or airborne. Anim reflects state.
- Air control: 30% of ground accel.

## Module contracts (exact — do not deviate)

### js/core/rng.js
```js
export function hashSeed(str): number        // xmur3 -> 32-bit
export function mulberry32(seed: number): () => number  // [0,1)
export function randomSeed(): string         // short readable seed, e.g. "k7f2m9"
```

### js/core/noise.js
```js
export function makeCircularNoise(rng): (t: number) => number
// t in [0,1) around the circle. Periodic. Value noise on circular lattice,
// cosine-smoothed, caller sums octaves OR this returns 1 octave of fBm —
// implement as fBm with 5 octaves (720 divisible by 2,4,...,16*45).
```

### js/core/engine.js
```js
export class ProcEngine {
  register(name: string, gen: {generate(params: object): object}): void
  generate(name: string, params: object): object   // throws if unknown
  has(name: string): boolean
}
```

### js/planet/generator.js
```js
export const planetParams = { radius:1400, samples:720, amplitude:90, octaves:5 }
// registers sub-generator "planet-terrain" on the engine:
//   generate({seed, radius, samples, amplitude, octaves}) ->
//     { seed, radius, samples, height: Float32Array(N), decor: {rocks:[], tufts:[]} }
// decor entries: {a: angle rad, s: size, v: variant int}
// rocks prefer slopes, tufts prefer flat ground; both sparse (~1 per 40 samples).
export function makePlanet(engine, seed, params=planetParams): planet
export function surfaceRadiusAt(planet, angle): number   // lerped, includes h
export function slopeAt(planet, angle): number           // dr/dθ based slope angle (rad, signed)
```

### js/planet/renderer.js
```js
export class PlanetRenderer {
  constructor(planet)
  draw(ctx, camAngle, camX, camY, viewW, viewH, zoom)
  // Draws ONLY the visible arc (cull by angle range computed from view + zoom).
  // Draws in WORLD coordinates; caller applies camera transform first.
  // Terrain: filled polygon down to R-400 (body), crust stroke, decor, dither band.
}
```

### js/player/player.js
```js
export const input = { left:false, right:false, run:false, jump:false } // module-level, keys set these
export class Player {
  x; y; vx; vy; grounded; facing; sliding; phase; state // state: 'idle'|'walk'|'run'|'jump'|'fall'|'slide'
  constructor(x, y)
  update(dt, planet)
}
export function spawnOnPlanet(planet): Player  // places at surface + r, angle = -π/2 (top)... any angle ok
```

### js/player/pose.js
```js
export function drawCharacter(ctx, p)
// Draws in LOCAL frame: caller has translated/rotated so origin = feet contact,
// +x = facing forward, +y = DOWN (canvas convention). Height ~26, near-black.
// Procedural rig: head circle, torso, 2 legs, 2 arms; pose per state:
// idle bob / walk sine cycle / run (lean + amplitude) / jump tuck / fall / slide.
```

### js/save.js
```js
export function saveGame(state)      // localStorage 'planetwalk.save.v1'
export function loadGame(): object|null
export function clearSave(): void
export function exportGame(state): void  // downloads planetwalk-<seed>.json (compact JSON)
// state = { v:1, seed, params, player:{x,y,vx,vy} }
```

### main.js (integration — written by orchestrator)
- Boot: loadGame() → if present rebuild planet from seed/params + restore player,
  else random seed → makePlanet → spawn. Auto-save every 3s + on hide/unload.
- Camera: translate(canvasW/2, canvasH/2), scale(zoom), rotate(-θ - π/2),
  translate(-camX, -camY). θ = player angle. zoom ≈ min(w,h)/500.
- UI: top bar, buttons `#btn-new`, `#btn-export`. Keys: A/D/←/→ move, Shift run,
  Space/W/↑ jump.

### index.html / style.css (shell agent)
- Fullscreen canvas, floating top-left pill bar: title "PLANETWALK", buttons New / Export.
- Minimal, elegant, greyscale, system font stack, subtle shadows. No frameworks.

## Rules for all agents
- ES modules (`type="module"`), no deps, no build, no console noise.
- Only write YOUR files listed above. Do not create index.html/main.js unless you are the shell agent.
- Perf: no per-frame allocations in hot paths; cull decor off-screen.
- Keep code small and elegant. Comment sparsely but usefully.
