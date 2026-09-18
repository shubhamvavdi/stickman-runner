/**
 * PlayerAnimation.js
 * Procedural stickman: joints are computed with sine waves, nothing is
 * loaded from disk, so the character is original and weighs nothing.
 */

import { COLORS, PLAYER_STATE } from '../utils/Constants.js';

const HIP = -40;
const SHOULDER = -66;
const HEAD = -80;
const HEAD_RADIUS = 11;

function limb(ctx, x1, y1, x2, y2) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

export class PlayerAnimation {
  constructor(player) {
    this.player = player;
    this.trail = [];
  }

  reset() {
    this.trail.length = 0;
  }

  update(dt, reducedMotion) {
    if (reducedMotion) {
      this.trail.length = 0;
      return;
    }
    const player = this.player;
    if (!player.isDead && (player.state === PLAYER_STATE.SLIDE || player.speedBoost)) {
      this.trail.push({ x: player.x, y: player.y, life: 0.3 });
    }
    for (let i = this.trail.length - 1; i >= 0; i -= 1) {
      this.trail[i].life -= dt;
      this.trail[i].x -= 260 * dt;
      if (this.trail[i].life <= 0) this.trail.splice(i, 1);
    }
  }

  draw(ctx, options = {}) {
    const player = this.player;
    const { shield = false, magnet = false, boost = false } = options;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (const ghost of this.trail) {
      ctx.globalAlpha = Math.max(0, ghost.life) * 0.35;
      ctx.strokeStyle = COLORS.speed;
      ctx.lineWidth = 4;
      limb(ctx, ghost.x, ghost.y - 30, ghost.x, ghost.y - 4);
    }
    ctx.globalAlpha = 1;

    ctx.translate(player.x, player.y);

    if (player.invincible && player.hitTimer <= 0 && Math.floor(performance.now() / 70) % 2 === 0) {
      ctx.globalAlpha = 0.35;
    }

    ctx.strokeStyle = COLORS.player;
    ctx.fillStyle = COLORS.player;
    ctx.lineWidth = 5;

    switch (player.state) {
      case PLAYER_STATE.SLIDE:
        this._drawSlide(ctx);
        break;
      case PLAYER_STATE.JUMP:
        this._drawAir(ctx, true);
        break;
      case PLAYER_STATE.FALL:
        this._drawAir(ctx, false);
        break;
      case PLAYER_STATE.DEAD:
        this._drawDead(ctx);
        break;
      case PLAYER_STATE.HIT:
        ctx.strokeStyle = COLORS.danger;
        ctx.fillStyle = COLORS.danger;
        this._drawRun(ctx, player.runPhase);
        break;
      case PLAYER_STATE.IDLE:
        this._drawIdle(ctx);
        break;
      default:
        this._drawRun(ctx, player.runPhase);
        break;
    }

    ctx.globalAlpha = 1;
    if (shield) this._drawShield(ctx);
    if (magnet) this._drawMagnet(ctx);
    if (boost) this._drawBoost(ctx);
    ctx.restore();
  }

