// src/features/subtitles/logic/transcript.js
import { apiRequest } from '../../../core/js/api.js'

const HIDE_CAPTION_STYLE_ID = 'hide-yt-caption-window'

export function hideYoutubeCaption() {
  if (document.getElementById(HIDE_CAPTION_STYLE_ID)) return
  const style = document.createElement('style')
  style.id = HIDE_CAPTION_STYLE_ID
  style.textContent = `
    #caption-window-1,
    [id^="caption-window-"] {
      display: none !important;
    }
  `
  document.head.appendChild(style)
}

export function showYoutubeCaption() {
  document.getElementById(HIDE_CAPTION_STYLE_ID)?.remove()
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const getCcButton = () =>
  document.querySelector('.ytp-subtitles-button.ytp-button')

const isSubtitlesOn = () =>
  getCcButton()?.getAttribute('aria-pressed') === 'true'

function isValidCaption(body) {
  if (!body || body.length < 30) return false
  try {
    const j = JSON.parse(body)
    return Array.isArray(j.events) && j.events.length > 0
  } catch {
    const head = body.trimStart().slice(0, 20)
    return (
      head.startsWith('WEBVTT') ||
      head.startsWith('<?xml') ||
      head.startsWith('<') ||
      head.includes('timedtext')
    )
  }
}

/** Lấy videoId an toàn */
function getVideoId() {
  return new URLSearchParams(location.search).get('v')
}

/**
 * Lấy captionTracks từ ytInitialPlayerResponse
 */
function getCaptionTracksFromPlayer() {
  try {
    const playerResponse =
      window.ytInitialPlayerResponse ||
      window.ytplayer?.config?.args?.player_response

    if (!playerResponse) return []

    const data =
      typeof playerResponse === 'string'
        ? JSON.parse(playerResponse)
        : playerResponse

    return data?.captions?.playerCaptionsTracklistRenderer?.captionTracks || []
  } catch {
    return []
  }
}

/**
 * Xây dựng danh sách URL ứng viên từ captionTracks (fallback)
 */
function buildUrlsFromTracks() {
  const tracks = getCaptionTracksFromPlayer()
  const urls = []

  for (const track of tracks) {
    if (!track.baseUrl) continue

    const url = new URL(track.baseUrl)

    const formats = ['json3', 'srv3', 'vtt', 'ttml']
    for (const fmt of formats) {
      const u = new URL(url)
      u.searchParams.set('fmt', fmt)
      u.searchParams.delete('tlang')
      urls.push(u.toString())
    }
  }

  return urls
}

/**
 * Lấy URL timedtext từ performance resource (có sẵn pot, signature, ...)
 */
function getCandidatesFromPerformance(videoId) {
  return performance
    .getEntriesByType('resource')
    .map((e) => e.name)
    .filter((name) => {
      try {
        const u = new URL(name)
        return (
          u.pathname.includes('/api/timedtext') &&
          (u.searchParams.get('v') === videoId || !u.searchParams.has('v'))
        )
      } catch {
        return false
      }
    })
    .reverse()
}

/** Thử fetch lần lượt các URL */
async function tryFetchAny(urls, tried) {
  for (const url of urls) {
    if (tried.has(url)) continue
    tried.add(url)

    try {
      const res = await fetch(url, {
        credentials: 'include',
        cache: 'no-store',
      })
      if (!res.ok) continue

      const body = await res.text()
      if (isValidCaption(body)) return body
    } catch {
      // bỏ qua
    }
  }
  return null
}

/** Lấy mã ngôn ngữ gốc của URL (vd: 'vi', 'en', 'en-US') */
function getUrlLang(url) {
  try {
    return (new URL(url).searchParams.get('lang') || '').toLowerCase()
  } catch {
    return ''
  }
}

const isEnglish = (lang) => lang === 'en' || lang.startsWith('en-')

/**
 * Chuẩn bị URL timedtext đã bắt được (giữ nguyên pot, signature, ...)
 * - lang là en: giữ nguyên, không thêm tlang
 * - lang khác (vi, ...): thêm tlang=en
 */
function prepareUrl(url, tlang = 'en') {
  const u = new URL(url)
  const lang = getUrlLang(url)

  if (isEnglish(lang)) {
    u.searchParams.delete('tlang')
  } else {
    u.searchParams.set('tlang', tlang)
  }

  u.searchParams.set('fmt', 'json3')
  return { url: u.toString(), needTranslate: !isEnglish(lang) }
}

/** Gửi request 2 lần, cách nhau 1 giây; trả về body hợp lệ gần nhất */
async function fetchTwice(url, gapMs = 1000) {
  let result = null

  for (let i = 0; i < 2; i++) {
    if (i > 0) await sleep(gapMs)

    try {
      const res = await fetch(url, {
        credentials: 'include',
        cache: 'no-store',
      })
      if (!res.ok) continue

      const body = await res.text()
      if (isValidCaption(body)) result = body
    } catch {
      // bỏ qua, thử lần tiếp
    }
  }

  return result
}

/** Lấy caption từ các URL đã bắt được (lang khác en thì thêm tlang=en, gửi 2 lần) */
async function tryFetchTranslated(urls, tried, tlang = 'en') {
  for (const raw of urls) {
    const { url, needTranslate } = prepareUrl(raw, tlang)
    if (tried.has(url)) continue
    tried.add(url)

    // lang=en: gửi 1 lần bình thường; lang khác: tlang=en, gửi 2 lần cách 1 giây
    const body = needTranslate
      ? await fetchTwice(url)
      : (await tryFetchAny([url], new Set()))
    if (body) return body
  }
  return null
}

/** Ép player load lại caption bằng cách toggle nút CC */
async function forceLoadCaptions() {
  const btn = getCcButton()
  if (!btn) return false

  try {
    if (isSubtitlesOn()) {
      btn.click()
      await sleep(350)
      btn.click()
    } else {
      btn.click()
    }
    return true
  } catch {
    return false
  }
}

/**
 * Chờ player sẵn sàng (có nút CC hoặc đã có ytInitialPlayerResponse)
 */
async function waitForPlayerReady(timeout = 8000) {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    if (getCcButton() || window.ytInitialPlayerResponse) return true
    await sleep(300)
  }
  return false
}

