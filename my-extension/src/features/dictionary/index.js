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
    // The panel shares the fixed right-hand dock with the settings, so opening
    // one evicts the other instead of the two stacking on the player.
    createApp(WordPanel).mount(createSidebarHost())
  },
}
