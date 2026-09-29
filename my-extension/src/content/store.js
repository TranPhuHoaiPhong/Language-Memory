// src/content/store.js
import { reactive } from 'vue'
import {
  DEFAULT_LANGUAGES,
  STORAGE_KEYS,
  SUBTITLE_POSITION_KEY,
} from '../shared/constants.js'
import { normalizeSettings } from '../shared/settings.js'

/**
 * Shared reactive state between the two content-script apps (subtitle overlay
 * and word popup). They are mounted on separate hosts and therefore cannot
 * use provide/inject, so they talk through this single store.
 */
export const store = reactive({
  /** Language the user is learning: the language subtitles are translated into. */
  targetLanguage: DEFAULT_LANGUAGES.target,
  /** Language the user already speaks: dictionary meanings are returned in it. */
  nativeLanguage: DEFAULT_LANGUAGES.native,
  sourceLanguage: '',

  /** Appearance chosen in the popup, applied live to the overlay. */
  // Deep-cloned, not spread: a shallow copy would share the nested groups with
  // DEFAULT_SETTINGS, so any later mutation would corrupt the factory default.
  settings: normalizeSettings({}),

  subtitles: [],
  currentIndex: 0,
  currentSubtitle: null,
  loading: false,
  currentVideoId: null,

  /** `null` renders the transcript, a string renders it as a status line. */
  message: null,

  /** Vertical offset of the overlay, expressed as a ratio of the player height. */
  dragPosition: null,
})

/**
 * The two apps are mounted on separate hosts, so the word popup registers its
 * `hide` action here for the overlay to call when playback resumes.
 */
export const popupControl = { hide: () => {} }

export function setSubtitles(subtitles) {
  store.subtitles = subtitles || []
  store.currentIndex = 0
  store.currentSubtitle = null
  store.message = null
}

export function setMessage(message) {
  store.message = message
}

export function loadLanguages(stored) {
  store.targetLanguage = stored?.[STORAGE_KEYS.targetLanguage] || DEFAULT_LANGUAGES.target
  store.nativeLanguage = stored?.[STORAGE_KEYS.nativeLanguage] || DEFAULT_LANGUAGES.native
}

/** Mutated in place so bindings on `store.settings` survive the update. */
export function setSettings(raw) {
  Object.assign(store.settings, normalizeSettings(raw))
}

function restoreDragPosition() {
  try {
    const saved = localStorage.getItem(SUBTITLE_POSITION_KEY)
    if (!saved) return
    const pos = JSON.parse(saved)
    if (pos?.topRatio !== undefined) {
      store.dragPosition = pos
    }
  } catch {
    // Corrupted value, fall back to the default position.
  }
}

restoreDragPosition()
