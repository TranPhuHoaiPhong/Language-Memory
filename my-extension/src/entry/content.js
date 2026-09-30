// src/entry/content.js
import { onMessage } from '../core/js/browser.js'
import { startPreferences } from '../core/js/preferences.js'
import { boot } from '../features/index.js'
import { togglePanel } from '../features/settings/index.js'

boot()
startPreferences()

// The extension has no popup page: clicking the toolbar icon lands here.
onMessage((message) => {
  if (message.type === 'TOGGLE_SETTINGS') togglePanel()
})
