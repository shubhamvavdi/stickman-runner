/**
 * SaveSystem.js
 * localStorage wrapper. Every call is guarded: private browsing, disabled
 * storage or a full quota must never crash the game.
 */

import { STORAGE_KEY } from '../utils/Constants.js';

const DEFAULT_SETTINGS = { sound: true, music: true, reducedMotion: false };

export class SaveSystem {
  constructor() {
    this.available = this._probe();
    this.settings = { ...DEFAULT_SETTINGS, ...this._read(STORAGE_KEY.SETTINGS, {}) };
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && this._read(STORAGE_KEY.SETTINGS, null) === null) {
      this.settings.reducedMotion = true;
    }
  }

  _probe() {
    try {
      const key = '__sr_probe__';
      window.localStorage.setItem(key, '1');
      window.localStorage.removeItem(key);
      return true;
    } catch (error) {
      return false;
    }
  }

  _read(key, fallback) {
    if (!this.available) return fallback;
    try {
      const raw = window.localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (error) {
      return fallback;
    }
  }

  _write(key, value) {
    if (!this.available) return false;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      return false;
    }
  }

  /** Local best only. A server leaderboard must never trust this number. */
  getBest() {
    const best = this._read(STORAGE_KEY.BEST, { score: 0, distance: 0, coins: 0 });
    return {
      score: Number(best.score) || 0,
      distance: Number(best.distance) || 0,
      coins: Number(best.coins) || 0
    };
  }

  submitRun({ score, distance, coins }) {
    const best = this.getBest();
    const isRecord = score > best.score;
    if (isRecord) this._write(STORAGE_KEY.BEST, { score, distance, coins });

    const stats = this._read(STORAGE_KEY.STATS, { runs: 0, coins: 0, meters: 0 });
    stats.runs += 1;
    stats.coins += coins;
    stats.meters += distance;
    this._write(STORAGE_KEY.STATS, stats);

    return { isRecord, best: isRecord ? { score, distance, coins } : best };
  }

  getStats() {
    return this._read(STORAGE_KEY.STATS, { runs: 0, coins: 0, meters: 0 });
  }

  getSettings() {
    return { ...this.settings };
  }

  setSetting(key, value) {
    this.settings[key] = value;
    this._write(STORAGE_KEY.SETTINGS, this.settings);
    return this.getSettings();
  }

  clearBest() {
    this._write(STORAGE_KEY.BEST, { score: 0, distance: 0, coins: 0 });
  }
}
