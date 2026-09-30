// src/core/js/constants.js

export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api/v1'

export const AUDIO_ICON_URL = 'icons/2.svg'

export const STORAGE_KEYS = {
  targetLanguage: 'target_language',
  nativeLanguage: 'native_language',
}

export const DEFAULT_LANGUAGES = {
  target: 'en',
  native: 'en',
}

/**
 * Hosts the service worker is allowed to fetch on behalf of a content script.
 * Anything outside this list is refused so the worker cannot be turned into an
 * open proxy by a page that manages to talk to it.
 */
export const PROXY_HOSTS = ['translate.googleapis.com']
