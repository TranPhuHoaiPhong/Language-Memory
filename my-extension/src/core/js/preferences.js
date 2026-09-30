// src/content/composables/usePreferences.js
import { onStorageChanged, storageGet } from '../../shared/browser.js'
import { STORAGE_KEYS } from '../../shared/constants.js'
import { SETTINGS_KEY } from '../../shared/settings.js'
import { loadLanguages, setSettings, store } from '../store.js'
import { loadTranscript } from './useTranscript.js'

/**
 * Loads everything the settings sidebar owns, then keeps it in sync with later edits so
 * the overlay restyles the moment the user tweaks a slider.
 *
 * Runs from the content-script entry point, which lives as long as the page,
 * so the returned unsubscribe is not needed.
 */
export async function initPreferences() {
  const [languages, settings] = await Promise.all([
    storageGet([STORAGE_KEYS.targetLanguage, STORAGE_KEYS.nativeLanguage]),
    storageGet([SETTINGS_KEY]),
  ])

  loadLanguages(languages)
  setSettings(settings[SETTINGS_KEY])

  return onStorageChanged(
    [STORAGE_KEYS.targetLanguage, STORAGE_KEYS.nativeLanguage, SETTINGS_KEY],
    (values) => {
      if (SETTINGS_KEY in values) {
        setSettings(values[SETTINGS_KEY])
        return
      }
      if (STORAGE_KEYS.targetLanguage in values || STORAGE_KEYS.nativeLanguage in values) {
        loadLanguages(values)
        // Force a refetch: `loadTranscript` bails out on an unchanged video id.
        store.currentVideoId = null
        loadTranscript()
      }
    },
  )
}
