// src/features/subtitles/state/state.js
import { reactive } from 'vue'
import { SUBTITLE_POSITION_KEY, normalizeSettings } from './settings.js'

/**
 * State of the subtitle overlay, the transcript it renders and the translation
 * scheduler feeding it. It is a plain module-level reactive object because the
 * overlay and the word popup are separate apps on separate hosts, so they
 * cannot use provide/inject.
 */
export const subtitleStore = reactive({
  /**
   * Appearance chosen in the settings sidebar, applied live to the overlay.
   * Deep-cloned, not spread: a shallow copy would share the nested groups with
   * DEFAULT_SETTINGS, so any later mutation would corrupt the factory default.
   */
  settings: normalizeSettings({}),

  sourceLanguage: '',

  subtitles: [],
  currentIndex: 0,
  currentSubtitle: null,
  /**
   * Start time of the last word the video clock has reached, or -1 when the cue
   * has not started yet. Word opacity is driven off this instead of
   * `currentTime` so the overlay only re-renders on word boundaries.
   */
  activeWordTime: -1,
  loading: false,
  currentVideoId: null,

  /** `null` renders the transcript, a string renders it as a status line. */
  message: null,

  /** Vertical offset of the overlay, expressed as a ratio of the player height. */
  dragPosition: null,
})

export function setSubtitles(subtitles) {
  subtitleStore.subtitles = subtitles || []
  subtitleStore.currentIndex = 0
  subtitleStore.currentSubtitle = null
  subtitleStore.activeWordTime = -1
  subtitleStore.message = null
}

export function setMessage(message) {
  subtitleStore.message = message
}

/** Mutated in place so bindings on `settings` survive the update. */
export function setSettings(raw) {
  Object.assign(subtitleStore.settings, normalizeSettings(raw))
}

/**
 * The video the user watches is not storage: it is read from the URL, so the
 * last drag position is kept in `localStorage` and restored on load.
 */
function restoreDragPosition() {
  try {
    const saved = localStorage.getItem(SUBTITLE_POSITION_KEY)
    if (!saved) return
    const pos = JSON.parse(saved)
    if (pos?.topRatio !== undefined) {
      subtitleStore.dragPosition = pos
    }
  } catch {
    // Corrupted value, fall back to the default position.
  }
}

export function saveDragPosition(position) {
  subtitleStore.dragPosition = position
  localStorage.setItem(SUBTITLE_POSITION_KEY, JSON.stringify(position))
}

restoreDragPosition()
