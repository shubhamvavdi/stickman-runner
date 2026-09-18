/**
 * Minimal DOM + Canvas stub so the whole game can be exercised in Node.
 * It is a test harness only: nothing here ships to the browser.
 */

function noop() {}

function makeCtx() {
  const ctx = {
    canvas: null,
    globalAlpha: 1,
    save: noop, restore: noop, beginPath: noop, closePath: noop, moveTo: noop,
    lineTo: noop, arc: noop, ellipse: noop, quadraticCurveTo: noop, rect: noop,
    fill: noop, stroke: noop, clip: noop, fillRect: noop, strokeRect: noop,
    translate: noop, rotate: noop, scale: noop, setTransform: noop, fillText: noop,
    clearRect: noop, drawImage: noop, createLinearGradient: () => ({ addColorStop: noop }),
    measureText: (text) => ({ width: String(text).length * 8 })
  };
  return ctx;
}

class StubClassList {
  constructor() { this.set = new Set(); }
  add(...names) { names.forEach((n) => this.set.add(n)); }
  remove(...names) { names.forEach((n) => this.set.delete(n)); }
  toggle(name, force) { if (force) this.set.add(name); else this.set.delete(name); }
  contains(name) { return this.set.has(name); }
}

class StubElement {
  constructor(tag) {
    this.tagName = String(tag).toUpperCase();
    this.children = [];
    this.classList = new StubClassList();
    this.style = {};
    this.textContent = '';
    this.hidden = false;
    this.listeners = new Map();
    this.parentElement = null;
  }
  set className(value) { this._class = value; }
  get className() { return this._class || ''; }
  append(...nodes) { nodes.forEach((n) => { this.children.push(n); n.parentElement = this; }); }
  appendChild(node) { this.append(node); return node; }
  remove() { this.parentElement = null; }
  focus() {}
  setAttribute() {}
  getBoundingClientRect() { return { left: 0, top: 0, width: 960, height: 540 }; }
  addEventListener(type, handler) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type).add(handler);
  }
  removeEventListener(type, handler) { this.listeners.get(type)?.delete(handler); }
  dispatch(type, event = {}) {
    this.listeners.get(type)?.forEach((handler) => handler({ preventDefault: noop, ...event }));
  }
  click() { this.dispatch('click'); }
}

class StubCanvas extends StubElement {
  constructor() {
    super('canvas');
    this.width = 960;
    this.height = 540;
    this._ctx = makeCtx();
    this._ctx.canvas = this;
    this.parentElement = new StubElement('div');
  }
  getContext() { return this._ctx; }
}

export function installDom() {
  const storage = new Map();
  const listeners = new Map();

  const doc = {
    readyState: 'complete',
    hidden: false,
    fonts: { ready: Promise.resolve() },
    createElement: (tag) => new StubElement(tag),
    body: new StubElement('body'),
    getElementById: () => null,
    referrer: '',
    addEventListener: (type, handler) => {
      if (!listeners.has(`doc:${type}`)) listeners.set(`doc:${type}`, new Set());
      listeners.get(`doc:${type}`).add(handler);
    },
    removeEventListener: (type, handler) => listeners.get(`doc:${type}`)?.delete(handler)
  };

  const win = {
    devicePixelRatio: 1,
    innerWidth: 960,
    innerHeight: 540,
    localStorage: {
      getItem: (k) => (storage.has(k) ? storage.get(k) : null),
      setItem: (k, v) => storage.set(k, String(v)),
      removeItem: (k) => storage.delete(k)
    },
    matchMedia: () => ({ matches: false, addEventListener: noop }),
    addEventListener: (type, handler) => {
      if (!listeners.has(`win:${type}`)) listeners.set(`win:${type}`, new Set());
      listeners.get(`win:${type}`).add(handler);
    },
    removeEventListener: (type, handler) => listeners.get(`win:${type}`)?.delete(handler),
    dispatchEvent: noop,
    setTimeout: (fn, ms) => setTimeout(fn, ms),
    clearTimeout: (id) => clearTimeout(id),
    setInterval: (fn, ms) => setInterval(fn, ms),
    clearInterval: (id) => clearInterval(id),
    requestAnimationFrame: () => 0,
    cancelAnimationFrame: noop
  };
  win.parent = win;

  globalThis.window = win;
  globalThis.document = doc;
  globalThis.localStorage = win.localStorage;
  globalThis.requestAnimationFrame = win.requestAnimationFrame;
  globalThis.cancelAnimationFrame = win.cancelAnimationFrame;
  globalThis.CustomEvent = class CustomEvent { constructor(type, init) { this.type = type; this.detail = init?.detail; } };
  globalThis.performance = globalThis.performance || { now: () => Date.now() };

  const canvas = new StubCanvas();
  const uiRoot = new StubElement('div');
  return { canvas, uiRoot, storage, fire: (scope, type, event) => listeners.get(`${scope}:${type}`)?.forEach((h) => h({ preventDefault: noop, ...event })) };
}
