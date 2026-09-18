import { Obstacle } from './Obstacle.js';
import { COLORS, GROUND_Y, OBSTACLE_TYPE } from '../utils/Constants.js';

/** Ground spike. Small, cheap, always jumpable. */
export class Spike extends Obstacle {
  constructor() {
    super(OBSTACLE_TYPE.SPIKE);
    this.w = 30;
    this.h = 38;
    this.padX = 7;
  }

  spawn(x) {
    super.spawn(x);
    this.y = GROUND_Y - this.h;
    return this;
  }

  draw(ctx) {
    ctx.save();
    ctx.fillStyle = COLORS.danger;
    ctx.beginPath();
    ctx.moveTo(this.x, GROUND_Y);
    ctx.lineTo(this.x + this.w / 2, this.y);
    ctx.lineTo(this.x + this.w, GROUND_Y);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.beginPath();
    ctx.moveTo(this.x + this.w / 2, this.y);
    ctx.lineTo(this.x + this.w / 2 + 5, GROUND_Y);
    ctx.lineTo(this.x + this.w / 2, GROUND_Y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}
