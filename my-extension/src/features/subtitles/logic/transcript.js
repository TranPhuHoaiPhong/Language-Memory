// src/api/transcript.js
import { apiRequest } from './client.js'

function sendVideoId(videoId, target_language) {
  return apiRequest('send-id', {
    method: 'POST',
    body: { id: videoId, target_language },
  })
}

function sendTranscript(
  target_transcript
) {
  return apiRequest('transcript', {
    method: 'POST',
    body: {
      target_transcript
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
  const linkData = await sendVideoId(videoId, target_language)
  const { target_link } = linkData || {}

  if (!target_link) {
    throw new Error('Không nhận được target_link từ backend')
  }

  onProgress({ stage: 'downloading' })

  let targetTranscript

  try {
    const targetRes = await fetch(target_link)

    if (!targetRes.ok) throw new Error(`Fetch target_link failed: ${targetRes.status}`)

    targetTranscript = await targetRes.text()
  } catch (err) {
    console.error('Lỗi khi tải transcript từ YouTube:', err)
    throw new Error('Không thể tải transcript từ YouTube')
  }

  onProgress({ stage: 'translating' })

  const data = await sendTranscript(
    targetTranscript
  )

  return {
    subtitles: data.subtitles,
    sourceLanguage: data.sourceLanguage || '',
    nativeLanguage: data.nativeLanguage || '',
    noTranslation: data.noTranslation || false,
  }
}
