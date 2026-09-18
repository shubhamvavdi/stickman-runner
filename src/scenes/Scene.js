/**
 * Scene.js
 * Minimal scene contract. The game owns the loop; scenes only describe what
 * happens during one frame and how to clean up after themselves.
 */

export class Scene {
  constructor(game) {
    this.game = game;
  }

  enter() {}
  exit() {}
  update() {}
  render() {}
  resize() {}
  destroy() {}
}
