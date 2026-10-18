// src/features/subtitles/logic/transcript.js
import { apiRequest } from '../../../core/js/api.js'

const HIDE_CAPTION_STYLE_ID = 'hide-yt-caption-window';

export function hideYoutubeCaption() {
  if (document.getElementById(HIDE_CAPTION_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = HIDE_CAPTION_STYLE_ID;
  style.textContent = `
    #caption-window-1,
    [id^="caption-window-"] {
      display: none !important;
    }
  `;
  document.head.appendChild(style);
}

export function showYoutubeCaption() {
  document.getElementById(HIDE_CAPTION_STYLE_ID)?.remove();
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const getCcButton = () =>
  document.querySelector('.ytp-subtitles-button.ytp-button');

const isSubtitlesOn = () =>
  getCcButton()?.getAttribute('aria-pressed') === 'true';

function isValidCaption(body) {
  if (!body || body.length < 20) return false;
  try {
    const j = JSON.parse(body);
    return Array.isArray(j.events) && j.events.length > 0;
  } catch {
    const head = body.trimStart().slice(0, 10);
    return head.startsWith('<') || head.startsWith('WEBVTT');
  }
}

function getCandidates(videoId) {
  return performance
    .getEntriesByType('resource')
    .map((e) => e.name)
    .filter((name) => {
      try {
        const u = new URL(name);
        return (
          u.pathname.endsWith('/api/timedtext') &&
          u.searchParams.get('v') === videoId &&
          !u.searchParams.get('tlang')
        );
      } catch {
        return false;
      }
    })
    .reverse(); // mới nhất trước
}

// Thử fetch lần lượt các URL ứng viên, trả về body hợp lệ đầu tiên
async function tryFetchAny(videoId, tried) {
  for (const url of getCandidates(videoId)) {
    if (tried.has(url)) continue;
    tried.add(url);
    try {
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) continue;
      const body = await res.text();
      if (isValidCaption(body)) return body;
    } catch {}
  }
  return null;
}

// Một lần thử: trả về body hoặc null
async function attemptGetCaption(videoId, attempt, waitMs) {
  const tried = new Set();

  // Lần 1: nếu CC đã bật sẵn thì dùng luôn URL có sẵn, không đụng vào nút
  if (attempt === 1 && isSubtitlesOn()) {
    const body = await tryFetchAny(videoId, tried);
    if (body) return body;
  }

  // Các lần sau (hoặc lần 1 mà chưa có): ép player gọi lại timedtext
  performance.clearResourceTimings();
  tried.clear();

  const btn = getCcButton();
  if (!btn) return null; // video không có phụ đề / đang quảng cáo

  if (isSubtitlesOn()) {
    btn.click();          // tắt
    await sleep(400);
    btn.click();          // bật lại
  } else {
    btn.click();          // bật
  }

  const t0 = Date.now();
  while (Date.now() - t0 < waitMs) {
    await sleep(400);
    const body = await tryFetchAny(videoId, tried);
    if (body) return body;
  }
  return null;
}

async function sendTranscript(
  videoId = new URLSearchParams(location.search).get('v'),
  { waitMs = 6000, maxRetries = 2 } = {}
) {
  if (!videoId) throw new Error('Không tìm thấy videoId');

  hideYoutubeCaption();

  let body = null;
  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      body = await attemptGetCaption(videoId, attempt, waitMs);
      if (body) break;
      lastError = new Error('Caption rỗng hoặc chưa có URL');
    } catch (err) {
      lastError = err;
    }

    // Không log lỗi ở đây nữa — retry là chuyện bình thường.
    // Nếu cần debug thì bật dòng dưới:
    // console.debug(`[transcript] lần ${attempt}/${maxRetries} chưa có caption`);

    if (attempt < maxRetries) await sleep(800 * attempt); // chờ tăng dần
  }

  if (!body) {
    // Chỉ ném lỗi 1 lần duy nhất khi đã cạn số lần thử
    throw new Error(
      `Không lấy được caption sau ${maxRetries} lần thử: ${lastError?.message || ''}`
    );
  }

  return apiRequest('transcript', {
    method: 'POST',
    body: { target_transcript: body },
  });
}






export async function fetchTranscriptData(
  videoId,
  target_language,
  native_language,
  onProgress = () => {},
) {

  const data = await sendTranscript()

  return {
    subtitles: data.subtitles,
    sourceLanguage: data.sourceLanguage || '',
    nativeLanguage: data.nativeLanguage || '',
    noTranslation: data.noTranslation || false,
  }
}
