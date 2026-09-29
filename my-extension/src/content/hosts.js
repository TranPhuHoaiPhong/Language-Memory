// src/content/hosts.js

/**
 * Mount points for the two independent Vue apps. They are `display: contents`
 * so the rendered roots behave as if they were direct children of whatever
 * container they get attached to (the YouTube player).
 */
function createHost() {
  const el = document.createElement('div')
  el.style.display = 'contents'
  document.body.appendChild(el)
  return el
}

export const subtitleHost = createHost()
export const wordPopupHost = createHost()
