/**
 * PlayerController.js
 * Bridges Input intents to the Player. Keeping it separate means the same
 * Player works for replays or a future AI demo mode.
 */

export class PlayerController {
  constructor(player, input, audio) {
    this.player = player;
    this.input = input;
    this.audio = audio;
    this.enabled = false;
    this._unsubscribe = [
      input.on('jump', () => this.onJump()),
      input.on('jumpRelease', () => this.onJumpRelease()),
      input.on('slide', () => this.onSlide()),
      input.on('slideRelease', () => this.onSlideRelease())
    ];
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    if (!enabled) {
      this.player.holdingJump = false;
      this.player.holdingSlide = false;
    }
  }

  onJump() {
    if (!this.enabled || this.player.isDead) return;
    this.player.requestJump();
  }

  onJumpRelease() {
    if (!this.enabled) return;
    this.player.releaseJump();
  }

  onSlide() {
    if (!this.enabled || this.player.isDead) return;
    if (this.player.requestSlide()) this.audio.slide();
  }

  onSlideRelease() {
    if (!this.enabled) return;
    this.player.releaseSlide();
  }

  /** Called every frame so audio matches the jump that actually happened. */
  handleJumpResult(jumped) {
    if (jumped === 1) this.audio.jump();
    else if (jumped === 2) this.audio.doubleJump();
  }

  destroy() {
    this._unsubscribe.forEach((off) => off());
    this._unsubscribe.length = 0;
  }
}
