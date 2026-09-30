// src/core/js/registry.js
import { STORAGE_KEYS } from './constants.js'
import { setTargetLanguage, setNativeLanguage } from './state.js'

/**
 * Everything a feature contributes to the app, collected while its module is
 * being evaluated. The entry point and the settings panel therefore never have
 * to know which features exist: adding one is a folder plus a line in
 * `features/index.js`.
 */

/**
 * `storage.sync` key -> the handlers that apply the stored value, in
 * registration order. The language pair is registered first so the session
 * state is up to date before a feature reacts to the same change.
 */
const storage = new Map([
  [STORAGE_KEYS.targetLanguage, [setTargetLanguage]],
  [STORAGE_KEYS.nativeLanguage, [setNativeLanguage]],
])

/** Extra tabs for the settings panel, in registration order. */
const tabs = []

/**
 * Declares that a feature wants `key` from `storage.sync`. `apply` is called
 * once with the value loaded at startup and again with every later change. More
 * than one feature can want the same key, so handlers are added, not replaced.
 */
export function registerStorageKey(key, apply) {
  const handlers = storage.get(key)
  if (handlers) {
    handlers.push(apply)
    return
  }
  storage.set(key, [apply])
}

export function registeredStorageKeys() {
  return [...storage.keys()]
}

export function applyStorageKey(key, value) {
  storage.get(key)?.forEach((apply) => apply(value))
}

/**
 * Declares a settings tab:
 *
 *   { id, label, storageKey, normalize, component }
 *
 * `normalize(stored)` turns a raw value into the model `component` edits, the
 * component takes a `settings` prop and emits `update:settings`.
 */
export function registerSettingsTab(tab) {
  tabs.push(tab)
}

export function registeredTabs() {
  return tabs
}