async function attemptGetCaption(videoId, attempt, waitMs) {
  const tried = new Set()

  // 1. URL bắt từ performance (có pot) -> thêm tlang=en, gửi 2 lần
  const perfUrls = getCandidatesFromPerformance(videoId)
  if (perfUrls.length) {
    const body = await tryFetchTranslated(perfUrls, tried, 'en')
    if (body) return body
  }

  // 2. Fallback: baseUrl từ ytInitialPlayerResponse
  const trackUrls = buildUrlsFromTracks()
  if (trackUrls.length) {
    const body = await tryFetchAny(trackUrls, tried)
    if (body) return body
  }

  // 3. Ép player load caption rồi poll
  performance.clearResourceTimings()
  await forceLoadCaptions()

  const t0 = Date.now()
  while (Date.now() - t0 < waitMs) {
    await sleep(400)

    const captured = getCandidatesFromPerformance(videoId)
    if (captured.length) {
      const body = await tryFetchTranslated(captured, tried, 'en')
      if (body) return body
    }

    const body = await tryFetchAny(buildUrlsFromTracks(), tried)
    if (body) return body
  }

  return null
}

async function sendTranscript(
  videoId = getVideoId(),
  { waitMs = 7000, maxRetries = 3 } = {},
) {
  if (!videoId) throw new Error('Không tìm thấy videoId')

  hideYoutubeCaption()

  // Chờ player sẵn sàng
  const ready = await waitForPlayerReady()
  if (!ready) {
    console.warn('[transcript] Player chưa sẵn sàng')
  }

  let body = null
  let lastError = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      body = await attemptGetCaption(videoId, attempt, waitMs)
      if (body) break
      lastError = new Error('Caption rỗng hoặc chưa có URL')
    } catch (err) {
      lastError = err
    }

    if (attempt < maxRetries) {
      await sleep(600 * attempt)
    }
  }

  if (!body) {
    throw new Error(
      `Không lấy được caption sau ${maxRetries} lần thử: ${lastError?.message || ''}`,
    )
  }

  return apiRequest('transcript', {
    method: 'POST',
    body: { target_transcript: body },
  })
}

export async function fetchTranscriptData(
  videoId,
  target_language,
  native_language,
  onProgress = () => {},
) {
  const data = await sendTranscript(videoId)

  return {
    subtitles: data.subtitles,
    sourceLanguage: data.sourceLanguage || '',
    nativeLanguage: data.nativeLanguage || '',
    noTranslation: data.noTranslation || false,
  }
}