// src/features/subtitles/logic/translationCache.js
import { localGet, localSet } from '../../../core/js/browser.js'

/**
 * Per-sentence translations live in `storage.local`, keyed as
 * `subtitle:{videoId}:{targetLanguage}:{nativeLanguage}:{subtitleIndex}`.
 *
 * The language pair is part of the key on purpose: switching the native
 * language must not surface Vietnamese text for a Chinese setting, and neither
 * value is baked into the key, so no new storage key is needed for them.
 */

/** Sentences kept per video/language pair before the oldest are dropped. */
const MAX_ENTRIES = 2000

function entryKey(videoId, targetLanguage, nativeLanguage, index) {
  return `subtitle:${videoId}:${targetLanguage}:${nativeLanguage}:${index}`
}

/**
 * Sidecar key listing which indices are cached, so loading a video is a single
 * lookup instead of probing every sentence. It cannot collide with an entry key
 * because the fourth segment is never a bare integer.
 */
function indexKey(videoId, targetLanguage, nativeLanguage) {
  return `subtitle-index:${videoId}:${targetLanguage}:${nativeLanguage}`
}

/**
 * Every cached sentence for this video and language pair.
 * Returns a `Map` of `subtitleIndex -> translated text`.
 */
export async function readCachedTranslations(videoId, targetLanguage, nativeLanguage) {
  if (!videoId) return new Map()

  const key = indexKey(videoId, targetLanguage, nativeLanguage)
  const stored = await localGet([key])
  const indices = Array.isArray(stored[key]) ? stored[key] : []
  if (!indices.length) return new Map()

  const keys = indices.map((index) => entryKey(videoId, targetLanguage, nativeLanguage, index))
  const values = await localGet(keys)

  const result = new Map()
  keys.forEach((entry, i) => {
    const text = values[entry]
    if (typeof text === 'string' && text) result.set(indices[i], text)
  })
  return result
}

/**
 * Stores `[[index, text], ...]`. Each sentence is written on its own so a
 * partial batch — or a batch abandoned mid-flight — still lands in the cache and
 * is never requested twice.
 */
export async function writeCachedTranslations(videoId, targetLanguage, nativeLanguage, entries) {
  if (!videoId) return

  const valid = entries.filter(([, text]) => typeof text === 'string' && text)
  if (!valid.length) return

  const key = indexKey(videoId, targetLanguage, nativeLanguage)
  const stored = await localGet([key])
  const known = new Set(Array.isArray(stored[key]) ? stored[key] : [])

  const items = {}
  for (const [index, text] of valid) {
    known.add(index)
    items[entryKey(videoId, targetLanguage, nativeLanguage, index)] = text
  }

  const merged = [...known].sort((a, b) => a - b)
  // Oldest sentences first: a long video can hold more than a caller ever
  // needs, and `storage.local` is not unbounded.
  const keep = merged.slice(-MAX_ENTRIES)
  for (const index of merged.slice(0, merged.length - keep.length)) {
    items[entryKey(videoId, targetLanguage, nativeLanguage, index)] = null
  }

  items[key] = keep
  await localSet(items)
}
