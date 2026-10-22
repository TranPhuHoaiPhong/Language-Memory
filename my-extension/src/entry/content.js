// src/entry/content.js
import { onContextInvalidated, onMessage } from '../core/js/browser.js'
import { showContextInvalidatedNotice } from '../core/js/contextNotice.js'
import { startPreferences } from '../core/js/preferences.js'
import { boot } from '../features/index.js'
import { togglePanel } from '../features/settings/index.js'

boot()

/**
 * A content script outlives the extension it was injected by: reload the
 * extension (every rebuild in `npm run dev` does) or let Chrome update it, and
 * this script keeps running in the page while every `chrome.*` call throws
 * "Extension context invalidated.". The extension is then alive on screen and
 * dead underneath, so the failure is turned into a notice that says what to do
 * about it.
 */
onContextInvalidated(() => {
  showContextInvalidatedNotice()
})

startPreferences().catch((err) => {
  console.error('[Lingo] Không tải được cấu hình đã lưu', err)
})

// The extension has no popup page: clicking the toolbar icon lands here.
onMessage((message) => {
  if (message.type === 'TOGGLE_SETTINGS') togglePanel()
})
