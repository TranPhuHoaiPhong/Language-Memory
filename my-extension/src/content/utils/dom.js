// src/content/utils/dom.js

export const PLAYER_SELECTOR = '.html5-video-player'
export const PLAYER_CONTAINER_SELECTOR = '#player'
export const VIDEO_SELECTOR = 'video.html5-main-video'

export function getPlayerContainer() {
  return document.querySelector(PLAYER_SELECTOR)
}

export function getPlayerRoot() {
  return document.querySelector(PLAYER_CONTAINER_SELECTOR)
}

export function getVideo() {
  return document.querySelector(VIDEO_SELECTOR)
}

/** Appends `child` to `container` unless it is already there. */
export function attachTo(container, child) {
  if (!container || !child) return false
  if (!container.contains(child)) {
    container.appendChild(child)
  }
  return true
}
