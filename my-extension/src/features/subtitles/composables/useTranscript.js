// src/features/subtitles/composables/useTranscript.js
import { getVideo } from '../../../core/js/dom.js'
import { store } from '../../../core/js/state.js'
import { normalizeSubtitles } from '../logic/subtitles.js'
import { fetchTranscriptData } from '../logic/transcript.js'
import { startTranslation, stopTranslation } from '../logic/translator.js'
import { setMessage, setSubtitles, subtitleStore } from '../state/state.js'

/**
 * The work triggered by a language change is keyed by the video *and* the pair,
 * even though the fetched transcript itself only depends on the video: a native
 * change still has to retranslate, and this is what keeps one turn from running
 * the same reload twice. Callers fire this freely — the panel writes both
 * language keys at once and `storage.onChanged` reports each key separately —
 * so the key is what it depends on, not how many times it was asked for.
 * Without this, one turn sends `send-id` + `transcript` twice.
 */
function requestKey(videoId) {
  return `${videoId}|${store.targetLanguage}|${store.nativeLanguage}`
}

let lastRequestKey = null
/**
 * The video and target language the on-screen transcript was fetched for. A
 * change to the reader's language alone does not need a new transcript: the
 * backend payload does not depend on it, so it is retranslated in place.
 */
let loadedVideoId = null
let loadedTargetLanguage = null
/**
 * Counts the requests that were actually started, so a response that lost the
 * race is dropped on arrival instead of overwriting a newer transcript.
 */
let requestId = 0

/** Drops the translations carried for the previous reader language. */
function clearTranslations() {
  for (const cue of subtitleStore.subtitles) cue.translated = ''
}

export async function loadTranscript() {
  const videoId = new URL(location.href).searchParams.get('v')

  if (!videoId) {
    stopTranslation()
    lastRequestKey = null
    loadedVideoId = null
    return
  }

  const key = requestKey(videoId)
  if (key === lastRequestKey) return
  lastRequestKey = key

  // Only the language the user reads changed. The transcript on screen does not
  // depend on it, so asking the backend again would be a wasted round trip:
  // keeping the cues and letting the scheduler retranslate them is enough.
  if (
    videoId === loadedVideoId &&
    store.targetLanguage === loadedTargetLanguage &&
    subtitleStore.subtitles.length
  ) {
    stopTranslation()
    clearTranslations()
    startTranslation(videoId)
    return
  }

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
    loadedVideoId = videoId
    loadedTargetLanguage = store.targetLanguage

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
