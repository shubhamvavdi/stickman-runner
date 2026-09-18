/**
 * Obstacle.js
 * Base class for every hazard. Instances are pooled: `active = false` sends
 * an object back to the pool instead of to the garbage collector.
 */

import { GAME_WIDTH } from '../utils/Constants.js';

export class Obstacle {
  constructor(type) {
    this.type = type;
    this.active = false;
    this.deadly = true;
    this.x = 0;
    this.y = 0;
    this.w = 0;
    this.h = 0;
    this.padX = 4;
    this.padY = 2;
    this.time = 0;
  }

  spawn(x) {
    this.active = true;
    this.x = x;
    this.time = 0;
    return this;
  }

  /** Collision box, slightly inset from the drawing for a fair feel. */
  getBounds() {
    return { x: this.x + this.padX, y: this.y + this.padY, w: this.w - this.padX * 2, h: this.h - this.padY };
  }

  update(dt, scroll) {
    this.time += dt;
    this.x -= scroll;
    if (this.x + this.w < -120) this.active = false;
  }

  /** Horizontal room this obstacle needs, used by the spawner. */
  get footprint() {
    return this.w;
  }

  draw() {}
}
