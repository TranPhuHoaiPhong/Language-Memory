// src/core/js/browser.js

/**
 * Thin wrappers over the `chrome.*` extension APIs so the app can also be
 * opened in a plain browser tab (`npm run dev`) without blowing up.
 *
 * Every call is guarded. A content script outlives the extension it was
 * injected by: reload the extension (which every rebuild in `npm run dev`
 * does) or let Chrome update it, and the script keeps running in the page
 * while every `chrome.*` call it makes throws "Extension context invalidated.".
 * That error must never reach the console as an unhandled rejection, so a dead
 * context answers with a neutral value and the page is told to reload.
 */

const extension = typeof chrome !== 'undefined' ? chrome : undefined

export const isExtension = Boolean(extension?.storage?.sync)

/** The message Chrome uses when the context is gone. */
const INVALIDATED = 'Extension context invalidated'

let invalidated = false
const invalidatedListeners = new Set()

/** True once a call has proved that the extension context is dead. */
export function isContextInvalidated() {
  return invalidated
}

/**
 * Registers a callback for the moment the context turns out to be dead.
 * Returns an unsubscribe function.
 */
export function onContextInvalidated(listener) {
  invalidatedListeners.add(listener)
  return () => invalidatedListeners.delete(listener)
}

/**
 * Records a dead context. Returns `true` when the error was the invalidation
 * itself, so the caller can stay quiet about it: it is not a failure of the
 * code that made the call, it is the state the whole page is in.
 */
function markInvalidated(error) {
  const message = String(error?.message || error || '')
  if (!message.includes(INVALIDATED)) return false

  if (!invalidated) {
    invalidated = true
    invalidatedListeners.forEach((listener) => {
      try {
        listener()
      } catch (err) {
        console.error('[Lingo] Không xử lý được thông báo context invalidated', err)
      }
    })
  }
  return true
}

/**
 * Reports an API failure that is *not* the invalidation: a quota error, a
 * closed port, a denied permission. Those are worth seeing.
 */
function reportFailure(scope, error) {
  if (markInvalidated(error)) return
  console.warn(`[Lingo] ${scope} thất bại`, error?.message || error)
}

export function runtimeUrl(path) {
  if (!extension?.runtime?.getURL) return `/${path}`
  try {
    return extension.runtime.getURL(path)
  } catch (error) {
    markInvalidated(error)
    return `/${path}`
  }
}

/**
 * Reads `keys` from `storage.sync`. Resolves with an empty object when the
 * context is dead or the read failed, so a caller can always read a value off
 * the result without a guard of its own.
 */
export function storageGet(keys) {
  if (!isExtension) return Promise.resolve({})
  return new Promise((resolve) => {
    try {
      extension.storage.sync.get(keys, (values) => {
        const error = extension.runtime?.lastError
        if (error) {
          reportFailure('storage.sync.get', error)
          resolve({})
          return
        }
        resolve(values || {})
      })
    } catch (error) {
      reportFailure('storage.sync.get', error)
      resolve({})
    }
  })
}

export function storageSet(items) {
  if (!isExtension) return Promise.resolve()
  return new Promise((resolve) => {
    try {
      extension.storage.sync.set(items, () => {
        const error = extension.runtime?.lastError
        if (error) reportFailure('storage.sync.set', error)
        resolve()
      })
    } catch (error) {
      reportFailure('storage.sync.set', error)
      resolve()
    }
  })
}

/**
 * `storage.local` is used for the subtitle translation cache: one entry per
 * sentence easily exceeds the `storage.sync` item limits, and the cache is
 * per-device data that has no business syncing.
 */
export function localGet(keys) {
  if (!extension?.storage?.local) return Promise.resolve({})
  return new Promise((resolve) => {
    try {
      extension.storage.local.get(keys, (values) => {
        const error = extension.runtime?.lastError
        if (error) {
          reportFailure('storage.local.get', error)
          resolve({})
          return
        }
        resolve(values || {})
      })
    } catch (error) {
      reportFailure('storage.local.get', error)
      resolve({})
    }
  })
}

export function localSet(items) {
  if (!extension?.storage?.local) return Promise.resolve()
  return new Promise((resolve) => {
    try {
      extension.storage.local.set(items, () => {
        const error = extension.runtime?.lastError
        if (error) reportFailure('storage.local.set', error)
        resolve()
      })
    } catch (error) {
      reportFailure('storage.local.set', error)
      resolve()
    }
  })
}

/**
 * Sends a message to the background worker. Resolves with `undefined` when the
 * context is dead or nobody answered, which is what the callers already treat
 * as "no response".
 */
export function sendMessage(message) {
  if (!extension?.runtime?.sendMessage) return Promise.resolve(undefined)
  return new Promise((resolve) => {
    try {
      extension.runtime.sendMessage(message, (response) => {
        const error = extension.runtime?.lastError
        if (error) {
          reportFailure('runtime.sendMessage', error)
          resolve(undefined)
          return
        }
        resolve(response)
      })
    } catch (error) {
      reportFailure('runtime.sendMessage', error)
      resolve(undefined)
    }
  })
}

/**
 * Listens for messages pushed by the background worker (the extension icon
 * toggling the settings sidebar). Returns an unsubscribe function.
 */
export function onMessage(handler) {
  if (!extension?.runtime?.onMessage) return () => {}

  const listener = (message) => {
    if (message?.type) handler(message)
  }

  try {
    extension.runtime.onMessage.addListener(listener)
  } catch (error) {
    markInvalidated(error)
    return () => {}
  }

  return () => {
    try {
      extension.runtime.onMessage.removeListener(listener)
    } catch {
      // The context is already gone; there is nothing left to detach from.
    }
  }
}

/**
 * Fires `callback` with the new values of `keys` whenever they change in
 * `storage.sync`. Returns an unsubscribe function.
 */
export function onStorageChanged(keys, callback) {
  if (!extension?.storage?.onChanged) return () => {}

  const listener = (changes, areaName) => {
    if (areaName !== 'sync') return
    const touched = keys.filter((key) => key in changes)
    if (touched.length === 0) return
    callback(Object.fromEntries(touched.map((key) => [key, changes[key].newValue])))
  }

  try {
    extension.storage.onChanged.addListener(listener)
  } catch (error) {
    markInvalidated(error)
    return () => {}
  }

  return () => {
    try {
      extension.storage.onChanged.removeListener(listener)
    } catch {
      // The context is already gone; there is nothing left to detach from.
    }
  }
}
