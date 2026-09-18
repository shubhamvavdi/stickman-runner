/**
 * Constants.js
 * Fixed values shared by every module. The game always thinks in a virtual
 * 960x540 coordinate space; the renderer scales that space to the real canvas.
 */

export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;

/** Y position of the top surface of the ground, in virtual pixels. */
export const GROUND_Y = 452;

/** The player never moves horizontally: the world moves instead. */
export const PLAYER_X = 180;

/** How many virtual pixels equal one in-game metre. */
export const PIXELS_PER_METER = 22;

export const PLAYER_STATE = {
  IDLE: 'idle',
  RUN: 'run',
  JUMP: 'jump',
  FALL: 'fall',
  SLIDE: 'slide',
  HIT: 'hit',
  DEAD: 'dead'
};

export const SCENE = {
  BOOT: 'boot',
  MENU: 'menu',
  GAME: 'game',
  GAMEOVER: 'gameover',
  SETTINGS: 'settings'
};

export const OBSTACLE_TYPE = {
  SPIKE: 'spike',
  ROCK: 'rock',
  FIRE: 'fire',
  MOVING: 'moving',
  FALLING: 'falling',
  LOWBAR: 'lowbar',
  GAP: 'gap'
};

export const POWERUP_TYPE = {
  MAGNET: 'magnet',
  SHIELD: 'shield',
  SPEED: 'speed'
};

export const STORAGE_KEY = {
  BEST: 'stickman-runner.best',
  SETTINGS: 'stickman-runner.settings',
  STATS: 'stickman-runner.stats'
};

/** Single source of truth for the palette, used by canvas and CSS alike. */
export const COLORS = {
  skyTop: '#151a33',
  skyBottom: '#4a3b6b',
  sun: '#ff8b5e',
  hillFar: '#2b2f55',
  hillNear: '#1b1e3a',
  treeFar: '#232748',
  groundFill: '#12142a',
  groundLine: '#6de3c0',
  player: '#f2f5ff',
  ink: '#0a0c18',
  coin: '#ffd166',
  danger: '#ff5d73',
  fire: '#ff9f43',
  shield: '#5ec8ff',
  magnet: '#c792ea',
  speed: '#6de3c0',
  text: '#f2f5ff'
};
