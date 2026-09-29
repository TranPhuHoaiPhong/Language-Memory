// src/api/word.js
import { apiRequest } from './client.js'

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
