/**
 * GameScene.js
 * The run itself: spawning, physics, power-ups, collisions, HUD and the
 * pause flow. Everything it creates is pooled and reused between runs.
 */

import { Scene } from './Scene.js';
import { CONFIG } from '../config.js';
import {
  COLORS, GAME_HEIGHT, GAME_WIDTH, GROUND_Y, PIXELS_PER_METER, POWERUP_TYPE, SCENE
} from '../utils/Constants.js';
import { clamp } from '../utils/Random.js';
import { Background } from '../world/Background.js';
import { Ground } from '../world/Ground.js';
import { Player } from '../player/Player.js';
import { PlayerController } from '../player/PlayerController.js';
import { PlayerAnimation } from '../player/PlayerAnimation.js';
import { ObstacleManager } from '../obstacles/ObstacleManager.js';
import { Coin } from '../collectibles/Coin.js';
import { PowerUp } from '../collectibles/PowerUp.js';
import { ScoreSystem } from '../systems/ScoreSystem.js';
import { DifficultySystem } from '../systems/DifficultySystem.js';
import { CollisionSystem } from '../systems/CollisionSystem.js';
import { HUD } from '../ui/HUD.js';
import { PauseMenu } from '../ui/PauseMenu.js';

const PHASE = { COUNTDOWN: 'countdown', RUNNING: 'running', DYING: 'dying' };
const COIN_POOL_SIZE = 90;
const POWERUP_POOL_SIZE = 6;

export class GameScene extends Scene {
  constructor(game) {
    super(game);

    this.background = new Background(game.random);
    this.ground = new Ground();
    this.player = new Player();
    this.animation = new PlayerAnimation(this.player);
    this.controller = new PlayerController(this.player, game.input, game.audio);
    this.obstacles = new ObstacleManager(game.random);
    this.score = new ScoreSystem();
    this.difficulty = new DifficultySystem();
    this.hud = new HUD();

    this.coins = Array.from({ length: COIN_POOL_SIZE }, () => new Coin());
    this.powerups = Array.from({ length: POWERUP_POOL_SIZE }, () => new PowerUp());

    this.active = { coins: [], powerups: [] };
    this.effects = { magnet: 0, shield: 0, speed: 0 };
    this.shake = 0;

    this.collisions = new CollisionSystem({
      onObstacle: (obstacle) => this._onObstacle(obstacle),
      onCoin: (coin) => this._onCoin(coin),
      onPowerUp: (powerup) => this._onPowerUp(powerup),
      onPit: () => this._die('pit')
    });

    this.pauseMenu = new PauseMenu(game.uiRoot, {
      onResume: () => { game.audio.click(); this.resume(); },
      onRestart: () => { game.audio.click(); this.restart(); },
      onMenu: () => { game.audio.click(); this.quitToMenu(); }
    });

    this._offPause = game.input.on('pause', () => this.togglePause());
    this._offRestart = game.input.on('restart', () => {
      if (this.phase !== PHASE.COUNTDOWN) this.restart();
    });
    this._offPointer = game.input.on('pointer', (point) => {
      if (this.game.currentKey !== SCENE.GAME) return;
      if (!this.paused && HUD.hitTestPause(point)) {
        this.game.input.consumeTap(); // the press is the button, not a jump
        this.togglePause();
      }
    });
  }

  reset() {
    this.player.reset();
    this.animation.reset();
    this.obstacles.reset();
    this.score.reset();
    this.difficulty.reset();
    this.hud.reset();
    this.background.reset();
    this.ground.reset();
    this.coins.forEach((coin) => { coin.active = false; });
    this.powerups.forEach((powerup) => { powerup.active = false; });
    this.active.coins.length = 0;
    this.active.powerups.length = 0;
    this.effects.magnet = 0;
    this.effects.shield = 0;
    this.effects.speed = 0;
    this.shake = 0;
    this.spawnCursor = 520;
    this.powerupCooldown = 40;
    this.paused = false;
    this.deathTimer = 0;
    this.phase = PHASE.COUNTDOWN;
    this.countdown = 3.25;
    this.lastCountdownBeep = 4;
    this.revived = false;
  }

  enter(data) {
    this.game.ads.hideBanner(); // never an ad on screen during a run
    if (data && data.revive) {
      this._revive();
      return;
    }
    this.reset();
    this.controller.setEnabled(false);
    this.pauseMenu.hide();
    this.game.bridge.gameStarted();
    if (this.game.settings.music) this.game.audio.startMusic();
  }

