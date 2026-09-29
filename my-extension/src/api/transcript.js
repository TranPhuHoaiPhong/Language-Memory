// src/api/transcript.js
import { apiRequest } from './client.js'

function sendVideoId(videoId, target_language, native_language) {
  return apiRequest('send-id', {
    method: 'POST',
    body: { id: videoId, target_language, native_language },
  })
}

function sendTranscript(
  videoId,
  target_language,
  native_language,
  target_transcript,
  native_transcript,
) {
  return apiRequest('transcript', {
    method: 'POST',
    body: {
      target_transcript,
      native_transcript,
      target_language,
      native_language,
      videoId,
    },
  })
}

/**
 * Two-step flow:
 *   1. ask the backend for the two timedtext URLs,
 *   2. fetch those URLs here (same-origin-ish page context can do it),
 *   3. ship both raw transcripts back for processing.
 */
export async function fetchTranscriptData(
  videoId,
  target_language,
  native_language,
  onProgress = () => {},
) {
  const linkData = await sendVideoId(videoId, target_language, native_language)
  const { target_link, native_link } = linkData || {}

  if (!target_link || !native_link) {
    throw new Error('Không nhận được target_link hoặc native_link từ backend')
  }

  onProgress({ stage: 'downloading' })

  let targetTranscript
  let nativeTranscript
  try {
    const [targetRes, nativeRes] = await Promise.all([
      fetch(target_link),
      fetch(native_link),
    ])

    if (!targetRes.ok) throw new Error(`Fetch target_link failed: ${targetRes.status}`)
    if (!nativeRes.ok) throw new Error(`Fetch native_link failed: ${nativeRes.status}`)

    targetTranscript = await targetRes.text()
    nativeTranscript = await nativeRes.text()
  } catch (err) {
    console.error('Lỗi khi tải transcript từ YouTube:', err)
    throw new Error('Không thể tải transcript từ YouTube')
  }

  onProgress({ stage: 'translating' })

  const data = await sendTranscript(
    videoId,
    target_language,
    native_language,
    targetTranscript,
    nativeTranscript,
  )

  return {
    subtitles: data.subtitles,
    sourceLanguage: data.sourceLanguage,
    nativeLanguage: data.nativeLanguage,
    noTranslation: data.noTranslation || false,
  }
}
