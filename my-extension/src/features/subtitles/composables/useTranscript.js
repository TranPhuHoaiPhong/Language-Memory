// src/features/subtitles/composables/useTranscript.js
import { getVideo } from '../../../core/js/dom.js'
import { store } from '../../../core/js/state.js'
import { normalizeSubtitles } from '../logic/subtitles.js'
import { fetchTranscriptData } from '../logic/transcript.js'
import { startTranslation, stopTranslation } from '../logic/translator.js'
import { setMessage, setSubtitles, subtitleStore } from '../state/state.js'

/**
 * The transcript on screen is identified by the video *and* the language pair,
 * because the same video needs a new one whenever either language changes.
 * Callers fire this freely — the panel writes both language keys at once and
 * `storage.onChanged` reports each key separately — so the request is keyed by
 * what it depends on, not by how many times it was asked for. Without this,
 * one turn sends `send-id` + `transcript` twice.
 */
function requestKey(videoId) {
  return `${videoId}|${store.targetLanguage}|${store.nativeLanguage}`
}

let lastRequestKey = null
/**
 * Counts the requests that were actually started, so a response that lost the
 * race is dropped on arrival instead of overwriting a newer transcript.
 */
let requestId = 0

export async function loadTranscript() {
  const videoId = new URL(location.href).searchParams.get('v')

  if (!videoId) {
    stopTranslation()
    lastRequestKey = null
    return
  }

  const key = requestKey(videoId)
  if (key === lastRequestKey) return
  lastRequestKey = key

  // Whatever is on screen belongs to the previous video or language pair.
  stopTranslation()

  const id = ++requestId
  setSubtitles([])
  subtitleStore.loading = true
  setMessage('Generating')

  try {
    const result = await fetchTranscriptData(
      videoId,
      store.targetLanguage,
      store.nativeLanguage,
    )

    // The user changed video or languages while this was in flight: its result
    // is for a state the app has already left, so it must not touch the store.
    if (id !== requestId) {
      console.info('[Lingo] Bỏ qua response transcript cũ.')
      return
    }

    subtitleStore.sourceLanguage = result.sourceLanguage
    subtitleStore.loading = false

    const subtitles = normalizeSubtitles(result.subtitles, getVideo()?.duration)
    console.info(
      `[Lingo] Transcript: raw=${Array.isArray(result.subtitles) ? result.subtitles.length : 0}`,
      `usable=${subtitles.length}, noTranslation=${Boolean(result.noTranslation)}`,
      `source=${subtitleStore.sourceLanguage || 'unknown'}`,
    )

    // A same-language pair has nothing to overlay on top of YouTube's own track
    // — but when the backend still sent per-word timings there is, and they are
    // what makes the word highlighting worth showing.
    if (result.noTranslation && !subtitles.length) {
      console.info('[Lingo] Không hiển thị: backend không trả cue nào dùng được.')
      setSubtitles([])
      setMessage('')
      return
    }

    setSubtitles(subtitles)
    // Fire and forget: the overlay is already usable, translations stream in.
    startTranslation(videoId)
  } catch (err) {
    if (id !== requestId) return
    subtitleStore.loading = false
    setSubtitles([])
    setMessage(err.message || 'Error loading transcript')
  }
}
