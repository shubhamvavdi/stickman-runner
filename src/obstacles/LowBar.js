import { Obstacle } from './Obstacle.js';
import { COLORS, GROUND_Y, OBSTACLE_TYPE } from '../utils/Constants.js';

/** Overhead beam. The only safe answer is a slide. */
export class LowBar extends Obstacle {
  constructor() {
    super(OBSTACLE_TYPE.LOWBAR);
    this.w = 96;
    this.h = 90;
    this.padX = 3;
  }

  spawn(x) {
    super.spawn(x);
    // Bottom edge sits above a sliding player and below a standing one.
    this.y = GROUND_Y - 132;
    this.h = 90;
    return this;
  }

  getBounds() {
    return { x: this.x + this.padX, y: this.y, w: this.w - this.padX * 2, h: this.h };
  }

  draw(ctx) {
    ctx.save();
    ctx.fillStyle = '#3a4066';
    ctx.fillRect(this.x, this.y, this.w, this.h);
    ctx.fillStyle = COLORS.danger;
    ctx.fillRect(this.x, this.y + this.h - 10, this.w, 10);
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    for (let i = 0; i < 4; i += 1) {
      ctx.fillRect(this.x + 8 + i * 22, this.y + 8, 10, this.h - 26);
    }
    ctx.restore();
  }
}
