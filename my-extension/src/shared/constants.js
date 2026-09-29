// src/shared/constants.js

export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api/v1'

export const AUDIO_ICON_URL = 'icons/2.svg'

/** Distance (px) below which a mouse gesture still counts as a plain click. */
export const CLICK_MOVE_THRESHOLD = 4

export const STORAGE_KEYS = {
  targetLanguage: 'target_language',
  nativeLanguage: 'native_language',
}

export const DEFAULT_LANGUAGES = {
  target: 'en',
  native: 'en',
}

export const SUBTITLE_POSITION_KEY = 'subtitlePosition'
