// src/settings/composables/useSettingsPanel.js
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { storageGet, storageSet } from '../../shared/browser.js'
import { DEFAULT_LANGUAGES, STORAGE_KEYS } from '../../shared/constants.js'
import { SETTINGS_KEY, normalizeSettings } from '../../shared/settings.js'

/** Coalesce slider drags into a single write: storage.sync is rate limited. */
const SAVE_DELAY = 200
const SAVED_HINT_MS = 1200

/**
 * The panel lives in the content script, which lives as long as the page, so the
 * open/closed state is a module-level ref: the background worker toggles it by
 * sending a message instead of re-mounting the app.
 */
const isOpen = ref(false)

export function togglePanel() {
  isOpen.value = !isOpen.value
}

export function useSettingsPanel() {
  const ready = ref(false)
  const activeTab = ref('language')
  const nativeLanguage = ref(DEFAULT_LANGUAGES.native)
  const targetLanguage = ref(DEFAULT_LANGUAGES.target)
  const settings = ref(normalizeSettings({}))
  const showSavedHint = ref(false)

  let saveTimer = null
  let hintTimer = null
  /**
   * Guards the watcher while the stored values are being applied. `ready` is
   * not enough: the watcher is pre-flush, so it already observes `ready=true`
   * by the time it runs and would write the freshly loaded values straight
   * back to storage.
   */
  let hydrated = false

  async function persist() {
    await storageSet({
      [STORAGE_KEYS.targetLanguage]: targetLanguage.value,
      [STORAGE_KEYS.nativeLanguage]: nativeLanguage.value,
      [SETTINGS_KEY]: { ...settings.value },
    })

    showSavedHint.value = true
    clearTimeout(hintTimer)
    hintTimer = setTimeout(() => (showSavedHint.value = false), SAVED_HINT_MS)
  }

  onMounted(async () => {
    const stored = await storageGet([
      STORAGE_KEYS.targetLanguage,
      STORAGE_KEYS.nativeLanguage,
      SETTINGS_KEY,
    ])

    targetLanguage.value = stored[STORAGE_KEYS.targetLanguage] || DEFAULT_LANGUAGES.target
    nativeLanguage.value = stored[STORAGE_KEYS.nativeLanguage] || DEFAULT_LANGUAGES.native
    settings.value = normalizeSettings(stored[SETTINGS_KEY])
    ready.value = true

    // Let the watcher above run once (and bail out) before accepting edits.
    await nextTick()
    hydrated = true
  })

  // Every control writes straight to storage; no Save button.
  watch([targetLanguage, nativeLanguage, settings], () => {
    if (!hydrated) return
    clearTimeout(saveTimer)
    saveTimer = setTimeout(persist, SAVE_DELAY)
  })

  /** Back to the factory look; the watcher above persists it. */
  function resetSettings() {
    settings.value = normalizeSettings({})
  }

  function close() {
    isOpen.value = false
  }

  onBeforeUnmount(() => {
    clearTimeout(saveTimer)
    clearTimeout(hintTimer)
  })

  return {
    ready,
    isOpen,
    activeTab,
    nativeLanguage,
    targetLanguage,
    settings,
    showSavedHint,
    resetSettings,
    close,
  }
}
