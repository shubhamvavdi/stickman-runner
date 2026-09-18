/**
 * game.js
 * Owns the canvas, the render transform, the frame loop and the scene stack.
 * Gameplay always works in a 960x540 virtual space; this file is the only
 * place that knows about real pixels.
 */

import { CONFIG } from './config.js';
import { COLORS, GAME_HEIGHT, GAME_WIDTH, SCENE } from './utils/Constants.js';
import { Random } from './utils/Random.js';
import { Input } from './utils/Input.js';
import { SaveSystem } from './systems/SaveSystem.js';
import { AudioSystem } from './systems/AudioSystem.js';
import { GameHubBridge } from './integration/GameHub.js';
import { AdSystem } from './integration/AdSystem.js';
import { BootScene } from './scenes/BootScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { GameScene } from './scenes/GameScene.js';
import { GameOverScene } from './scenes/GameOverScene.js';
import { SettingsScene } from './scenes/SettingsScene.js';

export class Game {
  constructor({ canvas, uiRoot, gameId = 'stickman-runner' }) {
    this.canvas = canvas;
    this.uiRoot = uiRoot;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.random = new Random();
    this.save = new SaveSystem();
    this.settings = this.save.getSettings();
    this.audio = new AudioSystem(this.settings);
    this.input = new Input(canvas);
    this.bridge = new GameHubBridge(gameId);
    this.ads = new AdSystem(this.audio);

    this.scenes = new Map();
    this.current = null;
    this.currentKey = null;
    this.running = false;
    this._rafId = 0;
    this._lastTime = 0;
    this.scale = 1;
    this.offsetX = 0;
    this.offsetY = 0;

    this._onResize = () => this.resize();
    this._onVisibility = () => {
      if (document.hidden) this._autoPause();
    };
    this._onFirstGesture = () => this._unlockAudio();

    window.addEventListener('resize', this._onResize);
    window.addEventListener('orientationchange', this._onResize);
    document.addEventListener('visibilitychange', this._onVisibility);
    window.addEventListener('pointerdown', this._onFirstGesture);
    window.addEventListener('keydown', this._onFirstGesture);
    this._offBlur = this.input.on('blur', () => this._autoPause());

    this.canvas.__toGame = (x, y) => ({
      x: (x - this.offsetX) / this.scale,
      y: (y - this.offsetY) / this.scale
    });

    this.scenes.set(SCENE.BOOT, new BootScene(this));
    this.scenes.set(SCENE.MENU, new MenuScene(this));
    this.scenes.set(SCENE.GAME, new GameScene(this));
    this.scenes.set(SCENE.GAMEOVER, new GameOverScene(this));
    this.scenes.set(SCENE.SETTINGS, new SettingsScene(this));

    this.resize();
  }

  _unlockAudio() {
    this.audio.unlock();
    if (this.settings.music && this.currentKey !== SCENE.BOOT) this.audio.startMusic();
    window.removeEventListener('pointerdown', this._onFirstGesture);
    window.removeEventListener('keydown', this._onFirstGesture);
  }

  _autoPause() {
    const scene = this.scenes.get(SCENE.GAME);
    if (this.currentKey === SCENE.GAME && scene && !scene.paused) scene.pause();
  }

  applySetting(key, value) {
    this.settings = this.save.setSetting(key, value);
    if (key === 'sound') this.audio.setSound(value);
    if (key === 'music') this.audio.setMusic(value);
    return this.settings;
  }

  changeScene(key, data) {
    const next = this.scenes.get(key);
    if (!next) throw new Error(`Unknown scene: ${key}`);
    if (this.current) this.current.exit();
    this.current = next;
    this.currentKey = key;
    next.enter(data);
    next.resize(this.scale);
    if (!this.running) this.startLoop();
  }

  /** Letterboxes the 16:9 play field into any window without stretching. */
  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, CONFIG.render.maxDpr);
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));

    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    const backingWidth = Math.floor(width * dpr);
    const backingHeight = Math.floor(height * dpr);
    if (this.canvas.width !== backingWidth || this.canvas.height !== backingHeight) {
      this.canvas.width = backingWidth;
      this.canvas.height = backingHeight;
    }

    this.scale = Math.min(width / GAME_WIDTH, height / GAME_HEIGHT);
    this.offsetX = (width - GAME_WIDTH * this.scale) / 2;
    this.offsetY = (height - GAME_HEIGHT * this.scale) / 2;
    this._dpr = dpr;

    if (this.current) this.current.resize(this.scale);
    if (!this.running) this.renderFrame();
  }

  startLoop() {
    if (this.running) return;
    this.running = true;
    this._lastTime = performance.now();
    this._rafId = requestAnimationFrame((t) => this._frame(t));
  }

  stopLoop() {
    this.running = false;
    if (this._rafId) cancelAnimationFrame(this._rafId);
    this._rafId = 0;
  }

  _frame(timestamp) {
    if (!this.running) return;
    const delta = Math.min((timestamp - this._lastTime) / 1000, CONFIG.render.maxFrameDelta);
    this._lastTime = timestamp;
    if (this.current) this.current.update(delta);
    this.renderFrame();
    this._rafId = requestAnimationFrame((t) => this._frame(t));
  }

  renderFrame() {
    const ctx = this.ctx;
    const dpr = this._dpr || 1;
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = COLORS.ink;
    ctx.fillRect(0, 0, this.canvas.width / dpr, this.canvas.height / dpr);
    ctx.setTransform(this.scale * dpr, 0, 0, this.scale * dpr, this.offsetX * dpr, this.offsetY * dpr);
    // Clip to the play field so nothing bleeds into the letterbox bars.
    ctx.beginPath();
    ctx.rect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    ctx.clip();
    if (this.current) this.current.render(ctx);
    ctx.restore();
  }

  start() {
    this.bridge.ready();
    // Ads initialise in the background: the game never waits on the network.
    this.ads.init().catch(() => {});
    this.changeScene(SCENE.BOOT);
  }

  destroy() {
    this.stopLoop();
    window.removeEventListener('resize', this._onResize);
    window.removeEventListener('orientationchange', this._onResize);
    document.removeEventListener('visibilitychange', this._onVisibility);
    window.removeEventListener('pointerdown', this._onFirstGesture);
    window.removeEventListener('keydown', this._onFirstGesture);
    this._offBlur();
    this.scenes.forEach((scene) => scene.destroy());
    this.scenes.clear();
    this.ads.destroy();
    this.input.destroy();
    this.audio.destroy();
  }
}
