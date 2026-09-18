/**
 * PowerUp.js
 * Pooled pickup with three flavours. The glyph is drawn with paths so the
 * icon scales cleanly at any resolution.
 */

import { COLORS, POWERUP_TYPE } from '../utils/Constants.js';

const TINT = {
  [POWERUP_TYPE.MAGNET]: COLORS.magnet,
  [POWERUP_TYPE.SHIELD]: COLORS.shield,
  [POWERUP_TYPE.SPEED]: COLORS.speed
};

export class PowerUp {
  constructor() {
    this.active = false;
    this.type = POWERUP_TYPE.SHIELD;
    this.x = 0;
    this.y = 0;
    this.radius = 20;
    this.phase = 0;
  }

  spawn(x, y, type) {
    this.active = true;
    this.x = x;
    this.y = y;
    this.type = type;
    this.phase = 0;
    return this;
  }

  update(dt, scroll, reducedMotion) {
    this.x -= scroll;
    this.phase += dt * 3;
    if (!reducedMotion) this.y += Math.sin(this.phase) * 0.35;
    if (this.x < -60) this.active = false;
  }

  draw(ctx) {
    const color = TINT[this.type] || COLORS.text;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius + 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = COLORS.ink;
    ctx.fillStyle = COLORS.ink;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';

    if (this.type === POWERUP_TYPE.SHIELD) {
      ctx.beginPath();
      ctx.moveTo(0, -10);
      ctx.lineTo(9, -5);
      ctx.lineTo(9, 3);
      ctx.quadraticCurveTo(9, 9, 0, 12);
      ctx.quadraticCurveTo(-9, 9, -9, 3);
      ctx.lineTo(-9, -5);
      ctx.closePath();
      ctx.fill();
    } else if (this.type === POWERUP_TYPE.MAGNET) {
      ctx.beginPath();
      ctx.arc(0, 1, 8, Math.PI, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-8, 1); ctx.lineTo(-8, 9);
      ctx.moveTo(8, 1); ctx.lineTo(8, 9);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(3, -12);
      ctx.lineTo(-7, 2);
      ctx.lineTo(0, 2);
      ctx.lineTo(-3, 12);
      ctx.lineTo(8, -3);
      ctx.lineTo(1, -3);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }
}
