import { COLORS, GROUND_Y } from '../utils/Constants.js';

/**
 * Gap.js
 * A hole in the ground. It is not "deadly on contact": the ground simply
 * stops existing, and the player falls, which the CollisionSystem detects.
 */
export class Gap {
  constructor() {
    this.active = false;
    this.x = 0;
    this.w = 0;
  }

  spawn(x, width) {
    this.active = true;
    this.x = x;
    this.w = width;
    return this;
  }

  update(dt, scroll) {
    this.x -= scroll;
    if (this.x + this.w < -140) this.active = false;
  }

  draw(ctx, depth = 88) {
    ctx.save();
    ctx.fillStyle = '#080a16';
    ctx.fillRect(this.x, GROUND_Y, this.w, depth);
    ctx.fillStyle = COLORS.danger;
    ctx.fillRect(this.x - 4, GROUND_Y, 4, 12);
    ctx.fillRect(this.x + this.w, GROUND_Y, 4, 12);
    ctx.restore();
  }
}
