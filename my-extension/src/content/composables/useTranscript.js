// src/content/composables/useTranscript.js
import { fetchTranscriptData } from '../../api/transcript.js'
import { setMessage, setSubtitles, store } from '../store.js'

export async function loadTranscript() {
  const videoId = new URL(location.href).searchParams.get('v')

  if (!videoId) {
    store.currentVideoId = null
    return
  }
  if (videoId === store.currentVideoId) return

  store.currentVideoId = videoId

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

    // Same language on both sides: nothing to show on top of YouTube's own
    // subtitle track.
    if (result.noTranslation) {
      setSubtitles([])
      setMessage('')
      return
    }

    setSubtitles(result.subtitles)
  } catch (err) {
    store.loading = false
    setSubtitles([])
    setMessage(err.message || 'Error loading transcript')
  }
}
