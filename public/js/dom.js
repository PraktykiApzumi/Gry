export function qs(selector) {
  return document.querySelector(selector);
}

export function qsa(selector) {
  return Array.from(document.querySelectorAll(selector));
}
