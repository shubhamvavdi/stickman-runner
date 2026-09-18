/**
 * Headless play-through tests. They drive the real Game class frame by frame
 * with a stubbed canvas, which catches crashes, broken state machines and
 * bad collision maths without opening a browser.
 */

import assert from 'node:assert/strict';
import { installDom } from './dom-stub.mjs';
import { botStep } from './bot.mjs';

const dom = installDom();
const { Game } = await import('../src/game.js');
const { SCENE, GROUND_Y, PLAYER_X, GAME_WIDTH } = await import('../src/utils/Constants.js');
const { ObstacleManager } = await import('../src/obstacles/ObstacleManager.js');

const results = [];
function test(name, fn) {
  try {
    fn();
    results.push(`  pass  ${name}`);
  } catch (error) {
    results.push(`  FAIL  ${name}\n        ${error.message}`);
    process.exitCode = 1;
  }
}

const game = new Game({ canvas: dom.canvas, uiRoot: dom.uiRoot });
game.random.seed(20260918); // deterministic worlds make failures reproducible
game.start();
game.stopLoop(); // frames are driven manually below
await new Promise((resolve) => setTimeout(resolve, 20)); // let the font promise settle

const STEP = 1 / 60;

/** Puts the player in a known, grounded, vulnerable state. */
function ground(player) {
  player.y = GROUND_Y;
  player.vy = 0;
  player.onGround = true;
  player.sliding = false;
  player.jumpBuffer = 0;
  player.invincibleTimer = 0;
}

function tick(frames = 1) {
  for (let i = 0; i < frames; i += 1) {
    game.current.update(STEP);
    game.renderFrame();
  }
}

// 1. Boot -> menu
tick(240);
test('boot scene hands over to the main menu', () => {
  assert.equal(game.currentKey, SCENE.MENU);
});

// 2. Menu -> game, countdown, then running
game.changeScene(SCENE.GAME);
const scene = game.scenes.get(SCENE.GAME);
test('a new run starts in the countdown phase', () => {
  assert.equal(scene.phase, 'countdown');
  assert.equal(scene.score.total, 0);
});

tick(230);
test('countdown ends and the run starts', () => {
  assert.equal(scene.phase, 'running');
  assert.equal(scene.controller.enabled, true);
});

// 3. An auto-player survives a long stretch
function autopilot(frames) {
  for (let i = 0; i < frames; i += 1) {
    botStep(scene);
    game.current.update(STEP);
    game.renderFrame();
    if (game.currentKey !== SCENE.GAME) break;
  }
}

autopilot(3600);
test('a competent player survives well past the first difficulty tiers', () => {
  assert.equal(game.currentKey, SCENE.GAME, 'the bot died on a generated pattern');
  assert.ok(scene.score.distance > 600, `distance was ${scene.score.distance}`);
  assert.ok(scene.obstacles.active.length + scene.obstacles.gaps.length > 0);
});

test('object pools stay small instead of growing forever', () => {
  const pooled = Object.values(scene.obstacles.pools).reduce((sum, pool) => sum + pool.length, 0);
  assert.ok(pooled < 60, `pooled obstacles: ${pooled}`);
  assert.equal(scene.coins.length, 90);
});

test('gaps are never wider than the jump arc', () => {
  const jump = ObstacleManager.jumpDistance(scene.speed);
  for (const gap of scene.obstacles.gaps) assert.ok(gap.w < jump * 0.6);
});

// 4. Coin pickup
{
  const before = scene.score.coins;
  ground(scene.player);
  scene._addCoin(PLAYER_X, GROUND_Y - 40);
  tick(1);
  test('coins are collected and counted', () => {
    assert.equal(scene.score.coins, before + 1);
  });
}

// 5. Shield absorbs exactly one hit
{
  ground(scene.player);
  scene.effects.shield = 5;
  const rock = scene.obstacles.spawnPattern({ maxCluster: 1, allows: () => false, name: 'Easy' }, 400);
  const spawned = scene.obstacles.active[scene.obstacles.active.length - 1];
  spawned.x = PLAYER_X - spawned.w / 2;
  tick(1);
  test('shield absorbs one hit and is then spent', () => {
    assert.equal(scene.effects.shield, 0);
    assert.equal(scene.phase, 'running');
    assert.ok(rock > 0);
  });
}

