// src/features/subtitles/index.js
import { createApp } from 'vue'
import { STORAGE_KEYS } from '../../core/js/constants.js'
import { createHost } from '../../core/js/hosts.js'
import { registerSettingsTab, registerStorageKey } from '../../core/js/registry.js'
import SubtitleOverlay from './components/SubtitleOverlay.vue'
import SubtitleSettings from './components/SubtitleSettings.vue'
import { loadTranscript } from './composables/useTranscript.js'
import { SETTINGS_KEY, normalizeSettings } from './state/settings.js'
import { setSettings, subtitleStore } from './state/state.js'
import './styles/styles.css'

/** The sidebar restyles the overlay the moment the user touches a control. */
registerStorageKey(SETTINGS_KEY, setSettings)

/**
 * A different language pair means a different transcript, so either key reloads
 * it. The dedupe lives in `loadTranscript`, which is keyed on the video *and* the
 * pair, so both keys firing in one turn still costs a single round trip.
 */
registerStorageKey(STORAGE_KEYS.targetLanguage, loadTranscript)
registerStorageKey(STORAGE_KEYS.nativeLanguage, loadTranscript)

registerSettingsTab({
  id: 'subtitle',
  label: 'Phụ đề',
  storageKey: SETTINGS_KEY,
  normalize: normalizeSettings,
  component: SubtitleSettings,
})

export const subtitles = {
  id: 'subtitles',
  mount() {
    createApp(SubtitleOverlay).mount(createHost())
  },
}
