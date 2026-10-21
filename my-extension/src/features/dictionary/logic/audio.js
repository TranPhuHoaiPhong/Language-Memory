// src/features/dictionary/logic/audio.js

const player = new Audio()
player.preload = 'none'

/**
 * The browser's own voices. The dictionary API ships no audio file, so the
 * pronunciation is spoken by the browser itself — the same source the web app
 * uses, and one that needs no network round-trip.
 */
export function isSpeechSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

/** `en` → `en-US`; a code that already carries a region is kept as it is. */
export function toSpeechLocale(language) {
  const code = (language || '').trim()
  if (!code) return 'en-US'
  if (code.includes('-')) return code
  return code === 'en' ? 'en-US' : code
}

/** The voice of the browser that matches `locale` best, `undefined` if none. */
function pickVoice(locale) {
  const voices = window.speechSynthesis.getVoices()
  if (!voices.length) return undefined

  const target = locale.toLowerCase()
  const base = target.split('-')[0]

  return (
    voices.find((voice) => voice.lang.toLowerCase() === target) ||
    voices.find((voice) => voice.lang.toLowerCase().split('-')[0] === base)
  )
}

/**
 * Speaks `text` with the browser's voices.
 *
 * Returns `false` when the browser has no speech support, so the caller can
 * fall back to an audio file instead of doing nothing.
 */
export function speak(text, language = 'en') {
  if (!text || !isSpeechSupported()) return false

  const synth = window.speechSynthesis
  const locale = toSpeechLocale(language)

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = locale

  const voice = pickVoice(locale)
  if (voice) utterance.voice = voice

  synth.cancel()
  synth.speak(utterance)
  return true
}

/** Plays a pronunciation file. */
export function playAudio(url) {
  if (!url) return Promise.resolve()
  player.pause()
  player.currentTime = 0
  player.src = url
  return player.play().catch((err) => {
    console.warn('[AUDIO] Auto play failed:', err)
  })
}

/** Stops both the audio file and the spoken pronunciation. */
export function stopAudio() {
  player.pause()
  player.currentTime = 0
  if (isSpeechSupported()) window.speechSynthesis.cancel()
}