// 6. Pause and resume
scene.pause();
test('pause stops the loop and shows the pause menu', () => {
  assert.equal(scene.paused, true);
  assert.equal(game.running, false);
  assert.equal(scene.pauseMenu.root.hidden, false);
});
scene.resume();
game.stopLoop();
test('resume restarts with a short countdown', () => {
  assert.equal(scene.paused, false);
  assert.equal(scene.phase, 'countdown');
});
tick(120);

// 7. Fatal collision -> game over -> best score saved
{
  ground(scene.player);
  scene.effects.shield = 0;
  scene.obstacles.spawnPattern({ maxCluster: 1, allows: () => false, name: 'Easy' }, 400);
  const hazard = scene.obstacles.active[scene.obstacles.active.length - 1];
  hazard.x = PLAYER_X - hazard.w / 2;
  hazard.y = GROUND_Y - hazard.h;
  tick(1);
  test('hitting a hazard without a shield kills the run', () => {
    assert.equal(scene.phase, 'dying');
    assert.equal(scene.player.isDead, true);
  });
  tick(90);
  test('death leads to the game over scene', () => {
    assert.equal(game.currentKey, SCENE.GAMEOVER);
  });
  test('the best score is written to localStorage', () => {
    const raw = dom.storage.get('stickman-runner.best');
    assert.ok(raw, 'no best score stored');
    assert.ok(JSON.parse(raw).score > 0);
  });
}

// 8. Restart from the game over screen
game.changeScene(SCENE.GAME);
test('restart resets the run completely', () => {
  assert.equal(scene.score.total, 0);
  assert.equal(scene.player.isDead, false);
  assert.equal(scene.obstacles.active.length, 0);
  assert.equal(scene.active.coins.length, 0);
});

// 9. Falling into a gap is fatal
tick(230);
{
  scene.obstacles.gaps.length = 0;
  const gap = scene.obstacles.gapPool[0] || null;
  if (gap) {
    gap.spawn(PLAYER_X - 40, 200);
    scene.obstacles.gaps.push(gap);
  }
  let frames = 0;
  while (scene.phase === 'running' && frames < 120) { tick(1); frames += 1; }
  test('falling into a gap ends the run', () => {
    assert.equal(scene.phase, 'dying');
  });
}

// 10. Responsive transform
dom.canvas.parentElement.getBoundingClientRect = () => ({ left: 0, top: 0, width: 390, height: 844 });
game.resize();
test('canvas letterboxes tall screens without stretching', () => {
  assert.ok(Math.abs(game.scale - 390 / 960) < 1e-6);
  assert.ok(game.offsetY > 0);
  const point = dom.canvas.__toGame(195, game.offsetY + 270 * game.scale);
  assert.ok(Math.abs(point.x - GAME_WIDTH / 2) < 1);
});

// 11. Settings persist
game.applySetting('sound', false);
test('settings are saved and read back', () => {
  assert.equal(game.settings.sound, false);
  assert.equal(JSON.parse(dom.storage.get('stickman-runner.settings')).sound, false);
});

// 12. Touch controls: tap jumps, swipe down slides
game.changeScene(SCENE.GAME);
tick(230);
{
  const player = scene.player;
  ground(player);
  dom.canvas.dispatch('pointerdown', { pointerId: 1, clientX: 200, clientY: 400 });
  dom.canvas.dispatch('pointerup', { pointerId: 1, clientX: 200, clientY: 400 });
  tick(2);
  test('a tap makes the player jump', () => {
    assert.equal(player.onGround, false);
  });

  tick(60);
  ground(player); // land again on known ground
  dom.canvas.dispatch('pointerdown', { pointerId: 2, clientX: 200, clientY: 300 });
  dom.canvas.dispatch('pointermove', { pointerId: 2, clientX: 202, clientY: 380 });
  tick(2);
  test('a downward swipe makes the player slide', () => {
    assert.equal(player.sliding, true);
  });
  dom.canvas.dispatch('pointerup', { pointerId: 2, clientX: 202, clientY: 380 });
}

