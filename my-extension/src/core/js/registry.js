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
 * registration order.
 *
 * The language pair is kept in its own map because it is the session state the
 * rest of the extension reads: those setters must land *before* any feature
 * reacts, otherwise a feature sees a half-updated pair and asks for the wrong
 * transcript. A startup read loads many keys at once, so applying them one by
 * one would fire a feature once per key with a partially applied pair — hence
 * `applyStorageBatch`, which settles the session state first and only then
 * notifies features.
 */
const session = new Map([
  [STORAGE_KEYS.targetLanguage, [setTargetLanguage]],
  [STORAGE_KEYS.nativeLanguage, [setNativeLanguage]],
])

/** Same shape, for the handlers features register. */
const storage = new Map()

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

/** Every key the session state and the features together need at startup. */
export function registeredStorageKeys() {
  return [...new Set([...session.keys(), ...storage.keys()])]
}

export function applyStorageKey(key, value) {
  session.get(key)?.forEach((apply) => apply(value))
  storage.get(key)?.forEach((apply) => apply(value))
}

/**
 * Applies a whole batch of loaded values, session state first. Loading is the
 * one moment several keys land together, and a feature that reacts to the
 * first of them would read the rest as still unset.
 */
export function applyStorageBatch(values) {
  session.forEach((handlers, key) => handlers.forEach((apply) => apply(values[key])))
  storage.forEach((handlers, key) => handlers.forEach((apply) => apply(values[key])))
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
