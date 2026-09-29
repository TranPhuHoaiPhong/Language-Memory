// src/content/main.js
import { createApp } from 'vue'
import SubtitleOverlay from './components/SubtitleOverlay.vue'
import WordPopup from './components/WordPopup.vue'
import { subtitleHost, wordPopupHost } from './hosts.js'
import { initPreferences } from './composables/usePreferences.js'
import { loadTranscript } from './composables/useTranscript.js'
import '../styles/content.css'

// Two independent apps: the overlay and the popup are re-parented into
// different containers (and the popup moves on fullscreen changes), so they
// cannot share a single app instance.
createApp(SubtitleOverlay).mount(subtitleHost)
createApp(WordPopup).mount(wordPopupHost)

initPreferences().then(loadTranscript)
