// src/features/subtitles/logic/subtitles.js

// A cue is a couple of seconds long whether it is measured in seconds or in
// milliseconds, so anything above this is only plausible as milliseconds.
const MILLISECOND_MEDIAN_LIMIT = 20

function toNumber(value) {
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

/**
 * The backend is not consistent about the unit: the word-timed payload reports
 * milliseconds while the older bilingual one reports seconds. Guessing from the
 * video clock is exact when the player is already mounted, and the median cue
 * length is a good enough fallback when it is not.
 */
function timeScale(subtitles, duration) {
  if (!subtitles.length) return 1

  if (Number.isFinite(duration) && duration > 0) {
    const latest = subtitles.reduce((acc, cue) => {
      const end = toNumber(cue?.end) || 0
      return end > acc ? end : acc
    }, 0)
    return latest > duration ? 0.001 : 1
  }

  const lengths = subtitles
    .map((cue) => (toNumber(cue?.end) ?? 0) - (toNumber(cue?.start) ?? 0))
    .filter((value) => value > 0)
    .sort((a, b) => a - b)
  if (!lengths.length) return 1

  return lengths[Math.floor(lengths.length / 2)] > MILLISECOND_MEDIAN_LIMIT ? 0.001 : 1
}

/** `null` when the cue carries no usable per-word timings. */
function normalizeWords(words, scale) {
  if (!Array.isArray(words)) return null

  const normalized = []
  for (const word of words) {
    const text = typeof word?.text === 'string' ? word.text.trim() : ''
    const start = toNumber(word?.start)
    if (!text || start === null) continue

    const end = toNumber(word?.end) ?? start
    normalized.push({ text, start: start * scale, end: Math.max(start, end) * scale })
  }

  return normalized.length ? normalized : null
}

function pickText(...candidates) {
  for (const value of candidates) {
    if (typeof value === 'string' && value) return value
  }
  return ''
}

/**
 * Turns whatever the backend returned into the shape the overlay renders:
 * seconds for every timestamp, the text under `original` / `translated`, and a
 * per-word `words` list when one was provided.
 */
export function normalizeSubtitles(subtitles, duration = 0) {
  if (!Array.isArray(subtitles)) return []

  const scale = timeScale(subtitles, duration)

  return subtitles
    .map((cue) => {
      const start = toNumber(cue?.start)
      if (start === null) return null

      const end = toNumber(cue?.end) ?? start
      return {
        start: start * scale,
        end: Math.max(start, end) * scale,
        lang: typeof cue?.lang === 'string' ? cue.lang : '',
        original: pickText(cue?.original, cue?.text),
        translated: typeof cue?.translated === 'string' ? cue.translated : '',
        words: normalizeWords(cue?.words, scale),
      }
    })
    .filter((cue) => cue !== null && cue.end >= cue.start)
}