  _head(ctx, cx, cy, radius = HEAD_RADIUS) {
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawIdle(ctx) {
    this._head(ctx, 0, HEAD);
    limb(ctx, 0, SHOULDER, 0, HIP);
    limb(ctx, 0, SHOULDER, -12, HIP + 4);
    limb(ctx, 0, SHOULDER, 12, HIP + 4);
    limb(ctx, 0, HIP, -9, 0);
    limb(ctx, 0, HIP, 9, 0);
  }

  _drawRun(ctx, phase) {
    const swing = Math.sin(phase);
    const swing2 = Math.sin(phase + Math.PI);
    const bob = Math.abs(Math.cos(phase)) * 3;

    ctx.save();
    ctx.translate(0, -bob);
    this._head(ctx, 4, HEAD);
    limb(ctx, 2, SHOULDER, 0, HIP);

    // arms
    limb(ctx, 2, SHOULDER, 2 + swing * 16, SHOULDER + 18);
    limb(ctx, 2 + swing * 16, SHOULDER + 18, 2 + swing * 24, SHOULDER + 30 - Math.abs(swing) * 6);
    limb(ctx, 2, SHOULDER, 2 + swing2 * 16, SHOULDER + 18);
    limb(ctx, 2 + swing2 * 16, SHOULDER + 18, 2 + swing2 * 24, SHOULDER + 30 - Math.abs(swing2) * 6);

    // legs with a knee joint
    const kneeA = { x: swing * 15, y: HIP + 20 };
    const kneeB = { x: swing2 * 15, y: HIP + 20 };
    limb(ctx, 0, HIP, kneeA.x, kneeA.y);
    limb(ctx, kneeA.x, kneeA.y, kneeA.x + swing * 12, bob);
    limb(ctx, 0, HIP, kneeB.x, kneeB.y);
    limb(ctx, kneeB.x, kneeB.y, kneeB.x + swing2 * 12, bob);
    ctx.restore();
  }

  _drawAir(ctx, rising) {
    const tuck = rising ? 1 : -1;
    this._head(ctx, 5, HEAD + 2);
    limb(ctx, 3, SHOULDER, 0, HIP);
    limb(ctx, 3, SHOULDER, 20, SHOULDER - 10 * tuck);
    limb(ctx, 3, SHOULDER, -16, SHOULDER + 14 * tuck);
    limb(ctx, 0, HIP, 16, HIP + 22);
    limb(ctx, 16, HIP + 22, 22, HIP + 34 - 6 * tuck);
    limb(ctx, 0, HIP, -14, HIP + 20);
    limb(ctx, -14, HIP + 20, -18, HIP + 36);
  }

  _drawSlide(ctx) {
    ctx.save();
    ctx.translate(-8, -6);
    ctx.rotate(-Math.PI / 2.35);
    this._head(ctx, 0, HEAD + 14, HEAD_RADIUS - 1);
    limb(ctx, 0, SHOULDER + 12, 0, HIP);
    limb(ctx, 0, SHOULDER + 14, -18, SHOULDER + 2);
    limb(ctx, 0, HIP, 14, HIP + 20);
    limb(ctx, 14, HIP + 20, 10, HIP + 36);
    limb(ctx, 0, HIP, -4, HIP + 24);
    ctx.restore();
  }

  _drawDead(ctx) {
    ctx.save();
    ctx.rotate(0.6);
    this._head(ctx, 0, HEAD);
    limb(ctx, 0, SHOULDER, 0, HIP);
    limb(ctx, 0, SHOULDER, -22, SHOULDER - 6);
    limb(ctx, 0, SHOULDER, 20, SHOULDER - 12);
    limb(ctx, 0, HIP, -18, HIP + 26);
    limb(ctx, 0, HIP, 16, HIP + 28);
    ctx.restore();
  }

  _drawShield(ctx) {
    ctx.save();
    ctx.strokeStyle = COLORS.shield;
    ctx.globalAlpha = 0.55 + Math.sin(performance.now() / 180) * 0.15;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(2, -42, 38, 52, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  _drawMagnet(ctx) {
    ctx.save();
    ctx.strokeStyle = COLORS.magnet;
    ctx.lineWidth = 2;
    const t = performance.now() / 400;
    for (let i = 0; i < 3; i += 1) {
      ctx.globalAlpha = 0.5 - i * 0.14;
      const radius = 46 + ((t * 40 + i * 22) % 60);
      ctx.beginPath();
      ctx.arc(2, -42, radius, -0.9, 0.9);
      ctx.stroke();
    }
    ctx.restore();
  }

  _drawBoost(ctx) {
    ctx.save();
    ctx.strokeStyle = COLORS.speed;
    ctx.globalAlpha = 0.6;
    ctx.lineWidth = 3;
    for (let i = 0; i < 3; i += 1) {
      const y = -20 - i * 18;
      limb(ctx, -26 - i * 6, y, -52 - i * 10, y);
    }
    ctx.restore();
  }
}
