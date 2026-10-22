// src/entry/background.js
import { API_BASE, PROXY_HOSTS } from '../core/js/constants.js'

/**
 * A service worker is torn down while it is idle, and the extension can be
 * reloaded under it. Anything still in flight then fails with "Extension
 * context invalidated.", and a reply to a port that no longer exists throws
 * the same. Both are wrapped: a dead context stays silent instead of filling
 * the console with errors the user cannot act on.
 */
function reply(sendResponse, payload) {
  try {
    sendResponse(payload)
  } catch {
    // The port is gone; there is nobody left to answer.
  }
}

/**
 * There is no `default_popup`: the toolbar icon is the sidebar's only trigger,
 * so the click is relayed to the content script of the current tab. Tabs that
 * do not run the content script (chrome:// pages, other sites) simply ignore it.
 */
chrome.action.onClicked.addListener((tab) => {
  if (typeof tab?.id !== 'number') return
  try {
    chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_SETTINGS' }).catch(() => {})
  } catch {
    // The extension was reloaded between the click and the send.
  }
})

/**
 * The only place allowed to talk to the backend. Content scripts and the
 * settings sidebar relay their requests here through `chrome.runtime.sendMessage`.
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== 'API_REQUEST') return false

  const { endpoint, options } = message.payload
  const url = new URL(`${API_BASE}/${endpoint}`)
  for (const [key, value] of Object.entries(options.query || {})) {
    if (value === undefined || value === null || value === '') continue
    url.searchParams.set(key, value)
  }

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
    .then((data) => reply(sendResponse, { ok: true, data }))
    .catch((err) => reply(sendResponse, { ok: false, error: err.message }))

  return true
})

/**
 * Live proxy requests, keyed by the id the content script supplied. The map is
 * what makes a prefetch cancellable: dropping the entry aborts the fetch, so a
 * batch the user seeked away from stops consuming their bandwidth.
 */
const activeRequests = new Map()

function isProxyable(url) {
  try {
    return PROXY_HOSTS.includes(new URL(url).hostname)
  } catch {
    return false
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== 'PROXY_REQUEST') return false

  const { requestId, url, method, body, contentType } = message.payload || {}
  if (!isProxyable(url)) {
    reply(sendResponse, { ok: false, error: `Host not allowed: ${url}` })
    return false
  }

  const controller = new AbortController()
  if (requestId) activeRequests.set(requestId, controller)

  let request
  try {
    request = fetch(url, {
      method: method || 'GET',
      headers: contentType ? { 'Content-Type': contentType } : undefined,
      body,
      signal: controller.signal,
    })
  } catch (err) {
    if (requestId) activeRequests.delete(requestId)
    reply(sendResponse, { ok: false, error: err.message })
    return false
  }

  request
    .then(async (response) => {
      const data = await response.json()
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${JSON.stringify(data).slice(0, 200)}`)
      }
      return data
    })
    .then((data) => reply(sendResponse, { ok: true, data }))
    .catch((err) => {
      // An abort is a deliberate decision by the caller, not a failure.
      if (err.name === 'AbortError') {
        reply(sendResponse, { ok: false, error: 'aborted', aborted: true })
        return
      }
      reply(sendResponse, { ok: false, error: err.message })
    })
    .finally(() => {
      if (requestId) activeRequests.delete(requestId)
    })

  return true
})

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type !== 'PROXY_ABORT') return false

  const { requestId } = message.payload || {}
  const controller = requestId ? activeRequests.get(requestId) : null
  if (controller) {
    controller.abort()
    activeRequests.delete(requestId)
  }
  return false
})
