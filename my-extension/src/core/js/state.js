// src/core/js/state.js
import { reactive } from 'vue'
import { DEFAULT_LANGUAGES } from './constants.js'

/**
 * Session state no single feature owns: the language pair the whole extension
 * runs on. Everything a feature needs for itself lives in that feature's
 * `state.js`, next to the code that writes it.
 */
export const store = reactive({
  /** Language the user is learning: the language subtitles are translated into. */
  targetLanguage: DEFAULT_LANGUAGES.target,
  /** Language the user already speaks: dictionary meanings are returned in it. */
  nativeLanguage: DEFAULT_LANGUAGES.native,
})

/**
 * The content-script apps are mounted on separate hosts, so they cannot use
 * provide/inject. The word popup registers its `hide` action here for the
 * features that dismiss it (e.g. the overlay, when playback resumes).
 */
export const popupControl = { hide: () => {} }

export function setTargetLanguage(value) {
  store.targetLanguage = value || DEFAULT_LANGUAGES.target
}

export function setNativeLanguage(value) {
  store.nativeLanguage = value || DEFAULT_LANGUAGES.native
}
