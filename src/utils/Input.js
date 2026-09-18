/**
 * Input.js
 * Normalises keyboard, mouse and touch into four intents: jump, slide,
 * pause and restart. Every listener it adds can be removed again.
 */

export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.listeners = new Map();
    this.jumpHeld = false;
    this.slideHeld = false;

    this._touch = { id: null, x: 0, y: 0, time: 0, resolved: false };
    this._tapTimer = 0;
    this._bound = [];

    this._add(window, 'keydown', this._onKeyDown);
    this._add(window, 'keyup', this._onKeyUp);
    this._add(window, 'blur', this._onBlur);
    this._add(canvas, 'pointerdown', this._onPointerDown);
    this._add(canvas, 'pointermove', this._onPointerMove);
    this._add(canvas, 'pointerup', this._onPointerUp);
    this._add(canvas, 'pointercancel', this._onPointerUp);
    this._add(canvas, 'contextmenu', (e) => e.preventDefault());
  }

  _add(target, type, handler) {
    const bound = handler.bind ? handler.bind(this) : handler;
    const options = type.startsWith('pointer') ? { passive: false } : undefined;
    target.addEventListener(type, bound, options);
    this._bound.push([target, type, bound, options]);
  }

  /** Subscribe to 'jump' | 'jumpRelease' | 'slide' | 'slideRelease' | 'pause' | 'restart' | 'pointer'. */
  on(event, callback) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event).add(callback);
    return () => this.listeners.get(event).delete(callback);
  }

  emit(event, payload) {
    const set = this.listeners.get(event);
    if (!set) return;
    for (const callback of set) callback(payload);
  }

  _onKeyDown(event) {
    if (event.repeat) return;
    switch (event.code) {
      case 'Space':
      case 'ArrowUp':
      case 'KeyW':
        event.preventDefault();
        this.jumpHeld = true;
        this.emit('jump');
        break;
      case 'ArrowDown':
      case 'KeyS':
        event.preventDefault();
        this.slideHeld = true;
        this.emit('slide');
        break;
      case 'KeyP':
      case 'Escape':
        this.emit('pause');
        break;
      case 'KeyR':
        this.emit('restart');
        break;
      default:
        break;
    }
  }

  _onKeyUp(event) {
    switch (event.code) {
      case 'Space':
      case 'ArrowUp':
      case 'KeyW':
        this.jumpHeld = false;
        this.emit('jumpRelease');
        break;
      case 'ArrowDown':
      case 'KeyS':
        this.slideHeld = false;
        this.emit('slideRelease');
        break;
      default:
        break;
    }
  }

  _onBlur() {
    this.jumpHeld = false;
    this.slideHeld = false;
    this.emit('jumpRelease');
    this.emit('slideRelease');
    this.emit('blur');
  }

  /** Converts a pointer event to virtual game coordinates. */
  toGamePoint(event) {
    const rect = this.canvas.getBoundingClientRect();
    return this.canvas.__toGame(event.clientX - rect.left, event.clientY - rect.top);
  }

  _onPointerDown(event) {
    if (this._touch.id !== null) return;
    event.preventDefault();
    const point = this.toGamePoint(event);
    this._touch = { id: event.pointerId, x: event.clientX, y: event.clientY, time: performance.now(), resolved: false };
    this.emit('pointer', point);
    if (this._touch.resolved) return; // a UI hit consumed this press

    // Taps jump, but a swipe needs a moment to declare itself. 90ms is short
    // enough to feel instant and long enough to read a deliberate swipe.
    this.jumpHeld = true;
    this._tapTimer = window.setTimeout(() => {
      this._tapTimer = 0;
      if (this._touch.id !== null && !this._touch.resolved) {
        this._touch.resolved = 'tap';
        this.emit('jump');
      }
    }, 90);
  }

  /** Lets a UI element (the pause button) swallow the current press. */
  consumeTap() {
    this._touch.resolved = true;
    this._clearTapTimer();
    this.jumpHeld = false;
  }

  _clearTapTimer() {
    if (this._tapTimer) window.clearTimeout(this._tapTimer);
    this._tapTimer = 0;
  }

  _onPointerMove(event) {
    if (event.pointerId !== this._touch.id || this._touch.resolved) return;
    const dx = event.clientX - this._touch.x;
    const dy = event.clientY - this._touch.y;
    if (Math.abs(dy) < 28 || Math.abs(dy) < Math.abs(dx)) return;
    this._touch.resolved = 'swipe';
    this._clearTapTimer();
    if (dy < 0) {
      this.jumpHeld = true;
      this.emit('jump');
    } else {
      this.jumpHeld = false;
      this.slideHeld = true;
      this.emit('slide');
    }
  }

  _onPointerUp(event) {
    if (event.pointerId !== this._touch.id) return;
    const resolution = this._touch.resolved;
    this._touch.id = null;
    this._clearTapTimer();

    if (!resolution) this.emit('jump'); // lifted before the tap timer fired

    this.jumpHeld = false;
    this.slideHeld = false;
    this.emit('jumpRelease');
    this.emit('slideRelease');
  }

  destroy() {
    this._clearTapTimer();
    for (const [target, type, handler, options] of this._bound) {
      target.removeEventListener(type, handler, options);
    }
    this._bound.length = 0;
    this.listeners.clear();
  }
}
