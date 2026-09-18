/**
 * Player.js
 * State, physics and collision box for the stickman. Drawing lives in
 * PlayerAnimation, input mapping lives in PlayerController.
 */

import { CONFIG } from '../config.js';
import { GROUND_Y, PLAYER_X, PLAYER_STATE } from '../utils/Constants.js';

export class Player {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = PLAYER_X;
    this.y = GROUND_Y;      // y is the feet position
    this.vy = 0;
    this.state = PLAYER_STATE.IDLE;
    this.onGround = true;
    this.groundAvailable = true;
    this.jumpsUsed = 0;
    this.sliding = false;
    this.slideTimer = 0;
    this.slideCooldown = 0;
    this.coyote = 0;
    this.jumpBuffer = 0;
    this.invincibleTimer = 0;
    this.hitTimer = 0;
    this.isDead = false;
    this.runPhase = 0;
    this.deathY = CONFIG.physics.gapFallDeathY;
    this.holdingJump = false;
    this.holdingSlide = false;
  }

  get bounds() {
    const width = this.sliding ? CONFIG.player.slideWidth : CONFIG.player.standWidth;
    const height = this.sliding ? CONFIG.player.slideHeight : CONFIG.player.standHeight;
    return { x: this.x - width / 2, y: this.y - height, w: width, h: height };
  }

  get invincible() {
    return this.invincibleTimer > 0;
  }

  get falling() {
    return this.state === PLAYER_STATE.FALL;
  }

  setGroundAvailable(available) {
    this.groundAvailable = available;
  }

  requestJump() {
    this.jumpBuffer = CONFIG.physics.jumpBufferTime;
  }

  releaseJump() {
    this.holdingJump = false;
    if (this.vy < 0) this.vy *= CONFIG.physics.jumpCutMultiplier;
  }

  requestSlide() {
    this.holdingSlide = true;
    if (this.isDead || this.slideCooldown > 0) return false;
    if (!this.onGround) return false;
    this.sliding = true;
    this.slideTimer = CONFIG.physics.slideDuration;
    this.state = PLAYER_STATE.SLIDE;
    return true;
  }

  releaseSlide() {
    this.holdingSlide = false;
    if (this.sliding && this.slideTimer < CONFIG.physics.slideDuration - 0.15) {
      this._endSlide();
    }
  }

  _endSlide() {
    this.sliding = false;
    this.slideTimer = 0;
    this.slideCooldown = CONFIG.physics.slideCooldown;
    if (this.onGround) this.state = PLAYER_STATE.RUN;
  }

  _performJump() {
    if (this.sliding) this._endSlide();
    const canGroundJump = this.onGround || this.coyote > 0;
    if (canGroundJump) {
      this.jumpsUsed = 1;
      this.vy = CONFIG.physics.jumpVelocity;
    } else if (this.jumpsUsed < CONFIG.physics.maxJumps) {
      this.jumpsUsed += 1;
      this.vy = CONFIG.physics.doubleJumpVelocity;
    } else {
      return null; // hard cap: no infinite jumping
    }
    this.onGround = false;
    this.coyote = 0;
    this.holdingJump = true;
    this.state = PLAYER_STATE.JUMP;
    return this.jumpsUsed;
  }

  /**
   * @returns {{jumped:number|null}} which jump fired this frame, for audio.
   */
  update(dt, { moving = true, jumpHeld = false } = {}) {
    let jumped = null;

    if (this.invincibleTimer > 0) this.invincibleTimer -= dt;
    if (this.hitTimer > 0) this.hitTimer -= dt;
    if (this.slideCooldown > 0) this.slideCooldown -= dt;

    if (this.isDead) {
      this.vy += CONFIG.physics.gravity * dt;
      this.y += this.vy * dt;
      if (this.groundAvailable && this.y > GROUND_Y) {
        this.y = GROUND_Y;
        this.vy = 0;
      }
      return { jumped };
    }

    if (this.jumpBuffer > 0) {
      this.jumpBuffer -= dt;
      const result = this._performJump();
      if (result !== null) {
        jumped = result;
        this.jumpBuffer = 0;
      }
    }

    if (this.sliding) {
      this.slideTimer -= dt;
      if (this.slideTimer <= 0 && !this.holdingSlide) this._endSlide();
      else if (this.slideTimer <= -0.5) this._endSlide(); // hard cap on holding
    }

    const gravity = (!this.onGround && this.holdingSlide && this.vy > 0)
      ? CONFIG.physics.fastFallGravity
      : CONFIG.physics.gravity;

    const previousY = this.y;
    if (!this.onGround || !this.groundAvailable) {
      this.vy += gravity * dt;
      this.y += this.vy * dt;
    }

    // Landing only counts when the feet cross the surface from above. Without
    // this check a player already deep inside a pit would pop back up as soon
    // as the gap scrolled away.
    const crossedSurface = previousY <= GROUND_Y + 2 || this.y <= GROUND_Y + 8;
    if (this.groundAvailable && crossedSurface && this.y >= GROUND_Y && this.vy >= 0) {
      const wasAirborne = !this.onGround;
      this.y = GROUND_Y;
      this.vy = 0;
      this.onGround = true;
      this.jumpsUsed = 0;
      this.coyote = CONFIG.physics.coyoteTime;
      if (wasAirborne && !this.sliding) this.state = PLAYER_STATE.RUN;
    } else if (!this.groundAvailable && this.onGround) {
      this.onGround = false;
      this.coyote = CONFIG.physics.coyoteTime;
    }

    if (this.onGround) {
      this.coyote = CONFIG.physics.coyoteTime;
    } else if (this.coyote > 0) {
      this.coyote -= dt;
    }

    if (!this.onGround) {
      this.state = this.vy < 0 ? PLAYER_STATE.JUMP : PLAYER_STATE.FALL;
    } else if (this.sliding) {
      this.state = PLAYER_STATE.SLIDE;
    } else if (this.hitTimer > 0) {
      this.state = PLAYER_STATE.HIT;
    } else {
      this.state = moving ? PLAYER_STATE.RUN : PLAYER_STATE.IDLE;
    }

    if (this.state === PLAYER_STATE.RUN && moving) {
      this.runPhase += dt * 13;
    }

    this.holdingJump = jumpHeld;
    return { jumped };
  }

  takeHit() {
    this.hitTimer = 0.4;
    this.invincibleTimer = CONFIG.player.hitInvincibility;
    this.state = PLAYER_STATE.HIT;
  }

  kill(launch = true) {
    if (this.isDead) return;
    this.isDead = true;
    this.state = PLAYER_STATE.DEAD;
    this.sliding = false;
    if (launch) this.vy = -420;
  }
}
