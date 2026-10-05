// src/features/dictionary/logic/word.js
import { apiRequest } from '../../../core/js/api.js'

/** A lookup only shows this many senses; the rest is noise in a popup. */
const MAX_MEANINGS = 3

/**
 * `GET /search/vocabulary?lemma=love&lang=vi`: the vocabulary is keyed by the
 * dictionary form, so `lemma` is the whole lookup and `lang` is the language the
 * definition has to be written in — the user's native language. Nothing else is
 * sent, so a word the backend broke down no further is looked up by its own text.
 */
export function fetchWordInfo(lemma, language) {
  return apiRequest('search/vocabulary', {
    method: 'GET',
    query: { lemma, lang: language },
  })
}

/**
 * The entry a lookup answered with.
 *
 * `/search/vocabulary` puts it at the top level (`{ meanings: [...] }`), while the
 * older `search` endpoint wrapped it in `data`, so both shapes are unwrapped here
 * rather than at every call site.
 */
export function readEntry(payload) {
  if (!payload || typeof payload !== 'object') return {}

  const inner = payload.data
  return inner && typeof inner === 'object' ? inner : payload
}

/**
 * The explanations of a vocabulary response, at most `MAX_MEANINGS` of them and
 * without the empty ones, ready to be listed.
 *
 * The endpoint answers with `meanings[].explanation`; a bare `meaning` is the
 * single-string shape of the older response, so it is read as a list of one.
 */
export function readMeanings(payload) {
  if (!payload || typeof payload !== 'object') return []

  let entries = []
  if (Array.isArray(payload.meanings)) {
    entries = payload.meanings
  } else if (typeof payload.meaning === 'string') {
    entries = [{ explanation: payload.meaning }]
  }

  return entries
    .map((entry) => (typeof entry?.explanation === 'string' ? entry.explanation.trim() : ''))
    .filter(Boolean)
    .slice(0, MAX_MEANINGS)
}

export function saveWord(data) {
  return apiRequest('save', {
    method: 'POST',
    body: { data },
  })
}
