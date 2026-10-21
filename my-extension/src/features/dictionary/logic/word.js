// src/features/dictionary/logic/word.js
import { apiRequest } from '../../../core/js/api.js'

/** A lookup only shows this many senses; the rest is noise in a popup. */
const MAX_MEANINGS = 3

/**
 * `GET /search/vocabulary?lemma=love&lang=vi`: the vocabulary is keyed by the
 * dictionary form, so `lemma` is the whole lookup and `lang` is the language the
 * definition has to be written in — the user's native language. Nothing else is
 * sent, so a word the backend broke down no further is looked up by its own text.
 *
 * This is the light lookup behind the hover popup.
 */
export function fetchWordInfo(lemma, language) {
  return apiRequest('search/vocabulary', {
    method: 'GET',
    query: { lemma, lang: language },
  })
}

/**
 * `GET /search/detail-vocabulary?lemma=love&lang=vi`: the same lookup, but the
 * full entry — IPA, part of speech and audio included. Used by the clicked-word
 * panel, which has room for all of it, where the popup only shows the senses.
 */
export function fetchWordDetail(lemma, language) {
  return apiRequest('search/detail-vocabulary', {
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
/** Chuẩn hoá payload tra từ thành cấu trúc panel dùng. */
export function readEntry(data) {
  if (!data) return {}

  const pronunciations = Array.isArray(data.pronunciations) ? data.pronunciations : []
  const us = pronunciations.find((p) => p.dialect === 'en-US') || pronunciations[0]
  const ipa = us?.phonetic ? us.phonetic.replace(/^\/|\/$/g, '') : ''

  const meanings = Array.isArray(data.meanings) ? data.meanings : []
  const posList = [...new Set(meanings.map((m) => m.part_of_speech).filter(Boolean))]

  /**
   * The pronunciation file, wherever the API happens to put it: on the entry
   * itself or on the pronunciation it belongs to. The current API ships none,
   * and the panel falls back to the browser's own voice.
   */
  const audio =
    data.audio ||
    data.audio_url ||
    us?.audio ||
    pronunciations.find((p) => p.audio || p.audio_url)?.audio ||
    ''

  return {
    word: data.text || '',
    ipa,
    pos: posList.join(', '),
    audio,
    meanings,
    inflections: data.inflections || [],
    synonyms: data.synonyms || [],
    relatedWords: data.related_words || [],
    // Bóc lớp phrase_entry cho tiện render
    phrases: (data.phrases || []).map((p) => p.phrase_entry).filter(Boolean),
  }
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