  exit() {
    this.controller.setEnabled(false);
    this.pauseMenu.hide();
  }

  /**
   * Continue the current run after a rewarded ad. The score, distance and
   * coins carry over; the stretch of track around the player is cleared and a
   * short countdown plus invincibility gives them a fair restart.
   */
  _revive() {
    const distance = this.score.pixels;
    const coins = this.score.coins;
    const bonus = this.score.bonus;

    this.player.reset();
    this.animation.reset();

    for (let i = this.obstacles.active.length - 1; i >= 0; i -= 1) {
      const obstacle = this.obstacles.active[i];
      if (obstacle.x < GAME_WIDTH + 200) {
        obstacle.active = false;
        this.obstacles.active.splice(i, 1);
      }
    }
    for (let i = this.obstacles.gaps.length - 1; i >= 0; i -= 1) {
      const gap = this.obstacles.gaps[i];
      if (gap.x < GAME_WIDTH + 200) {
        gap.active = false;
        this.obstacles.gaps.splice(i, 1);
      }
    }

    this.score.pixels = distance;
    this.score.coins = coins;
    this.score.bonus = bonus;

    this.effects.magnet = 0;
    this.effects.speed = 0;
    this.effects.shield = 0;
    this.player.invincibleTimer = CONFIG.ads.reviveInvincibility;
    this.shake = 0;
    this.spawnCursor = 520;
    this.paused = false;
    this.deathTimer = 0;
    this.revived = true;
    this.phase = PHASE.COUNTDOWN;
    this.countdown = 2.2;
    this.lastCountdownBeep = 3;
    this.controller.setEnabled(false);
    this.pauseMenu.hide();
    if (this.game.settings.music) this.game.audio.startMusic();
  }

  // ---------------------------------------------------------------- flow

  togglePause() {
    if (this.game.currentKey !== SCENE.GAME) return;
    if (this.phase !== PHASE.RUNNING && this.phase !== PHASE.COUNTDOWN) return;
    if (this.paused) this.resume();
    else this.pause();
  }

  pause() {
    this.paused = true;
    this.controller.setEnabled(false);
    this.game.audio.stopMusic();
    this.game.bridge.gamePaused();
    this.pauseMenu.show(this.score.snapshot());
    this.game.stopLoop(); // nothing animates while paused
  }

  resume() {
    this.paused = false;
    this.pauseMenu.hide();
    this.phase = PHASE.COUNTDOWN;
    this.countdown = 1.2;
    this.lastCountdownBeep = 2;
    this.game.bridge.gameResumed();
    if (this.game.settings.music) this.game.audio.startMusic();
    this.game.startLoop();
  }

  restart() {
    this.paused = false;
    this.pauseMenu.hide();
    this.game.startLoop();
    this.game.changeScene(SCENE.GAME);
  }

  quitToMenu() {
    this.paused = false;
    this.pauseMenu.hide();
    this.game.startLoop();
    this.game.changeScene(SCENE.MENU);
  }

  // ------------------------------------------------------------- update

  get speed() {
    const boost = this.effects.speed > 0 ? CONFIG.speed.boostMultiplier : 1;
    return this.difficulty.speed * boost;
  }

  update(dt) {
    if (this.paused) return;

    if (this.phase === PHASE.COUNTDOWN) {
      this.countdown -= dt;
      const step = Math.ceil(this.countdown);
      if (step < this.lastCountdownBeep && step >= 0) {
        this.lastCountdownBeep = step;
        this.game.audio.countdown(step === 0);
      }
      if (this.countdown <= 0) {
        this.phase = PHASE.RUNNING;
        this.controller.setEnabled(true);
      }
      this.player.update(dt, { moving: false, jumpHeld: false });
      return;
    }

    const running = this.phase === PHASE.RUNNING;
    const scroll = (running ? this.speed : this.speed * 0.25) * dt;

    if (running) {
      this.score.addDistance(scroll);
      this.difficulty.update(this.score.distance);
      this._updateEffects(dt);
      this._spawn(scroll);
    }

    this.background.update(dt, scroll);
    this.ground.update(dt, scroll);
    this.obstacles.update(dt, scroll);
    this._updateCollectibles(dt, scroll);

    const result = this.player.update(dt, {
      moving: running,
      jumpHeld: this.game.input.jumpHeld
    });
    this.controller.handleJumpResult(result.jumped);
    this.player.speedBoost = this.effects.speed > 0;
    this.animation.update(dt, this.game.settings.reducedMotion);

    if (running) {
      this.collisions.update(this.player, {
        obstacles: this.obstacles.active,
        gaps: this.obstacles.gaps,
        coins: this.active.coins,
        powerups: this.active.powerups
      });
    } else {
      this.player.setGroundAvailable(CollisionSystem.groundUnder(this.player, this.obstacles.gaps));
    }

    this.hud.update(dt, this.score.total);
    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 2.4);

