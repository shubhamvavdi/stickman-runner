/**
 * ScoreSystem.js
 * Total = distance score + coin score + power-up bonus.
 */

import { CONFIG } from '../config.js';
import { PIXELS_PER_METER } from '../utils/Constants.js';

export class ScoreSystem {
  constructor() {
    this.reset();
  }

  reset() {
    this.pixels = 0;
    this.coins = 0;
    this.bonus = 0;
    this.startTime = performance.now();
  }

  addDistance(pixels) {
    this.pixels += pixels;
  }

  addCoin(amount = 1) {
    this.coins += amount;
  }

  addBonus(amount = CONFIG.score.powerupBonus) {
    this.bonus += amount;
  }

  get distance() {
    return Math.floor(this.pixels / PIXELS_PER_METER);
  }

  get distanceScore() {
    return this.distance;
  }

  get coinScore() {
    return this.coins * CONFIG.score.coinValue;
  }

  get total() {
    return this.distanceScore + this.coinScore + this.bonus;
  }

  /** Seconds since the run started, used by the GameHub bridge. */
  get duration() {
    return (performance.now() - this.startTime) / 1000;
  }

  snapshot() {
    return {
      score: this.total,
      distance: this.distance,
      coins: this.coins,
      bonus: this.bonus,
      duration: Math.round(this.duration * 10) / 10
    };
  }
}
