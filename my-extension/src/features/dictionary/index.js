// src/features/dictionary/index.js
import { createApp } from 'vue'
import { createHost } from '../../core/js/hosts.js'
import { wordPopupHost } from './logic/hosts.js'
import WordPanel from './components/WordPanel.vue'
import WordPopup from './components/WordPopup.vue'
import './styles/styles.css'

export const dictionary = {
  id: 'dictionary',
  mount() {
    createApp(WordPopup).mount(wordPopupHost)
    // The panel is `position: fixed` on the page, so a plain host on `<body>` is
    // enough — unlike the popup, it must not follow the player around.
    createApp(WordPanel).mount(createHost())
  },
}