    if (this.phase === PHASE.DYING) {
      this.deathTimer -= dt;
      if (this.deathTimer <= 0) this._finish();
    }
  }

  _updateEffects(dt) {
    if (this.effects.magnet > 0) this.effects.magnet -= dt;
    if (this.effects.speed > 0) this.effects.speed -= dt;
    if (this.effects.shield > 0) this.effects.shield -= dt;
  }

  _updateCollectibles(dt, scroll) {
    const magnet = this.effects.magnet > 0
      ? { x: this.player.x, y: this.player.y - 40 }
      : null;

    for (let i = this.active.coins.length - 1; i >= 0; i -= 1) {
      const coin = this.active.coins[i];
      coin.update(dt, scroll, magnet);
      if (!coin.active) this.active.coins.splice(i, 1);
    }
    for (let i = this.active.powerups.length - 1; i >= 0; i -= 1) {
      const powerup = this.active.powerups[i];
      powerup.update(dt, scroll, this.game.settings.reducedMotion);
      if (!powerup.active) this.active.powerups.splice(i, 1);
    }
  }

  // ------------------------------------------------------------- spawn

  _spawn(scroll) {
    this.spawnCursor -= scroll;
    this.powerupCooldown -= scroll / PIXELS_PER_METER;
    if (this.spawnCursor > 0) return;

    const speed = this.speed;
    const footprint = this.obstacles.spawnPattern(this.difficulty, speed);
    const spacing = speed * this.difficulty.spacingTime;

    // The clear stretch after this pattern is where pickups are safe.
    const safeStart = GAME_WIDTH + 60 + footprint + spacing * 0.3;
    if (this.powerupCooldown <= 0 && this.game.random.chance(CONFIG.powerups.spawnChance)) {
      this._spawnPowerUp(safeStart);
      this.powerupCooldown = CONFIG.powerups.minSpacingMeters;
    } else if (this.game.random.chance(CONFIG.coins.patternChance)) {
      this._spawnCoinPattern(safeStart);
    }

    this.spawnCursor = footprint + spacing;
  }

  _takeCoin() {
    for (let i = 0; i < this.coins.length; i += 1) {
      if (!this.coins[i].active) return this.coins[i];
    }
    return null;
  }

  _addCoin(x, y) {
    const coin = this._takeCoin();
    if (!coin) return;
    coin.spawn(x, y);
    this.active.coins.push(coin);
  }

  _spawnCoinPattern(x) {
    const random = this.game.random;
    const style = random.pick(['line', 'arc', 'stairs', 'scatter']);
    const baseY = GROUND_Y - 52;
    const gapX = 42;

    if (style === 'line') {
      const count = random.int(4, 7);
      for (let i = 0; i < count; i += 1) this._addCoin(x + i * gapX, baseY);
    } else if (style === 'arc') {
      const count = 7;
      for (let i = 0; i < count; i += 1) {
        const t = i / (count - 1);
        const y = baseY - Math.sin(t * Math.PI) * 130;
        this._addCoin(x + i * gapX, y);
      }
    } else if (style === 'stairs') {
      const count = random.int(4, 6);
      for (let i = 0; i < count; i += 1) this._addCoin(x + i * gapX, baseY - i * 30);
    } else {
      const count = random.int(3, 6);
      for (let i = 0; i < count; i += 1) {
        this._addCoin(x + i * (gapX + random.range(-8, 16)), baseY - random.range(0, 110));
      }
    }
  }

  _spawnPowerUp(x) {
    const type = this.game.random.pick([POWERUP_TYPE.SHIELD, POWERUP_TYPE.MAGNET, POWERUP_TYPE.SPEED]);
    let free = null;
    for (let i = 0; i < this.powerups.length; i += 1) {
      if (!this.powerups[i].active) { free = this.powerups[i]; break; }
    }
    if (!free) return;
    free.spawn(x, GROUND_Y - 96, type);
    this.active.powerups.push(free);
  }

  // --------------------------------------------------------- collisions

  _onCoin(coin) {
    coin.collect();
    this.score.addCoin();
    this.game.audio.coin();
  }

  _onPowerUp(powerup) {
    powerup.active = false;
    this.score.addBonus();
    this.game.audio.powerup();
    if (powerup.type === POWERUP_TYPE.MAGNET) this.effects.magnet = CONFIG.powerups.magnetDuration;
    if (powerup.type === POWERUP_TYPE.SPEED) this.effects.speed = CONFIG.powerups.speedDuration;
    if (powerup.type === POWERUP_TYPE.SHIELD) {
      this.effects.shield = CONFIG.powerups.shieldDuration;
      this.game.audio.shield();
    }
  }

  _onObstacle(obstacle) {
    if (this.effects.shield > 0) {
      // A shield absorbs exactly one hit, then it is gone.
      this.effects.shield = 0;
      obstacle.active = false;
      this.player.takeHit();
      this.game.audio.shield();
      if (!this.game.settings.reducedMotion) this.shake = 0.5;
      return;
    }
    this._die('obstacle');
  }

  _die() {
    if (this.phase === PHASE.DYING) return;
    this.phase = PHASE.DYING;
    this.deathTimer = 0.85;
    this.controller.setEnabled(false);
    this.player.kill(true);
    this.game.audio.hit();
    this.game.audio.gameOver();
    this.game.audio.stopMusic();
    if (!this.game.settings.reducedMotion) this.shake = 1;
  }

  _finish() {
    const snapshot = this.score.snapshot();
    const { isRecord, best } = this.game.save.submitRun(snapshot);
    this.game.bridge.gameOver(snapshot);
    this.game.changeScene(SCENE.GAMEOVER, {
      ...snapshot,
      best: best.score,
      isRecord,
      canRevive: !this.revived
    });
  }

  // ------------------------------------------------------------- render

  render(ctx) {
    ctx.save();
    if (this.shake > 0) {
      const amount = this.shake * 9;
      ctx.translate((Math.random() - 0.5) * amount, (Math.random() - 0.5) * amount);
    }

    this.background.draw(ctx);
    this.obstacles.drawGaps(ctx);
    this.ground.draw(ctx, this.obstacles.gaps);
    this.obstacles.draw(ctx, this.game.settings.reducedMotion);

    for (let i = 0; i < this.active.coins.length; i += 1) {
      this.active.coins[i].draw(ctx, this.game.settings.reducedMotion);
    }
    for (let i = 0; i < this.active.powerups.length; i += 1) {
      this.active.powerups[i].draw(ctx);
    }

    this.animation.draw(ctx, {
      shield: this.effects.shield > 0,
      magnet: this.effects.magnet > 0,
      boost: this.effects.speed > 0
    });
    ctx.restore();

    this.hud.draw(ctx, {
      distance: this.score.distance,
      coins: this.score.coins,
      best: this.game.save.getBest().score,
      difficultyName: this.difficulty.name,
      powerups: this._activeEffects()
    });

    if (this.phase === PHASE.COUNTDOWN) this.hud.drawCountdown(ctx, this.countdown);
    if (this.phase === PHASE.DYING) {
      ctx.save();
      ctx.fillStyle = `rgba(10,12,24,${clamp(0.85 - this.deathTimer, 0, 0.55)})`;
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      ctx.restore();
    }
  }

  _activeEffects() {
    const list = [];
    if (this.effects.shield > 0) {
      list.push({ type: POWERUP_TYPE.SHIELD, remaining: this.effects.shield, duration: CONFIG.powerups.shieldDuration });
    }
    if (this.effects.magnet > 0) {
      list.push({ type: POWERUP_TYPE.MAGNET, remaining: this.effects.magnet, duration: CONFIG.powerups.magnetDuration });
    }
    if (this.effects.speed > 0) {
      list.push({ type: POWERUP_TYPE.SPEED, remaining: this.effects.speed, duration: CONFIG.powerups.speedDuration });
    }
    return list;
  }

  /** Used by the game-over screen to keep the last frame on screen. */
  renderStatic(ctx) {
    this.background.draw(ctx);
    this.obstacles.drawGaps(ctx);
    this.ground.draw(ctx, this.obstacles.gaps);
    this.obstacles.draw(ctx, true);
    this.animation.draw(ctx);
    ctx.save();
    ctx.fillStyle = 'rgba(10,12,24,0.62)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    ctx.restore();
  }

  destroy() {
    this.controller.destroy();
    this.pauseMenu.destroy();
    this._offPause();
    this._offRestart();
    this._offPointer();
  }
}
