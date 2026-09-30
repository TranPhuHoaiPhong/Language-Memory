// src/content/composables/useTranscript.js
import { fetchTranscriptData } from '../../api/transcript.js'
import { setMessage, setSubtitles, store } from '../store.js'
import { getVideo } from '../utils/dom.js'
import { normalizeSubtitles } from '../utils/subtitles.js'
import { startTranslation, stopTranslation } from '../translator.js'

export async function loadTranscript() {
  const videoId = new URL(location.href).searchParams.get('v')

  if (!videoId) {
    stopTranslation()
    store.currentVideoId = null
    return
  }
  if (videoId === store.currentVideoId) return

  store.currentVideoId = videoId
  // The outgoing session belongs to the previous video (or language pair).
  stopTranslation()

  setSubtitles([])
  store.loading = true
  setMessage('Generating')

  try {
    const result = await fetchTranscriptData(
      videoId,
      store.targetLanguage,
      store.nativeLanguage,
    )

    store.sourceLanguage = result.sourceLanguage
    store.loading = false

    const subtitles = normalizeSubtitles(result.subtitles, getVideo()?.duration)
    console.info(
      `[Lingo] Transcript: raw=${Array.isArray(result.subtitles) ? result.subtitles.length : 0}`,
      `usable=${subtitles.length}, noTranslation=${Boolean(result.noTranslation)}`,
      `source=${store.sourceLanguage || 'unknown'}`,
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
    store.loading = false
    setSubtitles([])
    setMessage(err.message || 'Error loading transcript')
  }
}
