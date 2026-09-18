/**
 * Coin.js
 * Pooled collectible. The "rotation" is a cheap horizontal squash, which
 * costs nothing compared to a sprite sheet.
 */

import { CONFIG } from '../config.js';
import { COLORS } from '../utils/Constants.js';

export class Coin {
  constructor() {
    this.active = false;
    this.collected = false;
    this.radius = CONFIG.coins.radius;
    this.x = 0;
    this.y = 0;
    this.phase = 0;
    this.vx = 0;
    this.vy = 0;
  }

  spawn(x, y) {
    this.active = true;
    this.collected = false;
    this.x = x;
    this.y = y;
    this.phase = Math.random() * Math.PI * 2;
    this.vx = 0;
    this.vy = 0;
    return this;
  }

  update(dt, scroll, magnet) {
    this.x -= scroll;
    this.phase += dt * 6;

    if (magnet) {
      const dx = magnet.x - this.x;
      const dy = magnet.y - this.y;
      const distance = Math.hypot(dx, dy);
      if (distance < CONFIG.powerups.magnetRadius && distance > 0.01) {
        const pull = CONFIG.powerups.magnetPull * dt;
        this.x += (dx / distance) * pull;
        this.y += (dy / distance) * pull;
      }
    }

    if (this.x < -60) this.active = false;
  }

  collect() {
    this.collected = true;
    this.active = false;
  }

  draw(ctx, reducedMotion) {
    const squash = reducedMotion ? 1 : Math.abs(Math.cos(this.phase));
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(Math.max(0.18, squash), 1);
    ctx.fillStyle = COLORS.coin;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.arc(0, 0, this.radius * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