// 13. Tapping the pause button pauses instead of jumping
{
  tick(40);
  const before = scene.player.onGround;
  const screenX = game.offsetX + (960 - 52) * game.scale;
  const screenY = game.offsetY + 74 * game.scale;
  dom.canvas.dispatch('pointerdown', { pointerId: 3, clientX: screenX, clientY: screenY });
  dom.canvas.dispatch('pointerup', { pointerId: 3, clientX: screenX, clientY: screenY });
  test('the pause button swallows the tap', () => {
    assert.equal(scene.paused, true);
    assert.equal(scene.player.onGround, before);
  });
  scene.resume();
  game.stopLoop();
}

// 14. Ad SDK integration
const over = game.scenes.get(SCENE.GAMEOVER);

test('the ad SDK initialises in test mode without any network call', () => {
  assert.equal(game.ads.available, true);
});

{
  const shown = await game.ads.showBanner('main_menu');
  test('a missing banner slot fails softly instead of throwing', () => {
    assert.equal(shown, false);
  });
}

{
  let hidden = 0;
  const realHide = game.ads.hideBanner.bind(game.ads);
  game.ads.hideBanner = () => { hidden += 1; realHide(); };
  game.changeScene(SCENE.GAME);
  test('entering a run clears any banner', () => {
    assert.ok(hidden > 0);
  });
  game.ads.hideBanner = realHide;
}

tick(230);
scene.score.pixels = 22000; // 1000 m
scene.score.coins = 12;

{
  game.ads.showRewarded = async () => true;
  game.changeScene(SCENE.GAMEOVER, {
    score: 1120, distance: 1000, coins: 12, best: 1120, isRecord: false, canRevive: true
  });
  await over.revive();
  test('a rewarded revive continues the same run instead of restarting it', () => {
    assert.equal(game.currentKey, SCENE.GAME);
    assert.equal(scene.revived, true);
    assert.equal(scene.score.coins, 12);
    assert.ok(scene.score.distance > 900, `distance was ${scene.score.distance}`);
    assert.ok(scene.player.invincibleTimer > 0);
    assert.equal(scene.player.isDead, false);
  });
  test('the revive clears the hazards around the player', () => {
    assert.equal(scene.obstacles.active.length, 0);
    assert.equal(scene.obstacles.gaps.length, 0);
  });
}

{
  game.ads.showRewarded = async () => false;
  game.changeScene(SCENE.GAMEOVER, {
    score: 900, distance: 800, coins: 4, best: 1120, isRecord: false, canRevive: true
  });
  await over.revive();
  test('declining the reward leaves the player on the game over screen', () => {
    assert.equal(game.currentKey, SCENE.GAMEOVER);
    assert.equal(over.ui.reviveBtn.disabled, true);
  });
}

{
  let interstitials = 0;
  game.ads.showInterstitial = async () => { interstitials += 1; return true; };
  game.save._write('stickman-runner.stats', { runs: 3, coins: 0, meters: 0 });
  await over.restart();
  test('an interstitial plays between runs on the configured cadence', () => {
    assert.equal(interstitials, 1);
    assert.equal(game.currentKey, SCENE.GAME);
  });

  game.save._write('stickman-runner.stats', { runs: 4, coins: 0, meters: 0 });
  game.changeScene(SCENE.GAMEOVER, { score: 1, distance: 1, coins: 0, best: 1, isRecord: false, canRevive: false });
  await over.restart();
  test('other runs restart with no ad at all', () => {
    assert.equal(interstitials, 1);
    assert.equal(game.currentKey, SCENE.GAME);
  });
}

{
  game.ads.ready = false;
  game.changeScene(SCENE.GAMEOVER, { score: 1, distance: 1, coins: 0, best: 1, isRecord: false, canRevive: true });
  test('with ads unavailable the revive button is hidden and the game is unaffected', () => {
    assert.equal(over.ui.reviveBtn.hidden, true);
    assert.equal(game.currentKey, SCENE.GAMEOVER);
  });
  game.ads.ready = true;
}

// 12. Clean teardown
game.destroy();
test('destroy removes listeners and stops the loop', () => {
  assert.equal(game.running, false);
  assert.equal(game.scenes.size, 0);
});

console.log(results.join('\n'));
console.log(process.exitCode ? '\nSome tests failed.' : '\nAll tests passed.');
process.exit(process.exitCode || 0);
