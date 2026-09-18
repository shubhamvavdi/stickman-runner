import { Obstacle } from './Obstacle.js';
import { COLORS, GROUND_Y, OBSTACLE_TYPE, PLAYER_X } from '../utils/Constants.js';

/**
 * Rock that hangs overhead and drops when the player gets close. It telegraphs
 * for a moment first, so it is a reaction test rather than a coin flip.
 */
export class FallingObstacle extends Obstacle {
  constructor() {
    super(OBSTACLE_TYPE.FALLING);
    this.w = 42;
    this.h = 42;
    this.padX = 5;
  }

  spawn(x) {
    super.spawn(x);
    this.y = GROUND_Y - 300;
    this.vy = 0;
    this.warned = false;
    this.warnTimer = 0;
    this.landed = false;
    return this;
  }

  update(dt, scroll) {
    super.update(dt, scroll);
    if (!this.warned && this.x - PLAYER_X < 420) {
      this.warned = true;
      this.warnTimer = 0.45;
    }
    if (this.warned && this.warnTimer > 0) {
      this.warnTimer -= dt;
    } else if (this.warned && !this.landed) {
      this.vy += 2100 * dt;
      this.y += this.vy * dt;
      if (this.y >= GROUND_Y - this.h) {
        this.y = GROUND_Y - this.h;
        this.landed = true;
      }
    }
  }

  draw(ctx) {
    ctx.save();
    if (this.warned && this.warnTimer > 0) {
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = COLORS.danger;
      ctx.fillRect(this.x + 6, GROUND_Y - 6, this.w - 12, 6);
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = '#6b5a8f';
    ctx.fillRect(this.x, this.y, this.w, this.h);
    ctx.fillStyle = '#8a76b5';
    ctx.fillRect(this.x + 6, this.y + 6, this.w - 20, this.h - 22);
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 2;
    ctx.strokeRect(this.x, this.y, this.w, this.h);
    ctx.restore();
  }
}
