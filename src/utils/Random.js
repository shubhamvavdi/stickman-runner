/**
 * Random.js
 * Small deterministic RNG (mulberry32) plus helpers. Deterministic seeding
 * makes bug reports reproducible without changing how the game feels.
 */

export class Random {
  constructor(seed = Date.now()) {
    this.seed(seed);
  }

  seed(value) {
    this._state = value >>> 0;
    return this;
  }

  /** Float in [0, 1). */
  next() {
    this._state = (this._state + 0x6d2b79f5) >>> 0;
    let t = this._state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Float in [min, max). */
  range(min, max) {
    return min + this.next() * (max - min);
  }

  /** Integer in [min, max] inclusive. */
  int(min, max) {
    return Math.floor(this.range(min, max + 1));
  }

  pick(list) {
    return list[Math.floor(this.next() * list.length)];
  }

  chance(probability) {
    return this.next() < probability;
  }
}

export const clamp = (value, min, max) => (value < min ? min : value > max ? max : value);
export const lerp = (a, b, t) => a + (b - a) * t;
