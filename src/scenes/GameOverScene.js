/**
 * GameOverScene.js
 * Freezes the final frame behind the results panel.
 */

import { Scene } from './Scene.js';
import { CONFIG } from '../config.js';
import { GameOverUI } from '../ui/GameOverUI.js';
import { SCENE } from '../utils/Constants.js';

export class GameOverScene extends Scene {
  constructor(game) {
    super(game);
    this.result = { score: 0, distance: 0, coins: 0, best: 0, isRecord: false };
    this.ui = new GameOverUI(game.uiRoot, {
      onRestart: () => { game.audio.click(); this.restart(); },
      onMenu: () => { game.audio.click(); game.changeScene(SCENE.MENU); },
      onRevive: () => this.revive()
    });
    this._offRestart = game.input.on('restart', () => {
      if (game.currentKey === SCENE.GAMEOVER) this.restart();
    });
  }

  enter(data) {
    if (data) this.result = data;
    this.ui.show(this.result);
    this.ui.setReviveAvailable(this.result.canRevive === true && this.game.ads.available);
    this.game.ads.showBanner(CONFIG.ads.placements.gameOver);
  }

  exit() {
    this.ui.hide();
    this.game.ads.hideBanner();
  }

  /** Rewarded ad: only continues the run if the reward was actually earned. */
  async revive() {
    this.game.audio.click();
    this.ui.setReviveLoading();
    this.game.ads.hideBanner();
    const earned = await this.game.ads.showRewarded(CONFIG.ads.placements.revive);
    if (!earned) {
      this.ui.setReviveFailed();
      this.game.ads.showBanner(CONFIG.ads.placements.gameOver);
      return;
    }
    this.game.changeScene(SCENE.GAME, { revive: true });
  }

  /**
   * An interstitial plays between runs, never during one, and only every Nth
   * run so the pacing stays playable.
   */
  async restart() {
    const runs = this.game.save.getStats().runs;
    const every = CONFIG.ads.interstitialEveryRuns;
    const due = every > 0 && runs > 0 && runs % every === 0;
    if (due && this.game.ads.available) {
      this.ui.hide();
      await this.game.ads.showInterstitial(CONFIG.ads.placements.gameOver);
      if (this.game.currentKey !== SCENE.GAMEOVER) return; // player left meanwhile
    }
    this.game.changeScene(SCENE.GAME);
  }

  update() {
    // Static screen: the loop still runs so the canvas stays composited,
    // but nothing is simulated.
  }

  render(ctx) {
    const gameScene = this.game.scenes.get(SCENE.GAME);
    if (gameScene) gameScene.renderStatic(ctx);
  }

  destroy() {
    this.ui.destroy();
    this._offRestart();
  }
}
