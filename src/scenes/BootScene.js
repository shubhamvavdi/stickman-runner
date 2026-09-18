/**
 * BootScene.js
 * Loading screen. There are no downloads to wait for, so it waits on fonts
 * and warms the audio graph, then moves on.
 */

import { Scene } from './Scene.js';
import { COLORS, GAME_HEIGHT, GAME_WIDTH, SCENE } from '../utils/Constants.js';

export class BootScene extends Scene {
  enter() {
    this.progress = 0;
    this.ready = false;
    const fonts = document.fonts ? document.fonts.ready : Promise.resolve();
    fonts.catch(() => {}).then(() => { this.ready = true; });
    window.setTimeout(() => { this.ready = true; }, 2500);
  }

  update(dt) {
    const target = this.ready ? 1 : 0.7;
    this.progress += (target - this.progress) * Math.min(1, dt * 2.6);
    if (this.progress > 0.995) {
      this.progress = 1;
      this.game.changeScene(SCENE.MENU);
    }
  }

  render(ctx) {
    ctx.fillStyle = COLORS.skyTop;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = COLORS.text;
    ctx.font = '600 34px "Chakra Petch", system-ui, sans-serif';
    ctx.fillText('Stickman Runner', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40);

    const barWidth = 320;
    const x = (GAME_WIDTH - barWidth) / 2;
    ctx.fillStyle = 'rgba(242,245,255,0.16)';
    ctx.fillRect(x, GAME_HEIGHT / 2, barWidth, 8);
    ctx.fillStyle = COLORS.groundLine;
    ctx.fillRect(x, GAME_HEIGHT / 2, barWidth * this.progress, 8);

    ctx.font = '500 15px "Chakra Petch", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(242,245,255,0.6)';
    ctx.fillText(`Loading ${Math.round(this.progress * 100)}%`, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 30);
    ctx.restore();
  }
}
