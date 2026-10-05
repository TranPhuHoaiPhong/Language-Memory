// src/core/js/dom.js

export const PLAYER_SELECTOR = '.html5-video-player'
export const PLAYER_CONTAINER_SELECTOR = '#player'
export const VIDEO_SELECTOR = 'video.html5-main-video'
export const SIDEBAR_SELECTOR = 'ytd-engagement-panel-section-list-renderer'

export function getPlayerContainer() {
  return document.querySelector(PLAYER_SELECTOR)
}

export function getPlayerRoot() {
  return document.querySelector(PLAYER_CONTAINER_SELECTOR)
}

export function getVideo() {
  return document.querySelector(VIDEO_SELECTOR)
}

/**
 * The watch page's right-hand column — the panel list YouTube fills with its own
 * sections. `null` on every page that has no sidebar.
 */
export function getSidebar() {
  return document.querySelector(SIDEBAR_SELECTOR)
}

/** Appends `child` to `container` unless it is already there. */
export function attachTo(container, child) {
  if (!container || !child) return false
  if (!container.contains(child)) {
    container.appendChild(child)
  }
  return true
}
