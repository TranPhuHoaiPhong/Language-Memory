// src/core/i18n/index.js
import { store } from '../js/state.js'
import messages from './messages.json'

/**
 * The UI language follows the user's native language: someone who reads
 * Vietnamese gets the Vietnamese labels, everyone else gets English. Only the
 * locales the JSON defines are selectable, so a native language we have no
 * translation for falls back to English.
 */
const FALLBACK_LOCALE = 'en'

function localeFor(language) {
  return messages[language] ? language : FALLBACK_LOCALE
}

function lookup(table, key) {
  return key.split('.').reduce((node, part) => (node == null ? node : node[part]), table)
}

/**
 * Resolves a dotted key against the current locale. Reading `store.nativeLanguage`
 * here makes a call from a template (or a `computed`) re-run the moment the user
 * switches language. Unknown keys fall back to English and then to the key
 * itself, so a missing string is visible instead of blank.
 */
export function t(key) {
  const locale = localeFor(store.nativeLanguage)
  const value = lookup(messages[locale], key)
  if (value !== undefined) return value

  const fallback = lookup(messages[FALLBACK_LOCALE], key)
  return fallback !== undefined ? fallback : key
}
