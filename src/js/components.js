/** @type {Map<string, (el: HTMLElement) => void>} */
const initializers = new Map();

/**
 * Add a component type to the registry.
 * @param {string} className element class name
 * @param {(el: HTMLElement) => void} initializer function
 */
export function register(className, initializer) {
  initializers.set(className, initializer);
}

function initialize() {
  for (const [className, initializer] of initializers) {
    for (const element of document.getElementsByClassName(className))
      initializer(element);
  }
}

window.addEventListener("load", initialize);
