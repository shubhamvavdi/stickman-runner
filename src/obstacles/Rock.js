import { Obstacle } from './Obstacle.js';
import { COLORS, GROUND_Y, OBSTACLE_TYPE } from '../utils/Constants.js';

/** Blocky boulder. Taller than a spike, so it demands a real jump. */
export class Rock extends Obstacle {
  constructor() {
    super(OBSTACLE_TYPE.ROCK);
    this.w = 48;
    this.h = 48;
    this.padX = 5;
  }

  spawn(x, size = 1) {
    super.spawn(x);
    this.w = 44 + size * 6;
    this.h = 42 + size * 8;
    this.y = GROUND_Y - this.h;
    return this;
  }

  draw(ctx) {
    const { x, y, w, h } = this;
    ctx.save();
    ctx.fillStyle = '#4b5273';
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    ctx.lineTo(x + w * 0.12, y + h * 0.3);
    ctx.lineTo(x + w * 0.45, y);
    ctx.lineTo(x + w * 0.82, y + h * 0.22);
    ctx.lineTo(x + w, y + h);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#5f688e';
    ctx.beginPath();
    ctx.moveTo(x + w * 0.45, y);
    ctx.lineTo(x + w * 0.82, y + h * 0.22);
    ctx.lineTo(x + w * 0.6, y + h * 0.6);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }
}
