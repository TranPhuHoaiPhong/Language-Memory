import { startPreferences } from '../src/core/js/preferences.js'
import { registerStorageKey } from '../src/core/js/registry.js'
import { STORAGE_KEYS } from '../src/core/js/constants.js'
import { subtitleStore } from '../src/features/subtitles/state/state.js'
import { loadTranscript } from '../src/features/subtitles/composables/useTranscript.js'

// Exactly what features/subtitles/index.js registers.
function onLanguageChanged() {
  subtitleStore.currentVideoId = null
  loadTranscript()
}
registerStorageKey(STORAGE_KEYS.targetLanguage, onLanguageChanged)
registerStorageKey(STORAGE_KEYS.nativeLanguage, onLanguageChanged)

export { startPreferences, loadTranscript, subtitleStore }
