/**
 * PauseMenu.js
 * Shown while the loop is stopped, so nothing animates behind it.
 */

import { button, el, hide, show } from '../utils/dom.js';

export class PauseMenu {
  constructor(root, handlers) {
    this.root = el('div', 'overlay');
    this.root.hidden = true;
    const panel = el('div', 'panel');
    panel.append(el('h2', 'panel__title', 'Paused'));
    this.stats = el('p', 'panel__meta', '');
    panel.append(this.stats);

    const actions = el('div', 'actions');
    this.resumeBtn = button('Resume', 'btn btn--primary');
    this.restartBtn = button('Restart');
    this.menuBtn = button('Main menu');
    actions.append(this.resumeBtn, this.restartBtn, this.menuBtn);
    panel.append(actions);
    this.root.append(panel);
    root.append(this.root);

    this.resumeBtn.addEventListener('click', () => handlers.onResume());
    this.restartBtn.addEventListener('click', () => handlers.onRestart());
    this.menuBtn.addEventListener('click', () => handlers.onMenu());
  }

  show(snapshot) {
    this.stats.textContent = `${snapshot.distance} m · ${snapshot.coins} coins · ${snapshot.score.toLocaleString()} points`;
    show(this.root);
    this.resumeBtn.focus();
  }

  hide() {
    hide(this.root);
  }

  destroy() {
    this.root.remove();
  }
}
