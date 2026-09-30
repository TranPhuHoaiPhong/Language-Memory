// src/shared/browser.js

/**
 * Thin wrappers over the `chrome.*` extension APIs so the app can also be
 * opened in a plain browser tab (`npm run dev`) without blowing up.
 */

const extension = typeof chrome !== 'undefined' ? chrome : undefined

export const isExtension = Boolean(extension?.storage?.sync)

export function runtimeUrl(path) {
  return extension?.runtime?.getURL ? extension.runtime.getURL(path) : `/${path}`
}

export function storageGet(keys) {
  if (!isExtension) return Promise.resolve({})
  return new Promise((resolve) => extension.storage.sync.get(keys, resolve))
}

export function storageSet(items) {
  if (!isExtension) return Promise.resolve()
  return new Promise((resolve) => extension.storage.sync.set(items, resolve))
}

export function sendMessage(message) {
  if (!extension?.runtime?.sendMessage) return Promise.resolve(undefined)
  return new Promise((resolve) => extension.runtime.sendMessage(message, resolve))
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

  extension.runtime.onMessage.addListener(listener)
  return () => extension.runtime.onMessage.removeListener(listener)
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

  extension.storage.onChanged.addListener(listener)
  return () => extension.storage.onChanged.removeListener(listener)
}
