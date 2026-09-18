/**
 * dom.js
 * Tiny helpers so the UI modules stay readable. Menus are DOM (crisp text,
 * real buttons, keyboard focus) while gameplay is pure canvas.
 */

export function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function button(label, className = 'btn') {
  const node = el('button', className, label);
  node.type = 'button';
  return node;
}

export function show(node) {
  node.hidden = false;
  node.classList.add('is-visible');
}

export function hide(node) {
  node.hidden = true;
  node.classList.remove('is-visible');
}
