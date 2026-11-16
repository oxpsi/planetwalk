// Periodic value noise on a circular lattice, summed as fBm.
// Lattice sizes 45 * 2^k (45..720) all divide the 720-sample terrain circle,
// so the wrap-around indexing is exact at every octave.

const OCTAVES = 5;
const BASE_POINTS = 45;

// rng: () => [0,1). Returns f(t) with t in [0,1) around the circle,
// roughly in [-1,1]. Deterministic for a given rng; no per-call allocation.
export function makeCircularNoise(rng) {
  const lattices = [];
  let size = BASE_POINTS;
  for (let o = 0; o < OCTAVES; o++) {
    const pts = new Float32Array(size);
    for (let i = 0; i < size; i++) pts[i] = rng() * 2 - 1;
    lattices.push(pts);
    size *= 2;
  }

  let norm = 0, amp = 1;
  for (let o = 0; o < OCTAVES; o++) { norm += amp; amp *= 0.5; }

  return function noise(t) {
    let sum = 0, a = 1;
    for (let o = 0; o < OCTAVES; o++) {
      const pts = lattices[o];
      const n = pts.length;
      const x = t * n;
      const i = x | 0;
      // Cosine-smoothed interpolation between lattice points (wraps at n).
      const w = (1 - Math.cos((x - i) * Math.PI)) * 0.5;
      sum += (pts[i] + (pts[(i + 1) % n] - pts[i]) * w) * a;
      a *= 0.5;
    }
    return sum / norm;
  };
}
