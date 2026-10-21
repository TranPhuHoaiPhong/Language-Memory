// src/features/settings/logic/playerButton.js
import { attachTo } from '../../../core/js/dom.js'
import { LOGO_ICON } from '../../../core/js/icons.js'
import { togglePanel } from '../composables/useSettingsPanel.js'

const CONTROLS_SELECTOR = '.ytp-right-controls-right'

/**
 * The extension's trigger inside the player, next to the fullscreen button.
 *
 * It is a plain element rather than a Vue app: nothing to keep in step with, and
 * one less mount point in the page. The player re-renders its control bar on its
 * own schedule, so an observer puts the button back after each re-render instead
 * of inserting it once and hoping it survives.
 */
export function mountPlayerButton() {
  const button = document.createElement('button')
  button.className = 'lingo-player-btn'
  button.type = 'button'
  button.title = 'Cài đặt LINGO'
  button.setAttribute('aria-label', 'Cài đặt LINGO')
  button.addEventListener('click', togglePanel)

  const icon = document.createElement('img')
  icon.src = LOGO_ICON
  icon.alt = ''
  button.appendChild(icon)

  function attach() {
    attachTo(document.querySelector(CONTROLS_SELECTOR), button)
  }

  attach()
  document.addEventListener('yt-navigate-finish', attach)

  const player = document.querySelector('.html5-video-player')
  if (player) {
    // `attachTo` is a no-op while the button is in place, so this only does work
    // on the frames where YouTube actually rebuilt the control bar.
    new MutationObserver(attach).observe(player, { childList: true, subtree: true })
  }
}
