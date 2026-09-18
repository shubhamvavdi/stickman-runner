/**
 * Background.js
 * Four parallax layers drawn procedurally. Clouds and trees live in fixed
 * arrays that wrap around, so the world is endless without allocating.
 */

import { COLORS, GAME_HEIGHT, GAME_WIDTH, GROUND_Y } from '../utils/Constants.js';

const CLOUD_COUNT = 6;
const TREE_COUNT = 9;
const LAYER = { sky: 0, hillFar: 0.18, hillNear: 0.38, trees: 0.62 };

export class Background {
  constructor(random) {
    this.random = random;
    this.clouds = new Array(CLOUD_COUNT);
    this.trees = new Array(TREE_COUNT);
    this.offsets = { far: 0, near: 0, trees: 0 };
    this.reset();
  }

  reset() {
    this.offsets.far = 0;
    this.offsets.near = 0;
    this.offsets.trees = 0;
    for (let i = 0; i < CLOUD_COUNT; i += 1) {
      this.clouds[i] = {
        x: (i / CLOUD_COUNT) * (GAME_WIDTH + 260),
        y: 50 + this.random.range(0, 150),
        scale: this.random.range(0.6, 1.4),
        speed: this.random.range(0.05, 0.12)
      };
    }
    for (let i = 0; i < TREE_COUNT; i += 1) {
      this.trees[i] = {
        x: (i / TREE_COUNT) * (GAME_WIDTH + 200),
        scale: this.random.range(0.7, 1.25)
      };
    }
  }

  update(dt, scroll) {
    this.offsets.far = (this.offsets.far + scroll * LAYER.hillFar) % 640;
    this.offsets.near = (this.offsets.near + scroll * LAYER.hillNear) % 480;

    for (let i = 0; i < CLOUD_COUNT; i += 1) {
      const cloud = this.clouds[i];
      cloud.x -= scroll * cloud.speed;
      if (cloud.x < -180) {
        cloud.x = GAME_WIDTH + this.random.range(40, 240);
        cloud.y = 40 + this.random.range(0, 160);
        cloud.scale = this.random.range(0.6, 1.4);
      }
    }

    for (let i = 0; i < TREE_COUNT; i += 1) {
      const tree = this.trees[i];
      tree.x -= scroll * LAYER.trees;
      if (tree.x < -120) {
        tree.x = GAME_WIDTH + this.random.range(60, 220);
        tree.scale = this.random.range(0.7, 1.25);
      }
    }
  }

  draw(ctx) {
    this._drawSky(ctx);
    this._drawClouds(ctx);
    this._drawHills(ctx, this.offsets.far, 640, GROUND_Y - 132, 92, COLORS.hillFar);
    this._drawHills(ctx, this.offsets.near, 480, GROUND_Y - 74, 64, COLORS.hillNear);
    this._drawTrees(ctx);
  }

  _drawSky(ctx) {
    const gradient = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    gradient.addColorStop(0, COLORS.skyTop);
    gradient.addColorStop(1, COLORS.skyBottom);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = COLORS.sun;
    ctx.beginPath();
    ctx.arc(GAME_WIDTH * 0.76, 128, 54, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.16;
    ctx.beginPath();
    ctx.arc(GAME_WIDTH * 0.76, 128, 96, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  _drawClouds(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    for (let i = 0; i < CLOUD_COUNT; i += 1) {
      const cloud = this.clouds[i];
      const s = cloud.scale;
      ctx.beginPath();
      ctx.arc(cloud.x, cloud.y, 22 * s, 0, Math.PI * 2);
      ctx.arc(cloud.x + 26 * s, cloud.y + 6 * s, 17 * s, 0, Math.PI * 2);
      ctx.arc(cloud.x - 24 * s, cloud.y + 8 * s, 14 * s, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  _drawHills(ctx, offset, wavelength, baseY, amplitude, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-40, GROUND_Y + 40);
    for (let x = -40; x <= GAME_WIDTH + 40; x += 20) {
      const t = (x + offset) / wavelength;
      const y = baseY - Math.sin(t * Math.PI * 2) * amplitude - Math.sin(t * Math.PI * 5.3) * amplitude * 0.25;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(GAME_WIDTH + 40, GROUND_Y + 40);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  _drawTrees(ctx) {
    ctx.save();
    ctx.fillStyle = COLORS.treeFar;
    for (let i = 0; i < TREE_COUNT; i += 1) {
      const tree = this.trees[i];
      const s = tree.scale;
      const baseY = GROUND_Y - 4;
      ctx.fillRect(tree.x - 3 * s, baseY - 42 * s, 6 * s, 42 * s);
      ctx.beginPath();
      ctx.moveTo(tree.x - 22 * s, baseY - 34 * s);
      ctx.lineTo(tree.x, baseY - 86 * s);
      ctx.lineTo(tree.x + 22 * s, baseY - 34 * s);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(tree.x - 18 * s, baseY - 52 * s);
      ctx.lineTo(tree.x, baseY - 96 * s);
      ctx.lineTo(tree.x + 18 * s, baseY - 52 * s);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }
}
