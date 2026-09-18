/**
 * DifficultySystem.js
 * Distance drives speed, spacing and which hazards are allowed. Spacing is
 * clamped in seconds, not pixels, so a faster run is never an unfair run.
 */

import { CONFIG } from '../config.js';
import { clamp } from '../utils/Random.js';

export class DifficultySystem {
  constructor() {
    this.reset();
  }

  reset() {
    this.distance = 0;
    this.tier = CONFIG.difficulty.tiers[0];
    this.tierIndex = 0;
    this.changed = false;
  }

  update(distanceMeters) {
    this.distance = distanceMeters;
    const tiers = CONFIG.difficulty.tiers;
    let index = 0;
    for (let i = 0; i < tiers.length; i += 1) {
      if (distanceMeters >= tiers[i].from) index = i;
    }
    this.changed = index !== this.tierIndex;
    this.tierIndex = index;
    this.tier = tiers[index];
  }

  /** Base world speed in px/s before any power-up multiplier. */
  get speed() {
    return clamp(
      CONFIG.speed.base + this.distance * CONFIG.speed.perMeter,
      CONFIG.speed.base,
      CONFIG.speed.max
    );
  }

  /** Seconds of clear track between hazard patterns. */
  get spacingTime() {
    const withinTier = this.tierIndex === CONFIG.difficulty.tiers.length - 1
      ? 1
      : clamp(
        (this.distance - this.tier.from)
        / (CONFIG.difficulty.tiers[this.tierIndex + 1].from - this.tier.from),
        0, 1
      );
    const nextSpacing = this.tierIndex === CONFIG.difficulty.tiers.length - 1
      ? this.tier.spacingTime
      : CONFIG.difficulty.tiers[this.tierIndex + 1].spacingTime;
    const eased = this.tier.spacingTime + (nextSpacing - this.tier.spacingTime) * withinTier;
    return Math.max(CONFIG.difficulty.minSpacingTime, eased);
  }

  get maxCluster() {
    return this.tier.maxCluster;
  }

  get name() {
    return this.tier.name;
  }

  allows(feature) {
    return this.tier[feature] === true;
  }
}
