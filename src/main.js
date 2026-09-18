/**
 * main.js
 * Entry point. Creates the game, exposes a tiny public handle for the host
 * page, and tears everything down on unload.
 */

import { Game } from './game.js';

function boot() {
  const canvas = document.getElementById('game-canvas');
  const uiRoot = document.getElementById('ui-layer');
  if (!canvas || !uiRoot) throw new Error('Stickman Runner: missing #game-canvas or #ui-layer');

  const game = new Game({ canvas, uiRoot });
  game.start();

  // Optional handle for the host page. Read-only on purpose: a platform may
  // observe the game, never drive its scoring.
  window.StickmanRunner = {
    version: '1.0.0',
    pause: () => game.scenes.get('game')?.pause(),
    destroy: () => game.destroy()
  };

  window.addEventListener('pagehide', () => game.destroy(), { once: true });
  return game;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
