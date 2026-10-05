// src/features/dictionary/index.js
import { createApp } from 'vue'
import { createSidebarHost } from '../../core/js/sidebar.js'
import { wordPopupHost } from './logic/hosts.js'
import WordPanel from './components/WordPanel.vue'
import WordPopup from './components/WordPopup.vue'
import './styles/styles.css'

export const dictionary = {
  id: 'dictionary',
  mount() {
    createApp(WordPopup).mount(wordPopupHost)
    // The panel shares the watch page's sidebar column with the settings, so it
    // replaces that column's contents instead of floating over the player.
    createApp(WordPanel).mount(createSidebarHost())
  },
}
