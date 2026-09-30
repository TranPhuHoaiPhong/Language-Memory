// src/features/dictionary/logic/word.js
import { apiRequest } from '../../../core/js/api.js'

export function fetchWordInfo(word, language, subtitle, sourceLanguage) {
  return apiRequest('search', {
    method: 'POST',
    body: { word, language, subtitle, sourceLanguage },
  })
}

export function saveWord(data) {
  return apiRequest('save', {
    method: 'POST',
    body: { data },
  })
}
