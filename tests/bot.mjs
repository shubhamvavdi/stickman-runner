/**
 * A scripted player used by the tests. It jumps and slides at the moment a
 * competent human would, which is how we prove the generated patterns are
 * actually survivable.
 */

import { GROUND_Y, PLAYER_X } from '../src/utils/Constants.js';

/** Where a patrolling drone will be by the time the player reaches it. */
function predictY(obstacle, time) {
  let y = obstacle.y;
  let dir = obstacle.dir;
  let left = time;
  while (left > 0) {
    const target = dir < 0 ? obstacle.top : obstacle.bottom;
    const travel = Math.abs(target - y);
    const needed = travel / obstacle.speed;
    if (needed > left) return y + dir * obstacle.speed * left;
    y = target;
    dir *= -1;
    left -= needed;
  }
  return y;
}

export function botStep(scene) {
  const player = scene.player;
  const speed = scene.speed;
  let jump = false;
  let slide = false;

  for (const obstacle of scene.obstacles.active) {
    const distance = obstacle.x - PLAYER_X;
    if (distance <= 0) continue;
    const arrival = distance / speed;

    if (obstacle.type === 'lowbar') {
      if (distance < speed * 0.25) slide = true;
    } else if (obstacle.type === 'moving') {
      const y = predictY(obstacle, arrival);
      if (y + obstacle.h > GROUND_Y - 88 && distance < speed * 0.3) slide = true;
    } else if (distance < speed * 0.3) {
      jump = true;
    }
  }

  for (const gap of scene.obstacles.gaps) {
    const distance = gap.x - PLAYER_X;
    if (distance > 0 && distance < speed * 0.1) jump = true;
  }

  if (slide && player.onGround) player.requestSlide();
  else if (jump && player.onGround) player.requestJump();
}
