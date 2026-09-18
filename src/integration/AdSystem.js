/**
 * AdSystem.js
 * Wrapper around @gamehubsdk/gamehub-ad-sdk.
 *
 * Two rules drive this file:
 *   1. Ads never interrupt a live run. Banners show on the menu and the game
 *      over screen; interstitials play between runs; the rewarded ad is opt-in.
 *   2. If the SDK fails to load, fails to init, or no ad comes back, the game
 *      carries on exactly as it did before. Every call is guarded.
 *
 * The SDK resolves showInterstitial/showRewardedAd as soon as the overlay is
 * on screen, not when the player closes it, so this wrapper listens for
 * 'ad_closed' and 'reward_earned' and hands back a promise that settles when
 * the player is actually done with the ad.
 */

import GameHubSDK from '@gamehubsdk/gamehub-ad-sdk';
import { CONFIG } from '../config.js';

const CLOSE_TIMEOUT_MS = 90000; // never leave the game waiting forever

export class AdSystem {
  constructor(audio) {
    this.audio = audio;
    this.sdk = GameHubSDK;
    this.ready = false;
    this.bannerVisible = false;
    this.adOpen = false;
    this._unsubscribe = [];
    // The host page can override ids and endpoints without a rebuild.
    this.config = { ...CONFIG.ads, ...(window.GAMEHUB_AD_CONFIG || {}) };
  }

  get available() {
    return this.ready && this.config.enabled !== false;
  }

  async init() {
    if (this.config.enabled === false) return false;
    try {
      await this.sdk.init({
        gameId: this.config.gameId,
        developerId: this.config.developerId || undefined,
        apiBaseUrl: this.config.apiBaseUrl || undefined,
        adEndpoint: this.config.adEndpoint || undefined,
        analyticsEndpoint: this.config.analyticsEndpoint || undefined,
        apiKey: this.config.apiKey || undefined,
        testMode: this.config.testMode === true,
        interstitialCooldownMs: this.config.interstitialCooldownMs,
        metadata: { game: 'stickman-runner', version: '1.0.0' }
      });
      this._unsubscribe.push(this.sdk.on('ad_error', (event) => {
        // Nothing to do: an ad that fails to load is a non-event for players.
        if (this.config.debug) console.warn('[ads]', event.message);
      }));
      this.ready = true;
      return true;
    } catch (error) {
      if (this.config.debug) console.warn('[ads] init failed', error);
      this.ready = false;
      return false;
    }
  }

  _container() {
    return document.getElementById(this.config.bannerContainerId);
  }

  async showBanner(placementId) {
    if (!this.available) return false;
    const container = this._container();
    if (!container) return false;
    container.classList.add('is-active');
    try {
      const shown = await this.sdk.showBanner({
        containerId: this.config.bannerContainerId,
        placementId,
        autoCreate: false // the slot lives in index.html, not in the SDK
      });
      this.bannerVisible = shown;
      if (!shown) container.classList.remove('is-active');
      return shown;
    } catch (error) {
      container.classList.remove('is-active');
      return false;
    }
  }

  hideBanner() {
    const container = this._container();
    if (container) container.classList.remove('is-active');
    this.bannerVisible = false;
    if (!this.ready) return;
    try {
      this.sdk.removeBanner(this.config.bannerContainerId);
    } catch (error) { /* nothing rendered yet */ }
  }

  /** Mutes the game while an ad overlay owns the screen. */
  _muteForAd() {
    if (!this.audio) return;
    this._soundWasOn = this.audio.soundOn;
    this._musicWasOn = this.audio.musicPlaying;
    this.audio.stopMusic();
    this.audio.setSound(false);
  }

  _unmuteAfterAd() {
    if (!this.audio) return;
    if (this._soundWasOn) this.audio.setSound(true);
    if (this._musicWasOn) this.audio.startMusic();
  }

  /** Resolves once the player closes the overlay (or the SDK gives up). */
  _waitForClose(eventName) {
    return new Promise((resolve) => {
      let settled = false;
      const finish = (value) => {
        if (settled) return;
        settled = true;
        offClose();
        offReward();
        window.clearTimeout(timer);
        resolve(value);
      };
      const offReward = this.sdk.on('reward_earned', () => finish(true));
      const offClose = this.sdk.on('ad_closed', () => finish(eventName !== 'reward_earned'));
      const timer = window.setTimeout(() => finish(false), CLOSE_TIMEOUT_MS);
    });
  }

  /** Between-runs full screen ad. Resolves when the player is back in control. */
  async showInterstitial(placementId) {
    if (!this.available || this.adOpen) return false;
    this.adOpen = true;
    this._muteForAd();
    try {
      const closed = this._waitForClose('ad_closed');
      const shown = await this.sdk.showInterstitial({ placementId });
      if (!shown) return false;
      await closed;
      return true;
    } catch (error) {
      return false;
    } finally {
      this.adOpen = false;
      this._unmuteAfterAd();
    }
  }

  /** Opt-in ad. Resolves true only if the player actually earned the reward. */
  async showRewarded(placementId) {
    if (!this.available || this.adOpen) return false;
    this.adOpen = true;
    this._muteForAd();
    try {
      const settled = this._waitForClose('reward_earned');
      const shown = await this.sdk.showRewardedAd({ placementId });
      if (!shown) return false;
      return await settled;
    } catch (error) {
      return false;
    } finally {
      this.adOpen = false;
      this._unmuteAfterAd();
    }
  }

  destroy() {
    this._unsubscribe.forEach((off) => { try { off(); } catch (error) { /* ignore */ } });
    this._unsubscribe.length = 0;
    try { this.sdk.destroy(); } catch (error) { /* never initialised */ }
    this.ready = false;
  }
}
