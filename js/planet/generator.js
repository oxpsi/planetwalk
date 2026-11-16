// Planet terrain: circular fBm heightmap + sparse decor, plus lookup helpers.
import { makeCircularNoise } from '../core/noise.js';
import { hashSeed, mulberry32 } from '../core/rng.js';

const TAU = Math.PI * 2;

export const planetParams = { radius: 1400, samples: 720, amplitude: 90, octaves: 5 };

// Sub-generator "planet-terrain". Octaves are baked into makeCircularNoise
// (5-octave fBm); we sum two independent layers: smooth rolling hills plus a
// ridged detail layer for occasional sharper crests.
const planetTerrain = {
  generate({ seed, radius, samples, amplitude }) {
    const n = samples;
    const rng = mulberry32(hashSeed(String(seed)));
    const hillsN = makeCircularNoise(rng);
    const ridgeN = makeCircularNoise(rng);

    // Sample raw, then normalize each layer to [-1,1] so `amplitude` is the
    // true peak scale regardless of the noise's native range.
    const h = new Float32Array(n);
    const r = new Float32Array(n);
    let hlo = Infinity, hhi = -Infinity, rlo = Infinity, rhi = -Infinity;
    for (let i = 0; i < n; i++) {
      const a = hillsN(i / n);
      const b = ridgeN(i / n);
      h[i] = a;
      r[i] = b;
      if (a < hlo) hlo = a; else if (a > hhi) hhi = a;
      if (b < rlo) rlo = b; else if (b > rhi) rhi = b;
    }
    const hs = 2 / Math.max(1e-9, hhi - hlo);
    const rs = 2 / Math.max(1e-9, rhi - rlo);

    const height = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const hills = (h[i] - hlo) * hs - 1;
      const ridge = 1 - Math.abs((r[i] - rlo) * rs - 1); // crests at zero crossings
      height[i] = (hills + ridge * ridge * ridge * 0.45) * amplitude;
    }

    // 5-tap binomial smoothing: removes single-sample spikes from the top
    // octave (aliasing) so slopes read as rolling hills, not walls.
    const smooth = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const a = height[(i - 2 + n) % n], b = height[(i - 1 + n) % n],
            c = height[i], d = height[(i + 1) % n], e = height[(i + 2) % n];
      smooth[i] = (a + 4 * b + 6 * c + 4 * d + e) / 16;
    }

    // Sparse decor (~1 entry per 40 samples): rocks seek slopes, tufts flats.
    const decor = { rocks: [], tufts: [] };
    const count = Math.max(8, Math.round(n / 40));
    const dtheta = TAU / n;
    for (let k = 0; k < count; k++) {
      const i = (rng() * n) | 0;
      const slope = Math.abs(smooth[(i + 1) % n] - smooth[i]) / (radius * dtheta);
      const pRock = Math.min(0.9, slope * 1.6 + 0.1);
      const e = { a: (i + rng()) * dtheta, s: 3 + rng() * 5, v: (rng() * 4) | 0 };
      (rng() < pRock ? decor.rocks : decor.tufts).push(e);
    }

    return { seed, radius, samples, height: smooth, decor };
  },
};

export function makePlanet(engine, seed, params = planetParams) {
  if (!engine.has('planet-terrain')) engine.register('planet-terrain', planetTerrain);
  return engine.generate('planet-terrain', { ...planetParams, ...params, seed });
}

// Surface radius (base + height) at any angle, lerped between samples.
export function surfaceRadiusAt(planet, angle) {
  const n = planet.samples;
  const f = (((angle / TAU) * n) % n + n) % n;
  const i = f | 0;
  const h0 = planet.height[i];
  return planet.radius + h0 + (planet.height[(i + 1) % n] - h0) * (f - i);
}

// Signed terrain slope angle (rad) from dr/dθ, normalized by the local arc
// length (run = R·dθ) so it is the true incline; range [-PI/2, PI/2].
export function slopeAt(planet, angle) {
  const n = planet.samples;
  const f = (((angle / TAU) * n) % n + n) % n;
  const i = f | 0;
  const dr = planet.height[(i + 1) % n] - planet.height[i];
  return Math.atan(dr / (planet.radius * (TAU / n)));
}
