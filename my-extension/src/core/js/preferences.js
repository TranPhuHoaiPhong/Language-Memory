// src/core/js/preferences.js
import { onStorageChanged, storageGet } from './browser.js'
import { applyStorageKey, registeredStorageKeys } from './registry.js'

/**
 * Loads every storage key a feature registered, then keeps it in sync with
 * later edits, so the features react the moment the user tweaks a slider.
 *
 * Features register their keys while their modules are evaluated, so this has
 * to run once the feature list is imported. Runs from the content-script entry
 * point, which lives as long as the page, so the returned unsubscribe is not
 * needed.
 */
export async function startPreferences() {
  const keys = registeredStorageKeys()
  const stored = await storageGet(keys)

  keys.forEach((key) => applyStorageKey(key, stored[key]))

  return onStorageChanged(keys, (values) => {
    Object.keys(values).forEach((key) => applyStorageKey(key, values[key]))
  })
}
