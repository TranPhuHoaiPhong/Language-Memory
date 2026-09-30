// src/background/main.js
import { API_BASE } from '../shared/constants.js'

/**
 * There is no `default_popup`: the toolbar icon is the sidebar's only trigger,
 * so the click is relayed to the content script of the current tab. Tabs that
 * do not run the content script (chrome:// pages, other sites) simply ignore it.
 */
chrome.action.onClicked.addListener((tab) => {
  if (typeof tab?.id !== 'number') return
  chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_SETTINGS' }).catch(() => {})
})

/**
 * The only place allowed to talk to the backend. Content scripts and the
 * settings sidebar relay their requests here through `chrome.runtime.sendMessage`.
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== 'API_REQUEST') return false

  const { endpoint, options } = message.payload
  const url = `${API_BASE}/${endpoint}`
  const config = {
    headers: { 'Content-Type': 'application/json' },
    method: options.method || 'GET',
  }
  if (options.body) {
    config.body = JSON.stringify(options.body)
  }

  fetch(url, config)
    .then(async (response) => {
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`API Error (${response.status}): ${errorText}`)
      }
      return response.json()
    })
    .then((data) => sendResponse({ ok: true, data }))
    .catch((err) => sendResponse({ ok: false, error: err.message }))

  return true
})
