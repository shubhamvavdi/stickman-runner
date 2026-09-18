/**
 * HUD.js
 * Drawn on the canvas rather than in the DOM: the values change 60 times a
 * second and DOM writes at that rate cause layout thrash on phones.
 */

import { COLORS, GAME_WIDTH, POWERUP_TYPE } from '../utils/Constants.js';

const PAUSE_BUTTON = { x: GAME_WIDTH - 52, y: 74, r: 22 };

const LABELS = {
  [POWERUP_TYPE.MAGNET]: 'Magnet',
  [POWERUP_TYPE.SHIELD]: 'Shield',
  [POWERUP_TYPE.SPEED]: 'Boost'
};

const TINT = {
  [POWERUP_TYPE.MAGNET]: COLORS.magnet,
  [POWERUP_TYPE.SHIELD]: COLORS.shield,
  [POWERUP_TYPE.SPEED]: COLORS.speed
};

export class HUD {
  constructor() {
    this.shownScore = 0;
  }

  reset() {
    this.shownScore = 0;
  }

  /** Score counts up smoothly instead of snapping when coins land. */
  update(dt, target) {
    this.shownScore += (target - this.shownScore) * Math.min(1, dt * 12);
    if (Math.abs(target - this.shownScore) < 1) this.shownScore = target;
  }

  draw(ctx, data) {
    const { distance, coins, best, powerups, difficultyName } = data;
    ctx.save();
    ctx.textBaseline = 'top';

    this._label(ctx, 24, 22, 'Score', 'left');
    this._value(ctx, 24, 40, Math.floor(this.shownScore).toLocaleString(), 'left');

    this._label(ctx, GAME_WIDTH / 2, 22, 'Distance', 'center');
    this._value(ctx, GAME_WIDTH / 2, 40, `${distance} m`, 'center');

    this._label(ctx, GAME_WIDTH - 24, 22, 'Coins', 'right');
    ctx.save();
    ctx.fillStyle = COLORS.coin;
    ctx.beginPath();
    ctx.arc(GAME_WIDTH - 24 - this._measure(ctx, String(coins)) - 14, 52, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    this._value(ctx, GAME_WIDTH - 24, 40, String(coins), 'right');

    ctx.globalAlpha = 0.55;
    this._label(ctx, 24, 74, `Best ${best.toLocaleString()} · ${difficultyName}`, 'left');
    ctx.globalAlpha = 1;

    this._drawPauseButton(ctx);
    this._drawPowerups(ctx, powerups);
    ctx.restore();
  }

  _measure(ctx, text) {
    ctx.font = '600 30px "Chakra Petch", system-ui, sans-serif';
    return ctx.measureText(text).width;
  }

  _label(ctx, x, y, text, align) {
    ctx.font = '500 15px "Chakra Petch", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(242,245,255,0.65)';
    ctx.textAlign = align;
    ctx.fillText(text, x, y);
  }

  _value(ctx, x, y, text, align) {
    ctx.font = '600 30px "Chakra Petch", system-ui, sans-serif';
    ctx.fillStyle = COLORS.text;
    ctx.textAlign = align;
    ctx.fillText(text, x, y);
  }

  _drawPauseButton(ctx) {
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = 'rgba(10,12,24,0.55)';
    ctx.strokeStyle = 'rgba(242,245,255,0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(PAUSE_BUTTON.x, PAUSE_BUTTON.y, PAUSE_BUTTON.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = COLORS.text;
    ctx.fillRect(PAUSE_BUTTON.x - 7, PAUSE_BUTTON.y - 9, 5, 18);
    ctx.fillRect(PAUSE_BUTTON.x + 2, PAUSE_BUTTON.y - 9, 5, 18);
    ctx.restore();
  }

  static hitTestPause(point) {
    const dx = point.x - PAUSE_BUTTON.x;
    const dy = point.y - PAUSE_BUTTON.y;
    return dx * dx + dy * dy <= (PAUSE_BUTTON.r + 12) ** 2;
  }

  _drawPowerups(ctx, powerups) {
    let y = 108;
    for (const entry of powerups) {
      const ratio = Math.max(0, entry.remaining / entry.duration);
      ctx.save();
      ctx.fillStyle = 'rgba(10,12,24,0.5)';
      ctx.fillRect(24, y, 168, 22);
      ctx.fillStyle = TINT[entry.type];
      ctx.fillRect(24, y, 168 * ratio, 22);
      ctx.fillStyle = COLORS.ink;
      ctx.font = '600 13px "Chakra Petch", system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${LABELS[entry.type]}  ${entry.remaining.toFixed(1)}s`, 32, y + 5);
      ctx.restore();
      y += 28;
    }
  }

  /** Big 3-2-1-Go text between the menu and the first stride. */
  drawCountdown(ctx, value) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const text = value > 0 ? String(Math.ceil(value)) : 'Go';
    const fraction = value > 0 ? 1 - (value % 1) : 1;
    ctx.globalAlpha = 0.35 + fraction * 0.65;
    ctx.fillStyle = COLORS.text;
    ctx.font = `700 ${120 + fraction * 18}px "Chakra Petch", system-ui, sans-serif`;
    ctx.fillText(text, GAME_WIDTH / 2, 236);
    ctx.restore();
  }
}
