// src/features/dictionary/logic/word.js
import { apiRequest } from '../../../core/js/api.js'

/**
 * `lemma` is the dictionary form of the hovered token ("it's" -> hover `'s` ->
 * lemma `be`), which is what makes an inflected or clitic piece resolvable; the
 * backend falls back to `word` when it is missing.
 */
export function fetchWordInfo(word, language, subtitle, sourceLanguage, lemma = '') {
  return apiRequest('search', {
    method: 'POST',
    body: { word, lemma, language, subtitle, sourceLanguage },
  })
}

export function saveWord(data) {
  return apiRequest('save', {
    method: 'POST',
    body: { data },
  })
}
