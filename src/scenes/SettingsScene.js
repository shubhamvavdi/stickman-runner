/**
 * SettingsScene.js
 * Three switches, saved the moment they change. Reduced motion turns off
 * screen shake, trails and flicker for anyone who needs a calmer picture.
 */

import { Scene } from './Scene.js';
import { Background } from '../world/Background.js';
import { Ground } from '../world/Ground.js';
import { button, el, hide, show } from '../utils/dom.js';
import { SCENE } from '../utils/Constants.js';

const EMPTY = [];

export class SettingsScene extends Scene {
  constructor(game) {
    super(game);
    this.background = new Background(game.random);
    this.ground = new Ground();

    this.root = el('div', 'overlay');
    this.root.hidden = true;
    const panel = el('div', 'panel');
    panel.append(el('h2', 'panel__title', 'Settings'));

    this.toggles = {};
    [
      ['sound', 'Sound effects'],
      ['music', 'Music'],
      ['reducedMotion', 'Reduced motion']
    ].forEach(([key, label]) => {
      const row = el('div', 'toggle-row');
      const name = el('span', 'toggle-row__label', label);
      const control = button('On', 'btn btn--toggle');
      control.addEventListener('click', () => this._flip(key));
      row.append(name, control);
      panel.append(row);
      this.toggles[key] = control;
    });

    this.resetBtn = button('Clear best score');
    this.resetBtn.addEventListener('click', () => {
      this.game.audio.click();
      this.game.save.clearBest();
      this.resetBtn.textContent = 'Best score cleared';
    });

    const actions = el('div', 'actions');
    this.backBtn = button('Back', 'btn btn--primary');
    this.backBtn.addEventListener('click', () => {
      this.game.audio.click();
      this.game.changeScene(SCENE.MENU);
    });
    actions.append(this.backBtn, this.resetBtn);
    panel.append(actions);
    this.root.append(panel);
    game.uiRoot.append(this.root);
  }

  _flip(key) {
    const next = !this.game.settings[key];
    this.game.applySetting(key, next);
    this.game.audio.click();
    this._sync();
  }

  _sync() {
    Object.entries(this.toggles).forEach(([key, control]) => {
      const on = this.game.settings[key] === true;
      control.textContent = on ? 'On' : 'Off';
      control.classList.toggle('is-off', !on);
      control.setAttribute('aria-pressed', String(on));
    });
  }

  enter() {
    this.resetBtn.textContent = 'Clear best score';
    this._sync();
    show(this.root);
    this.backBtn.focus();
  }

  exit() {
    hide(this.root);
  }

  update(dt) {
    const scroll = 80 * dt;
    this.background.update(dt, scroll);
    this.ground.update(dt, scroll);
  }

  render(ctx) {
    this.background.draw(ctx);
    this.ground.draw(ctx, EMPTY);
  }

  destroy() {
    this.root.remove();
  }
}
