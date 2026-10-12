// src/features/settings/index.js
import { createApp } from 'vue'
import { createSidebarHost } from '../../core/js/sidebar.js'
import { togglePanel } from './composables/useSettingsPanel.js'
import { mountPlayerButton } from './logic/playerButton.js'
import SettingsPanel from './components/SettingsPanel.vue'
import './styles/styles.css'

export const settingsPanel = {
  id: 'settings',
  /**
   * Two things: the panel itself, in the fixed dock on the right of the screen,
   * and the button in the player's control bar that opens it.
   */
  mount() {
    createApp(SettingsPanel).mount(createSidebarHost())
    mountPlayerButton()
  },
}

export { togglePanel }
