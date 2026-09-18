/**
 * MainMenu.js
 * Title screen plus the how-to-play panel. DOM based, so the buttons are
 * real buttons: focusable, tappable and readable by a screen reader.
 */

import { button, el, hide, show } from '../utils/dom.js';

export class MainMenu {
  constructor(root, handlers) {
    this.handlers = handlers;
    this.root = el('div', 'overlay overlay--menu');
    this.root.hidden = true;

    const panel = el('div', 'panel panel--menu');
    const title = el('h1', 'title');
    title.append(el('span', 'title__stick', 'Stickman'), el('span', 'title__run', 'Runner'));
    panel.append(title);
    panel.append(el('p', 'tagline', 'Run, jump, slide and stay alive.'));

    this.bestLine = el('p', 'best', 'Best score 0');
    panel.append(this.bestLine);

    const actions = el('div', 'actions');
    this.playBtn = button('Play', 'btn btn--primary');
    this.howBtn = button('How to play');
    this.settingsBtn = button('Settings');
    actions.append(this.playBtn, this.howBtn, this.settingsBtn);
    panel.append(actions);

    this.help = el('div', 'help');
    this.help.hidden = true;
    this.help.append(el('h2', 'help__title', 'How to play'));
    const list = el('dl', 'keys');
    [
      ['Space / ↑ / tap', 'Jump. Press again in the air for a double jump.'],
      ['↓ / swipe down', 'Slide under beams. Hold it in the air to drop fast.'],
      ['P or Esc', 'Pause the run.'],
      ['R', 'Restart instantly.'],
      ['Coins', 'Ten points each, and they feed your total score.'],
      ['Shield · Magnet · Boost', 'One free hit, coins fly to you, or a burst of speed.']
    ].forEach(([key, text]) => {
      list.append(el('dt', null, key), el('dd', null, text));
    });
    this.help.append(list);
    this.backBtn = button('Back', 'btn');
    this.help.append(this.backBtn);
    panel.append(this.help);

    this.root.append(panel);
    root.append(this.root);

    this.playBtn.addEventListener('click', () => handlers.onPlay());
    this.howBtn.addEventListener('click', () => this.toggleHelp(true));
    this.backBtn.addEventListener('click', () => this.toggleHelp(false));
    this.settingsBtn.addEventListener('click', () => handlers.onSettings());
  }

  toggleHelp(open) {
    this.handlers.onClick?.();
    this.help.hidden = !open;
    if (open) this.backBtn.focus();
    else this.howBtn.focus();
  }

  setBest(best) {
    this.bestLine.textContent = best > 0 ? `Best score ${best.toLocaleString()}` : 'No run recorded yet';
  }

  show() {
    this.help.hidden = true;
    show(this.root);
    this.playBtn.focus();
  }

  hide() {
    hide(this.root);
  }

  destroy() {
    this.root.remove();
  }
}
