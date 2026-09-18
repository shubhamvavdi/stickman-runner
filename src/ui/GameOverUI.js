/**
 * GameOverUI.js
 * Final numbers and the two ways out of a run.
 */

import { button, el, hide, show } from '../utils/dom.js';

export class GameOverUI {
  constructor(root, handlers) {
    this.root = el('div', 'overlay');
    this.root.hidden = true;

    const panel = el('div', 'panel panel--over');
    this.heading = el('h2', 'panel__title', 'Run over');
    panel.append(this.heading);

    this.scoreLine = el('p', 'score-big', '0');
    panel.append(this.scoreLine);
    this.recordLine = el('p', 'record', '');
    panel.append(this.recordLine);

    this.grid = el('div', 'stat-grid');
    this.distanceValue = el('span', 'stat__value', '0 m');
    this.coinsValue = el('span', 'stat__value', '0');
    this.bestValue = el('span', 'stat__value', '0');
    [['Distance', this.distanceValue], ['Coins', this.coinsValue], ['Best', this.bestValue]]
      .forEach(([label, valueNode]) => {
        const cell = el('div', 'stat');
        cell.append(el('span', 'stat__label', label), valueNode);
        this.grid.append(cell);
      });
    panel.append(this.grid);

    const actions = el('div', 'actions');
    this.reviveBtn = button('Watch an ad to continue this run', 'btn btn--revive');
    this.reviveBtn.hidden = true;
    this.restartBtn = button('Restart', 'btn btn--primary');
    this.menuBtn = button('Main menu');
    actions.append(this.reviveBtn, this.restartBtn, this.menuBtn);
    panel.append(actions);

    this.root.append(panel);
    root.append(this.root);

    this.restartBtn.addEventListener('click', () => handlers.onRestart());
    this.menuBtn.addEventListener('click', () => handlers.onMenu());
    this.reviveBtn.addEventListener('click', () => handlers.onRevive());
  }

  /** The revive button only exists when a rewarded ad can actually be shown. */
  setReviveAvailable(available) {
    this.reviveBtn.hidden = !available;
    this.reviveBtn.disabled = false;
    this.reviveBtn.textContent = 'Watch an ad to continue this run';
  }

  setReviveLoading() {
    this.reviveBtn.disabled = true;
    this.reviveBtn.textContent = 'Loading ad…';
  }

  setReviveFailed() {
    this.reviveBtn.disabled = true;
    this.reviveBtn.textContent = 'No ad available right now';
  }

  show(result) {
    const { score, distance, coins, best, isRecord } = result;
    this.heading.textContent = isRecord ? 'New best run' : 'Run over';
    this.scoreLine.textContent = score.toLocaleString();
    this.recordLine.textContent = isRecord
      ? 'You beat your previous best.'
      : `${(best - score).toLocaleString()} points from your best.`;
    this.distanceValue.textContent = `${distance} m`;
    this.coinsValue.textContent = String(coins);
    this.bestValue.textContent = best.toLocaleString();
    show(this.root);
    this.restartBtn.focus();
  }

  hide() {
    hide(this.root);
  }

  destroy() {
    this.root.remove();
  }
}
