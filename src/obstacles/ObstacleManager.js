/**
 * ObstacleManager.js
 * Owns every hazard pool and decides what to spawn. Patterns are picked from
 * a difficulty-filtered list and each pattern reports its footprint, so the
 * spawner can always leave enough clear track to react.
 */

import { CONFIG } from '../config.js';
import { GAME_WIDTH, GROUND_Y } from '../utils/Constants.js';
import { clamp } from '../utils/Random.js';
import { Spike } from './Spike.js';
import { Rock } from './Rock.js';
import { Fire } from './Fire.js';
import { LowBar } from './LowBar.js';
import { MovingObstacle } from './MovingObstacle.js';
import { FallingObstacle } from './FallingObstacle.js';
import { Gap } from './Gap.js';

function take(pool, Factory) {
  for (let i = 0; i < pool.length; i += 1) {
    if (!pool[i].active) return pool[i];
  }
  const created = new Factory();
  pool.push(created);
  return created;
}

export class ObstacleManager {
  constructor(random) {
    this.random = random;
    this.pools = {
      spike: [],
      rock: [],
      fire: [],
      lowbar: [],
      moving: [],
      falling: []
    };
    this.gapPool = [];
    this.active = [];
    this.gaps = [];
    this.lastPattern = '';
  }

  reset() {
    Object.values(this.pools).forEach((pool) => pool.forEach((item) => { item.active = false; }));
    this.gapPool.forEach((gap) => { gap.active = false; });
    this.active.length = 0;
    this.gaps.length = 0;
    this.lastPattern = '';
  }

  /** How far a single jump carries the player at the current speed. */
  static jumpDistance(speed) {
    const airTime = (2 * Math.abs(CONFIG.physics.jumpVelocity)) / CONFIG.physics.gravity;
    return airTime * speed;
  }

  availablePatterns(difficulty) {
    const list = ['spike', 'rock', 'fire', 'lowbar'];
    if (difficulty.maxCluster >= 2) list.push('spikeRow');
    if (difficulty.allows('allowGap')) list.push('gap');
    if (difficulty.allows('allowMoving')) list.push('moving');
    if (difficulty.allows('allowFalling')) list.push('falling', 'gapWide');
    return list;
  }

  /**
   * Spawns one pattern just off the right edge.
   * @returns {number} footprint in pixels.
   */
  spawnPattern(difficulty, speed) {
    const x = GAME_WIDTH + 60;
    const patterns = this.availablePatterns(difficulty);
    let name = this.random.pick(patterns);
    // Never repeat the same pattern three times in a row.
    if (name === this.lastPattern && patterns.length > 1) name = this.random.pick(patterns);
    this.lastPattern = name;

    const jump = ObstacleManager.jumpDistance(speed);

    switch (name) {
      case 'spikeRow': {
        const count = this.random.int(2, clamp(difficulty.maxCluster, 2, 3));
        for (let i = 0; i < count; i += 1) this._push(take(this.pools.spike, Spike).spawn(x + i * 34));
        return count * 34;
      }
      case 'rock': {
        const rock = take(this.pools.rock, Rock).spawn(x, this.random.int(0, 2));
        this._push(rock);
        return rock.w;
      }
      case 'fire': {
        const fire = take(this.pools.fire, Fire).spawn(x);
        this._push(fire);
        return fire.w;
      }
      case 'lowbar': {
        const bar = take(this.pools.lowbar, LowBar).spawn(x);
        this._push(bar);
        return bar.w;
      }
      case 'moving': {
        const drone = take(this.pools.moving, MovingObstacle).spawn(x, {
          top: GROUND_Y - 200,
          bottom: GROUND_Y - 92,
          speed: 80 + this.random.range(0, 50)
        });
        this._push(drone);
        return drone.w;
      }
      case 'falling': {
        const falling = take(this.pools.falling, FallingObstacle).spawn(x);
        this._push(falling);
        return falling.w;
      }
      case 'gap':
      case 'gapWide': {
        // Width is capped against the current jump arc, with margin.
        const factor = name === 'gapWide' ? 0.46 : 0.36;
        const width = clamp(jump * factor, 90, 215);
        const gap = take(this.gapPool, Gap).spawn(x, width);
        this.gaps.push(gap);
        return width;
      }
      default: {
        const spike = take(this.pools.spike, Spike).spawn(x);
        this._push(spike);
        return spike.w;
      }
    }
  }

  _push(obstacle) {
    this.active.push(obstacle);
  }

  update(dt, scroll) {
    for (let i = this.active.length - 1; i >= 0; i -= 1) {
      const obstacle = this.active[i];
      obstacle.update(dt, scroll);
      if (!obstacle.active) this.active.splice(i, 1);
    }
    for (let i = this.gaps.length - 1; i >= 0; i -= 1) {
      const gap = this.gaps[i];
      gap.update(dt, scroll);
      if (!gap.active) this.gaps.splice(i, 1);
    }
  }

  drawGaps(ctx) {
    for (let i = 0; i < this.gaps.length; i += 1) this.gaps[i].draw(ctx);
  }

  draw(ctx, reducedMotion) {
    for (let i = 0; i < this.active.length; i += 1) this.active[i].draw(ctx, reducedMotion);
  }

  /** True when the x range is free of hazards, used before placing coins. */
  isRangeClear(from, to) {
    for (let i = 0; i < this.active.length; i += 1) {
      const o = this.active[i];
      if (o.active && o.x < to && o.x + o.w > from) return false;
    }
    for (let i = 0; i < this.gaps.length; i += 1) {
      const g = this.gaps[i];
      if (g.active && g.x < to && g.x + g.w > from) return false;
    }
    return true;
  }

  get counts() {
    return { obstacles: this.active.length, gaps: this.gaps.length };
  }
}
