/**
 * GameHub.js
 * Optional bridge to a parent platform. The game never reads anything back
 * that affects gameplay, and works exactly the same when nothing listens.
 */

const CHANNEL = 'gamehub';
const VERSION = 1;

export class GameHubBridge {
  constructor(gameId = 'stickman-runner') {
    this.gameId = gameId;
    this.embedded = window.parent !== window;
  }

  _post(event, payload = {}) {
    const message = { channel: CHANNEL, version: VERSION, game: this.gameId, event, payload, at: Date.now() };
    if (this.embedded) {
      // '*' is fine: the payload holds no secrets and no user data.
      try { window.parent.postMessage(message, '*'); } catch (error) { /* sandboxed */ }
    }
    window.dispatchEvent(new CustomEvent(`${CHANNEL}:${event}`, { detail: message }));
  }

  ready() { this._post('ready'); }
  gameStarted() { this._post('game_started'); }
  gamePaused() { this._post('game_paused'); }
  gameResumed() { this._post('game_resumed'); }

  gameOver(snapshot) {
    this._post('game_over', {
      score: snapshot.score,
      distance: snapshot.distance,
      coins: snapshot.coins,
      duration: snapshot.duration
    });
  }
}
