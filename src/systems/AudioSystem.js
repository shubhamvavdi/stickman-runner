/**
 * AudioSystem.js
 * All sound is synthesised with the Web Audio API, so the build ships with
 * zero audio files and zero licensing questions.
 */

import { CONFIG } from '../config.js';

export class AudioSystem {
  constructor(settings = { sound: true, music: true }) {
    this.ctx = null;
    this.master = null;
    this.sfxBus = null;
    this.musicBus = null;
    this.soundOn = settings.sound !== false;
    this.musicOn = settings.music !== false;
    this.musicPlaying = false;
    this._step = 0;
    this._nextNoteTime = 0;
    this._timer = null;
  }

  /** Must be called from a user gesture; browsers block audio otherwise. */
  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    this.ctx = new AudioCtx();

    this.master = this.ctx.createGain();
    this.master.gain.value = CONFIG.audio.masterVolume;
    this.master.connect(this.ctx.destination);

    this.sfxBus = this.ctx.createGain();
    this.sfxBus.gain.value = CONFIG.audio.sfxVolume;
    this.sfxBus.connect(this.master);

    this.musicBus = this.ctx.createGain();
    this.musicBus.gain.value = 0;
    this.musicBus.connect(this.master);
  }

  setSound(on) {
    this.soundOn = on;
    if (this.sfxBus) this.sfxBus.gain.value = on ? CONFIG.audio.sfxVolume : 0;
  }

  setMusic(on) {
    this.musicOn = on;
    if (!on) this.stopMusic();
    else if (this.musicPlaying === false && this.ctx) this.startMusic();
  }

  _tone({ freq = 440, type = 'sine', duration = 0.16, gain = 0.5, sweepTo = null, delay = 0 }) {
    if (!this.ctx || !this.soundOn) return;
    const now = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (sweepTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, sweepTo), now + duration);
    env.gain.setValueAtTime(0.0001, now);
    env.gain.exponentialRampToValueAtTime(gain, now + 0.012);
    env.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(env);
    env.connect(this.sfxBus);
    osc.start(now);
    osc.stop(now + duration + 0.05);
  }

  _noise({ duration = 0.3, gain = 0.4, cutoff = 900 }) {
    if (!this.ctx || !this.soundOn) return;
    const now = this.ctx.currentTime;
    const length = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = cutoff;
    const env = this.ctx.createGain();
    env.gain.value = gain;
    source.connect(filter);
    filter.connect(env);
    env.connect(this.sfxBus);
    source.start(now);
  }

  jump() { this._tone({ freq: 320, sweepTo: 640, type: 'triangle', duration: 0.18, gain: 0.35 }); }
  doubleJump() { this._tone({ freq: 480, sweepTo: 880, type: 'square', duration: 0.16, gain: 0.22 }); }
  slide() { this._noise({ duration: 0.22, gain: 0.18, cutoff: 1400 }); }
  coin() {
    this._tone({ freq: 988, type: 'square', duration: 0.07, gain: 0.16 });
    this._tone({ freq: 1319, type: 'square', duration: 0.12, gain: 0.14, delay: 0.06 });
  }
  powerup() {
    [523, 659, 784, 1047].forEach((freq, i) => this._tone({ freq, type: 'triangle', duration: 0.14, gain: 0.2, delay: i * 0.06 }));
  }
  shield() { this._tone({ freq: 220, sweepTo: 660, type: 'sawtooth', duration: 0.35, gain: 0.2 }); }
  hit() {
    this._tone({ freq: 220, sweepTo: 60, type: 'sawtooth', duration: 0.4, gain: 0.35 });
    this._noise({ duration: 0.35, gain: 0.3, cutoff: 600 });
  }
  gameOver() {
    [440, 392, 330, 262].forEach((freq, i) => this._tone({ freq, type: 'triangle', duration: 0.32, gain: 0.25, delay: i * 0.16 }));
  }
  click() { this._tone({ freq: 660, type: 'square', duration: 0.06, gain: 0.14 }); }
  countdown(final = false) {
    this._tone({ freq: final ? 880 : 520, type: 'square', duration: final ? 0.3 : 0.12, gain: 0.22 });
  }

  /** Two-bar loop: bassline plus arpeggio. Scheduled ahead of the clock. */
  startMusic() {
    if (!this.ctx || !this.musicOn || this.musicPlaying) return;
    this.musicPlaying = true;
    this._step = 0;
    this._nextNoteTime = this.ctx.currentTime + 0.1;
    this.musicBus.gain.cancelScheduledValues(this.ctx.currentTime);
    this.musicBus.gain.setValueAtTime(0.0001, this.ctx.currentTime);
    this.musicBus.gain.exponentialRampToValueAtTime(CONFIG.audio.musicVolume, this.ctx.currentTime + 0.8);
    this._timer = window.setInterval(() => this._schedule(), 60);
  }

  stopMusic() {
    this.musicPlaying = false;
    if (this._timer) window.clearInterval(this._timer);
    this._timer = null;
    if (this.ctx && this.musicBus) {
      this.musicBus.gain.cancelScheduledValues(this.ctx.currentTime);
      this.musicBus.gain.setValueAtTime(this.musicBus.gain.value || 0.0001, this.ctx.currentTime);
      this.musicBus.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.4);
    }
  }

  _schedule() {
    if (!this.ctx || !this.musicPlaying) return;
    const stepTime = 60 / CONFIG.audio.tempo / 2; // eighth notes
    const bass = [110, 110, 165, 110, 98, 98, 147, 98];
    const lead = [440, 523, 659, 523, 587, 494, 440, 392];
    while (this._nextNoteTime < this.ctx.currentTime + 0.25) {
      const index = this._step % 8;
      this._playMusicNote(bass[index], this._nextNoteTime, stepTime * 0.9, 'triangle', 0.5);
      if (this._step % 2 === 0) {
        this._playMusicNote(lead[index], this._nextNoteTime, stepTime * 0.7, 'square', 0.16);
      }
      this._nextNoteTime += stepTime;
      this._step += 1;
    }
  }

  _playMusicNote(freq, time, duration, type, gain) {
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);
    env.gain.setValueAtTime(0.0001, time);
    env.gain.exponentialRampToValueAtTime(gain, time + 0.02);
    env.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    osc.connect(env);
    env.connect(this.musicBus);
    osc.start(time);
    osc.stop(time + duration + 0.05);
  }

  destroy() {
    this.stopMusic();
    if (this.ctx) this.ctx.close().catch(() => {});
    this.ctx = null;
  }
}
