import { Obstacle } from './Obstacle.js';
import { COLORS, GROUND_Y, OBSTACLE_TYPE } from '../utils/Constants.js';

/** Animated flame. Narrow but tall: jump, never slide. */
export class Fire extends Obstacle {
  constructor() {
    super(OBSTACLE_TYPE.FIRE);
    this.w = 40;
    this.h = 62;
    this.padX = 9;
  }

  spawn(x) {
    super.spawn(x);
    this.y = GROUND_Y - this.h;
    return this;
  }

  draw(ctx, reducedMotion) {
    const flicker = reducedMotion ? 0 : Math.sin(this.time * 12) * 4;
    const cx = this.x + this.w / 2;
    ctx.save();
    ctx.fillStyle = COLORS.fire;
    ctx.beginPath();
    ctx.moveTo(cx - this.w / 2, GROUND_Y);
    ctx.quadraticCurveTo(cx - this.w / 2 - 2, this.y + 22, cx - 4, this.y + flicker);
    ctx.quadraticCurveTo(cx + 10, this.y + 18, cx + this.w / 2, GROUND_Y);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffe066';
    ctx.beginPath();
    ctx.moveTo(cx - 9, GROUND_Y);
    ctx.quadraticCurveTo(cx - 10, this.y + 34, cx - 1, this.y + 20 + flicker);
    ctx.quadraticCurveTo(cx + 9, this.y + 34, cx + 9, GROUND_Y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}
