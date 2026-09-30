// src/features/settings/index.js
import { createApp } from 'vue'
import { createHost } from '../../core/js/hosts.js'
import { togglePanel } from './composables/useSettingsPanel.js'
import SettingsPanel from './components/SettingsPanel.vue'
import './styles/styles.css'

export const settingsPanel = {
  id: 'settings',
  /**
   * The panel is `position: fixed`, so it must not inherit any of the page's
   * stacking contexts: a plain container appended to `<body>` is enough.
   */
  mount() {
    createApp(SettingsPanel).mount(createHost())
  },
}

export { togglePanel }
