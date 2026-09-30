// src/features/dictionary/index.js
import { createApp } from 'vue'
import { wordPopupHost } from './logic/hosts.js'
import WordPopup from './components/WordPopup.vue'
import './styles/styles.css'

export const dictionary = {
  id: 'dictionary',
  mount() {
    createApp(WordPopup).mount(wordPopupHost)
  },
}
