/**
 * Ground.js
 * Draws the running surface in segments so gaps are real holes, and adds a
 * scrolling stripe so speed is readable.
 */

import { COLORS, GAME_HEIGHT, GAME_WIDTH, GROUND_Y } from '../utils/Constants.js';

export class Ground {
  constructor() {
    this.offset = 0;
  }

  reset() {
    this.offset = 0;
  }

  update(dt, scroll) {
    this.offset = (this.offset + scroll) % 80;
  }

  draw(ctx, gaps) {
    ctx.save();
    ctx.fillStyle = COLORS.groundFill;

    // Build the list of solid segments between gaps.
    const edges = [];
    for (let i = 0; i < gaps.length; i += 1) {
      if (gaps[i].active) edges.push(gaps[i]);
    }
    edges.sort((a, b) => a.x - b.x);

    let cursor = -60;
    for (let i = 0; i < edges.length; i += 1) {
      const gap = edges[i];
      if (gap.x > cursor) this._segment(ctx, cursor, gap.x - cursor);
      cursor = Math.max(cursor, gap.x + gap.w);
    }
    if (cursor < GAME_WIDTH + 60) this._segment(ctx, cursor, GAME_WIDTH + 60 - cursor);

    // Speed stripes on the surface.
    ctx.fillStyle = 'rgba(109,227,192,0.18)';
    for (let x = -this.offset; x < GAME_WIDTH + 80; x += 80) {
      let blocked = false;
      for (let i = 0; i < edges.length; i += 1) {
        if (x + 34 > edges[i].x && x < edges[i].x + edges[i].w) { blocked = true; break; }
      }
      if (!blocked) ctx.fillRect(x, GROUND_Y + 16, 34, 4);
    }
    ctx.restore();
  }

  _segment(ctx, x, width) {
    if (width <= 0) return;
    ctx.fillRect(x, GROUND_Y, width, GAME_HEIGHT - GROUND_Y);
    ctx.save();
    ctx.fillStyle = COLORS.groundLine;
    ctx.fillRect(x, GROUND_Y, width, 4);
    ctx.restore();
  }
}
