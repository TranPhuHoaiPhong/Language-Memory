// src/content/main.js
import { createApp } from 'vue'
import SubtitleOverlay from './components/SubtitleOverlay.vue'
import WordPopup from './components/WordPopup.vue'
import { onMessage } from '../shared/browser.js'
import SettingsPanel from '../settings/components/SettingsPanel.vue'
import { togglePanel } from '../settings/composables/useSettingsPanel.js'
import { subtitleHost, settingsHost, wordPopupHost } from './hosts.js'
import { initPreferences } from './composables/usePreferences.js'
import { loadTranscript } from './composables/useTranscript.js'
import '../styles/content.css'

// Three independent apps: the overlay and the word popup are re-parented into
// different containers (and the popup moves on fullscreen changes), so they
// cannot share a single app instance. The sidebar is fixed to the viewport and
// mounted on `settingsHost`.
createApp(SubtitleOverlay).mount(subtitleHost)
createApp(WordPopup).mount(wordPopupHost)
createApp(SettingsPanel).mount(settingsHost)

// The extension has no popup page: clicking the toolbar icon lands here.
onMessage((message) => {
  if (message.type === 'TOGGLE_SETTINGS') togglePanel()
})

initPreferences().then(loadTranscript)
