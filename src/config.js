/**
 * config.js
 * Every tunable number lives here so balancing never means hunting through
 * gameplay code.
 */

import { GROUND_Y } from './utils/Constants.js';

export const CONFIG = {
  render: {
    /** Upper bound on device pixel ratio, keeps fill-rate sane on phones. */
    maxDpr: 2,
    maxFrameDelta: 1 / 20 // never simulate more than 50ms in one step
  },

  physics: {
    gravity: 2500,
    fastFallGravity: 4200, // holding "slide" in the air drops you quickly
    jumpVelocity: -840,
    doubleJumpVelocity: -730,
    maxJumps: 2,
    /** Releasing jump early cuts the rise for a variable-height jump. */
    jumpCutMultiplier: 0.45,
    coyoteTime: 0.09,
    jumpBufferTime: 0.12,
    slideDuration: 0.6,
    slideCooldown: 0.12,
    gapFallDeathY: GROUND_Y + 140
  },

  player: {
    standWidth: 34,
    standHeight: 78,
    slideWidth: 58,
    slideHeight: 38,
    hitInvincibility: 1.2
  },

  speed: {
    base: 400,
    max: 780,
    /** Extra px/s gained per metre travelled. */
    perMeter: 0.16,
    boostMultiplier: 1.35
  },

  score: {
    coinValue: 10,
    powerupBonus: 250,
    nearMissBonus: 0 // reserved, kept at 0 so scoring stays predictable
  },

  powerups: {
    magnetDuration: 7,
    magnetRadius: 190,
    magnetPull: 900,
    shieldDuration: 12,
    speedDuration: 6,
    /** Chance a safe zone contains a power-up instead of coins. */
    spawnChance: 0.14,
    minSpacingMeters: 120
  },

  coins: {
    radius: 11,
    patternChance: 0.72
  },

  /**
   * Ad settings for @gamehubsdk/gamehub-ad-sdk. Everything here is public by
   * design: only a public game key ever belongs in browser code. The host page
   * can override any of it with window.GAMEHUB_AD_CONFIG before the game boots.
   */
  ads: {
    enabled: true,
    gameId: '123456789',
    developerId: '',
    apiBaseUrl: '',          // e.g. 'https://api.your-gamehub.com'
    adEndpoint: '',          // overrides apiBaseUrl when set
    analyticsEndpoint: '',
    apiKey: 'ghpk_42ac8d08236e605e170f5e9722b4b2183700d21d6ac848b8', // PUBLIC key only, never a server secret
    testMode: true,          // demo creatives until an ad API is configured
    debug: false,
    bannerContainerId: 'gamehub-banner-ad',
    interstitialCooldownMs: 60000,
    /** Show an interstitial after every Nth finished run. */
    interstitialEveryRuns: 3,
    placements: {
      menu: 'main_menu',
      gameOver: 'game_over',
      revive: 'extra_life'
    },
    /** Seconds of invincibility granted after a rewarded revive. */
    reviveInvincibility: 2.5
  },

  difficulty: {
    tiers: [
      { name: 'Easy',    from: 0,    spacingTime: 1.55, maxCluster: 1, allowGap: false, allowMoving: false, allowFalling: false },
      { name: 'Normal',  from: 500,  spacingTime: 1.25, maxCluster: 2, allowGap: true,  allowMoving: false, allowFalling: false },
      { name: 'Hard',    from: 1000, spacingTime: 1.05, maxCluster: 3, allowGap: true,  allowMoving: true,  allowFalling: false },
      { name: 'Extreme', from: 2000, spacingTime: 0.92, maxCluster: 3, allowGap: true,  allowMoving: true,  allowFalling: true }
    ],
    /** Never let two hazards sit closer in time than this, at any speed. */
    minSpacingTime: 0.88
  },

  audio: {
    masterVolume: 0.7,
    musicVolume: 0.22,
    sfxVolume: 0.5,
    tempo: 132
  }
};
