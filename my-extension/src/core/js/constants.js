// src/core/js/constants.js

export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api/v1'

export const AUDIO_ICON_URL = 'icons/2.svg'
export const LOGO_ICON_URL = 'icons/icon.png'   // ← chỉ để path, không gọi getURL

export const STORAGE_KEYS = {
  targetLanguage: 'target_language',
  nativeLanguage: 'native_language',
}

export const DEFAULT_LANGUAGES = {
  target: 'en',
  native: 'en',
}

export const PROXY_HOSTS = ['translate.googleapis.com']