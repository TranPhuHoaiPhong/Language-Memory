// src/features/settings/composables/useSettingsPanel.js
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { storageGet, storageSet } from '../../../core/js/browser.js'
import { DEFAULT_LANGUAGES, STORAGE_KEYS } from '../../../core/js/constants.js'
import { registeredTabs } from '../../../core/js/registry.js'

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
  /** One tab per feature that registered a settings section, in registration order. */
  const tabs = registeredTabs()
  const activeTab = ref('language')
  const showSavedHint = ref(false)

  /**
   * Every storage key the panel edits: the language pair, which belongs to the
   * session, plus one key per feature tab. The panel is the only writer, so the
   * whole set is loaded and saved in one go.
   */
  const fields = [
    {
      storageKey: STORAGE_KEYS.targetLanguage,
      normalize: (value) => value || DEFAULT_LANGUAGES.target,
    },
    {
      storageKey: STORAGE_KEYS.nativeLanguage,
      normalize: (value) => value || DEFAULT_LANGUAGES.native,
    },
    ...tabs,
  ]

  /**
   * `storageKey` -> the value being edited. Seeded with the defaults rather than
   * left empty, because the tab components are rendered before the stored
   * values come back and read their model straight away.
   */
  const model = reactive(
    Object.fromEntries(fields.map((field) => [field.storageKey, field.normalize(null)])),
  )

  let saveTimer = null
  let hintTimer = null
  /**
   * Guards the watcher while the stored values are being applied. A `ready`
   * flag is not enough: the watcher is pre-flush, so it already observes it
   * by the time it runs and would write the freshly loaded values straight
   * back to storage.
   */
  let hydrated = false

  function fieldOf(storageKey) {
    return fields.find((field) => field.storageKey === storageKey)
  }

  /** `null` restores the default, which is what a tab's reset button sends. */
  function setField(storageKey, value) {
    const field = fieldOf(storageKey)
    model[storageKey] = field ? field.normalize(value) : value
  }

  const targetLanguage = computed({
    get: () => model[STORAGE_KEYS.targetLanguage],
    set: (value) => setField(STORAGE_KEYS.targetLanguage, value),
  })

  const nativeLanguage = computed({
    get: () => model[STORAGE_KEYS.nativeLanguage],
    set: (value) => setField(STORAGE_KEYS.nativeLanguage, value),
  })

  async function persist() {
    await storageSet({ ...model })

    showSavedHint.value = true
    clearTimeout(hintTimer)
    hintTimer = setTimeout(() => (showSavedHint.value = false), SAVED_HINT_MS)
  }

  onMounted(async () => {
    const stored = await storageGet(fields.map((field) => field.storageKey))

    fields.forEach((field) => {
      model[field.storageKey] = field.normalize(stored[field.storageKey])
    })

    // Let the watcher above run once (and bail out) before accepting edits.
    await nextTick()
    hydrated = true
  })

  // Every control writes straight to storage; no Save button.
  watch(
    model,
    () => {
      if (!hydrated) return
      clearTimeout(saveTimer)
      saveTimer = setTimeout(persist, SAVE_DELAY)
    },
    { deep: true },
  )

  function close() {
    isOpen.value = false
  }

  onBeforeUnmount(() => {
    clearTimeout(saveTimer)
    clearTimeout(hintTimer)
  })

  return {
    isOpen,
    activeTab,
    tabs,
    model,
    nativeLanguage,
    targetLanguage,
    setField,
    showSavedHint,
    close,
  }
}
