// src/core/js/constants.js

export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api/v1'

export const STORAGE_KEYS = {
  targetLanguage: 'target_language',
  nativeLanguage: 'native_language',
}

export const DEFAULT_LANGUAGES = {
  target: 'en',
  native: 'en',
}

export const PROXY_HOSTS = ['translate.googleapis.com']
