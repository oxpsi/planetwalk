// Seeded RNG utilities: string hashing + PRNG factory.

// xmur3 string hash -> 32-bit unsigned seed.
export function hashSeed(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^ (h >>> 16)) >>> 0;
}

// mulberry32 PRNG; returns () => float in [0,1).
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Unambiguous lowercase alphanumerics (no l/1/o/0) for readable seeds.
const SEED_CHARS = 'abcdefghjkmnpqrstuvwxyz23456789';

// Short human-readable seed, e.g. "k7f2m9".
export function randomSeed() {
  let s = '';
  for (let i = 0; i < 6; i++) s += SEED_CHARS[(Math.random() * SEED_CHARS.length) | 0];
  return s;
}
