import { Obstacle } from './Obstacle.js';
import { COLORS, GROUND_Y, OBSTACLE_TYPE } from '../utils/Constants.js';

/** Drone that patrols up and down between two heights. */
export class MovingObstacle extends Obstacle {
  constructor() {
    super(OBSTACLE_TYPE.MOVING);
    this.w = 54;
    this.h = 30;
    this.padX = 5;
  }

  spawn(x, { top = GROUND_Y - 190, bottom = GROUND_Y - 96, speed = 90 } = {}) {
    super.spawn(x);
    this.top = top;
    this.bottom = bottom;
    this.speed = speed;
    this.y = bottom;
    this.dir = -1;
    return this;
  }

  update(dt, scroll) {
    super.update(dt, scroll);
    this.y += this.dir * this.speed * dt;
    if (this.y <= this.top) { this.y = this.top; this.dir = 1; }
    if (this.y >= this.bottom) { this.y = this.bottom; this.dir = -1; }
  }

  draw(ctx) {
    ctx.save();
    ctx.fillStyle = '#7a5cc7';
    ctx.beginPath();
    ctx.ellipse(this.x + this.w / 2, this.y + this.h / 2, this.w / 2, this.h / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.danger;
    ctx.beginPath();
    ctx.arc(this.x + this.w / 2, this.y + this.h / 2, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(this.x + 6, this.y + 4);
    ctx.lineTo(this.x + this.w - 6, this.y + 4);
    ctx.stroke();
    ctx.restore();
  }
}
