// src/core/js/hosts.js

/**
 * Mount point for an independent Vue app. It is `display: contents` so the
 * rendered root behaves as if it were a direct child of whatever container it
 * gets attached to (the YouTube player, or `<body>` for a fixed sidebar).
 *
 * Every feature mounts on its own host: they cannot share one app instance
 * because the overlay and the word popup are re-parented into different
 * containers, and the popup moves on fullscreen changes.
 */
export function createHost() {
  const el = document.createElement('div')
  el.style.display = 'contents'
  document.body.appendChild(el)
  return el
}
