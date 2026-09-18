/**
 * CollisionSystem.js
 * One place for every overlap test. The player's collision box is smaller
 * than the drawn stickman, which is what makes near misses feel fair.
 */

import { GROUND_Y } from '../utils/Constants.js';

export function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function circleRectOverlap(cx, cy, radius, rect) {
  const nearestX = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const nearestY = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  const dx = cx - nearestX;
  const dy = cy - nearestY;
  return dx * dx + dy * dy <= radius * radius;
}

export class CollisionSystem {
  constructor(handlers = {}) {
    this.handlers = handlers;
  }

  /** True when there is solid ground under the player's feet. */
  static groundUnder(player, gaps) {
    const footLeft = player.bounds.x + 6;
    const footRight = player.bounds.x + player.bounds.w - 6;
    for (let i = 0; i < gaps.length; i += 1) {
      const gap = gaps[i];
      if (!gap.active) continue;
      if (footLeft > gap.x && footRight < gap.x + gap.w) return false;
    }
    return true;
  }

  update(player, world) {
    if (player.isDead) return;
    const bounds = player.bounds;

    // Player vs obstacle
    if (!player.invincible) {
      for (let i = 0; i < world.obstacles.length; i += 1) {
        const obstacle = world.obstacles[i];
        if (!obstacle.active || !obstacle.deadly) continue;
        if (rectsOverlap(bounds, obstacle.getBounds())) {
          this.handlers.onObstacle?.(obstacle);
          break;
        }
      }
    }

    // Player vs coin
    for (let i = 0; i < world.coins.length; i += 1) {
      const coin = world.coins[i];
      if (!coin.active || coin.collected) continue;
      if (circleRectOverlap(coin.x, coin.y, coin.radius, bounds)) {
        this.handlers.onCoin?.(coin);
      }
    }

    // Player vs power-up
    for (let i = 0; i < world.powerups.length; i += 1) {
      const powerup = world.powerups[i];
      if (!powerup.active) continue;
      if (circleRectOverlap(powerup.x, powerup.y, powerup.radius, bounds)) {
        this.handlers.onPowerUp?.(powerup);
      }
    }

    // Player vs ground / gap
    const hasGround = CollisionSystem.groundUnder(player, world.gaps);
    player.setGroundAvailable(hasGround);
    if (!hasGround && player.y > GROUND_Y + 30 && !player.falling) {
      this.handlers.onGapEnter?.();
    }
    if (player.y >= player.deathY) {
      this.handlers.onPit?.();
    }
  }
}
