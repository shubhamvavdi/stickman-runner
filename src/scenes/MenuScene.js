/**
 * MenuScene.js
 * Title screen. The world keeps scrolling slowly behind the panel and the
 * stickman jogs on the spot, so the game reads as alive before Play.
 */

import { Scene } from './Scene.js';
import { CONFIG } from '../config.js';
import { Background } from '../world/Background.js';
import { Ground } from '../world/Ground.js';
import { Player } from '../player/Player.js';
import { PlayerAnimation } from '../player/PlayerAnimation.js';
import { MainMenu } from '../ui/MainMenu.js';
import { PLAYER_STATE, SCENE } from '../utils/Constants.js';

const EMPTY = [];

export class MenuScene extends Scene {
  constructor(game) {
    super(game);
    this.background = new Background(game.random);
    this.ground = new Ground();
    this.player = new Player();
    this.animation = new PlayerAnimation(this.player);
    this.ui = new MainMenu(game.uiRoot, {
      onPlay: () => {
        game.audio.unlock();
        game.audio.click();
        game.changeScene(SCENE.GAME);
      },
      onSettings: () => {
        game.audio.click();
        game.changeScene(SCENE.SETTINGS);
      },
      onClick: () => game.audio.click()
    });
  }

  enter() {
    this.ui.setBest(this.game.save.getBest().score);
    this.ui.show();
    this.game.ads.showBanner(CONFIG.ads.placements.menu);
    this.player.reset();
    this.player.state = PLAYER_STATE.RUN;
    if (this.game.settings.music) this.game.audio.startMusic();
  }

  exit() {
    this.ui.hide();
    this.game.ads.hideBanner();
  }

  update(dt) {
    const scroll = 120 * dt;
    this.background.update(dt, scroll);
    this.ground.update(dt, scroll);
    this.player.runPhase += dt * 8;
  }

  render(ctx) {
    this.background.draw(ctx);
    this.ground.draw(ctx, EMPTY);
    this.animation.draw(ctx);
  }

  destroy() {
    this.ui.destroy();
  }
}
