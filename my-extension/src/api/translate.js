// src/api/translate.js
import { sendMessage } from '../shared/browser.js'

/**
 * Google's public `translate_a/t` endpoint, reached through the service worker
 * because a content script on youtube.com cannot call it cross-origin.
 *
 * The source language stays on `auto` so caption tracks do not have to be
 * identified first, and `tl` is always taken from the user's setting — the
 * target language is never assumed to be Vietnamese.
 */
function buildUrl(nativeLanguage) {
  const params = new URLSearchParams({
    client: 'gtx',
    dt: 't',
    sl: 'auto',
    tl: nativeLanguage,
  })
  return `https://translate.googleapis.com/translate_a/t?${params}`
}

/** Sentences per request, and the ceiling on one request's payload. */
const BATCH_LIMIT = 10
const MAX_BODY_CHARS = 4000

/**
 * The endpoint answers with exactly one entry per `q` parameter, in the order
 * they were sent:
 *
 *   q=You know the rules.&q=A full house of cards
 *   -> [["Bạn biết các quy tắc.","en"],["Một ngôi nhà đầy đủ","en"]]
 *
 * A single `q` that produced several sentence fragments comes back one level
 * deeper, with those fragments as an array, so both shapes are read here.
 *
 * `expected` is how many sentences went in. The count is the only reliable
 * proof that a translation can still be mapped to its `subtitleIndex`; anything
 * that does not add up returns `null` and the caller retries a sentence at a
 * time rather than risk a line being translated onto the wrong subtitle.
 */
function extractTranslations(payload, expected) {
  if (!Array.isArray(payload) || payload.length !== expected) return null

  const texts = []
  for (const entry of payload) {
    if (!Array.isArray(entry)) return null
    const [head] = entry

    if (typeof head === 'string') {
      texts.push(head)
      continue
    }
    if (Array.isArray(head)) {
      texts.push(
        head
          .map((part) => (Array.isArray(part) ? (part[0] ?? '') : (part ?? '')))
          .join(''),
      )
      continue
    }
    return null
  }

  return texts
}

function abortRequest(requestId) {
  if (!requestId) return
  sendMessage({ type: 'PROXY_ABORT', payload: { requestId } })
}

/**
 * Sends every sentence as its own `q`. Newlines are folded to spaces because
 * the endpoint stops reading a `q` at the first line break, which would
 * silently drop the rest of a caption that happens to wrap.
 */
function post(url, sentences, requestId) {
  const body = new URLSearchParams()
  for (const text of sentences) body.append('q', text.replace(/\s+/g, ' ').trim())

  return sendMessage({
    type: 'PROXY_REQUEST',
    payload: {
      requestId,
      url,
      method: 'POST',
      body: body.toString(),
      contentType: 'application/x-www-form-urlencoded',
    },
  })
}

function request(url, sentences, requestId) {
  return post(url, sentences, requestId).then((response) => {
    if (!response) throw new Error('Không nhận được phản hồi từ background script')
    if (response.ok) return response.data
    const error = new Error(response.error || 'Google Translate request failed')
    error.aborted = Boolean(response.aborted)
    throw error
  })
}

async function translateBatch(sentences, url, requestId) {
  if (sentences.length === 1) {
    const payload = await request(url, sentences, requestId)
    return extractTranslations(payload, 1) || ['']
  }

  const payload = await request(url, sentences, requestId)
  const parsed = extractTranslations(payload, sentences.length)
  if (parsed) return parsed

  // The response did not line up with the request, so it cannot be trusted to
  // carry the right translation per sentence. Fall back to one request each.
  console.warn(
    'Lingo: batch dịch không khớp số câu, chuyển sang dịch từng câu',
    sentences.length,
    Array.isArray(payload) ? payload.length : payload,
  )
  return Promise.all(sentences.map((text) => translateOne(text, url, requestId)))
}

async function translateOne(text, url, requestId) {
  const payload = await request(url, [text], requestId)
  return extractTranslations(payload, 1)?.[0] ?? ''
}

/** Splits on total payload size, so one long caption cannot sink a batch. */
function splitBySize(sentences) {
  const groups = []
  let run = []
  let size = 0

  for (const text of sentences) {
    const cost = text.length + 3
    const full = run.length >= BATCH_LIMIT || (run.length && size + cost > MAX_BODY_CHARS)
    if (full) {
      groups.push(run)
      run = []
      size = 0
    }
    run.push(text)
    size += cost
  }
  if (run.length) groups.push(run)

  return groups
}

/**
 * Translates a list of sentences and returns one string per input, in the same
 * order — the property the scheduler's `subtitleIndex` mapping depends on.
 */
export async function translateSentences(sentences, nativeLanguage, requestId = null) {
  const list = sentences.filter((text) => typeof text === 'string' && text.trim())
  if (!list.length) return []

  const url = buildUrl(nativeLanguage)
  const results = new Array(list.length)
  const groups = splitBySize(list)

  // Offsets first, so the parallel groups can be stitched back in order.
  let offset = 0
  const jobs = groups.map((group) => {
    const job = { group, offset }
    offset += group.length
    return job
  })

  await Promise.all(
    jobs.map(async ({ group, offset: at }) => {
      const translated = await translateBatch(group, url, requestId)
      translated.forEach((text, i) => {
        results[at + i] = text
      })
    }),
  )

  return results
}

export { abortRequest }
