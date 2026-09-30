// src/content/translator.js
import { abortRequest, translateSentences } from '../api/translate.js'
import { store } from './store.js'
import { getVideo } from './utils/dom.js'
import { readCachedTranslations, writeCachedTranslations } from './translationCache.js'

/**
 * Sentences per request.
 *
 * Google translates a batch as one passage, so the sentences on either side of a
 * line are what let it pick the right sense of a word. A lone sentence is a coin
 * flip, which is why nothing is ever requested on its own here.
 */
const BATCH_SIZE = 10

/**
 * How long before the current batch's last sentence the next batch is asked for.
 * A batch takes a moment to come back and has to be ready before the playhead
 * reaches it: a batch ending at second 100 is requested again at second 93.
 */
const PREFETCH_LEAD_SECONDS = 7

/** Backoff before a failed batch is retried, so a bad request cannot spin. */
const RETRY_MS = 30000

let session = null

function sentenceOf(cue) {
  return (cue?.original || '').trim()
}

function persist(state, entries) {
  const valid = entries.filter(([, text]) => typeof text === 'string' && text)
  if (!valid.length) return Promise.resolve()
  return writeCachedTranslations(
    state.videoId,
    state.targetLanguage,
    state.nativeLanguage,
    valid,
  ).catch((err) => console.warn('Lingo: không lưu được cache phụ đề', err))
}

/**
 * Index of the sentence the playhead is on. A playhead sitting in the silence
 * between two sentences is mapped to the one that comes next, so a batch is never
 * anchored on something already finished.
 */
function indexAt(subtitles, time) {
  let index = -1
  for (let i = 0; i < subtitles.length; i++) {
    if (subtitles[i].start <= time) index = i
    else break
  }
  if (index >= 0 && time > subtitles[index].end) index += 1
  return Math.min(index, subtitles.length - 1)
}

/**
 * Batches are cut on absolute cue boundaries, not relative to the playhead:
 * batch 3 is always cues 30-39. A seek therefore lands inside a batch that is the
 * same one other viewers of this video produced, the leading sentences stay
 * available as context, and nothing is ever translated twice under two different
 * groupings.
 */
function batchOf(index) {
  return Math.floor(index / BATCH_SIZE)
}

function batchRange(subtitles, batchNo) {
  const start = batchNo * BATCH_SIZE
  return [start, Math.min(start + BATCH_SIZE, subtitles.length)]
}

/** Start time of the last cue in the batch that actually has words in it. */
function lastSentenceStart(state, from, to) {
  for (let i = to - 1; i >= from; i--) {
    if (sentenceOf(state.subtitles[i])) return state.subtitles[i].start
  }
  return null
}

async function runBatch(state, job, indices) {
  try {
    const texts = indices.map((i) => sentenceOf(state.subtitles[i]))
    const translated = await translateSentences(texts, state.nativeLanguage, job.requestId)
    if (state.disposed) return

    const entries = []
    translated.forEach((text, i) => {
      const index = indices[i]
      if (!text) return
      state.resolved.add(index)
      state.subtitles[index].translated = text
      entries.push([index, text])
    })
    await persist(state, entries)
  } catch (err) {
    // Either way the batch has to become eligible again, otherwise one failed
    // request would leave ten sentences permanently untranslated.
    state.dispatched.delete(job.batchNo)
    if (!err.aborted) {
      console.warn('Lingo: dịch batch phụ đề thất bại', err)
      state.retryAt.set(job.batchNo, Date.now() + RETRY_MS)
    }
  } finally {
    // Only the batch that still owns the slot releases it: an aborted job can
    // resolve after its replacement has already started.
    if (state.pending === job) state.pending = null
  }
}

/**
 * Asks for one whole batch. No-ops once the batch is dispatched, cached or in
 * backoff — so it is safe to call on every position event without tracking
 * anything at the call site.
 */
function requestBatch(state, batchNo) {
  if (state.disposed) return
  if (state.dispatched.has(batchNo)) return
  if ((state.retryAt.get(batchNo) || 0) > Date.now()) return

  const [start, end] = batchRange(state.subtitles, batchNo)
  if (start >= end) return

  const indices = []
  for (let i = start; i < end; i++) {
    if (state.resolved.has(i)) continue
    if (!sentenceOf(state.subtitles[i])) continue
    indices.push(i)
  }

  // Claimed before the request goes out, so a second position event cannot queue
  // the same batch again while this one is still in the air.
  state.dispatched.add(batchNo)
  if (!indices.length) return

  const job = { batchNo, requestId: state.nextRequestId() }
  state.pending = job
  runBatch(state, job, indices)
}

/**
 * Re-aims the scheduler at `index`. The batch under the playhead is wanted
 * immediately — it holds the line on screen plus the ones around it — and the
 * following batch is wanted once the playhead nears the end of the current one.
 */
function handlePosition(state, index) {
  if (state.disposed || !state.subtitles.length) return
  if (index >= state.subtitles.length) return
  // A playhead sitting before the very first cue — the opening moments of a
  // video — still wants batch 0, so the scheduler starts rather than idles.
  const target = index < 0 ? 0 : index

  const current = batchOf(target)
  const [start, end] = batchRange(state.subtitles, current)

  // Only the current and the next batch are worth waiting on; a request for
  // somewhere the user left is dead weight.
  const pendingNo = state.pending?.batchNo
  if (pendingNo !== undefined && pendingNo !== current && pendingNo !== current + 1) {
    abortRequest(state.pending.requestId)
  }

  requestBatch(state, current)

  const lastStart = lastSentenceStart(state, start, end)
  if (lastStart === null) return
  const time = state.video ? state.video.currentTime : 0
  // Reaching ahead is speculative, so a paused video holds off on it — but the
  // batch under the playhead is still what is on screen, and stays wanted.
  if (state.paused) return
  if (time >= lastStart - PREFETCH_LEAD_SECONDS) {
    requestBatch(state, current + 1)
  }
}

function createSession(videoId) {
  // The reactive array, not the raw payload: filling in `translated` on it is
  // what makes the overlay pick the sentence up mid-playback.
  const subtitles = store.subtitles

  return {
    videoId,
    subtitles,
    targetLanguage: store.targetLanguage,
    nativeLanguage: store.nativeLanguage,
    /** Indices whose translation is already on the subtitle, cached or in flight. */
    resolved: new Set(),
    /** Batch numbers already sent, so a batch is never requested twice. */
    dispatched: new Set(),
    /** Batch numbers waiting out a failure before they are tried again. */
    retryAt: new Map(),
    /** The single in-flight batch, or null. */
    pending: null,
    /** Set by `pause` so playback stops pulling work it will not show. */
    paused: false,
    /** Set while the timeline is being dragged, so a scrub does not fire off a batch per position. */
    scrubbing: false,
    disposed: false,
    video: null,
    counter: 0,
    listeners: [],
    nextRequestId() {
      this.counter += 1
      return `${videoId}:${this.counter}`
    },
  }
}

function bindVideoEvents(state) {
  const video = getVideo()
  if (!video) return

  const currentTime = () => video.currentTime

  // Dragging the timeline fires `timeupdate` continuously; only the resting
  // position after the gesture is worth a request.
  const onSeeking = () => {
    state.scrubbing = true
  }

  const onSeeked = () => {
    state.scrubbing = false
    handlePosition(state, indexAt(state.subtitles, currentTime()))
  }

  const onTimeUpdate = () => {
    if (state.disposed || state.scrubbing) return
    handlePosition(state, indexAt(state.subtitles, currentTime()))
  }

  const onPause = () => {
    if (state.disposed) return
    // Nothing is being watched, so stop pulling work the user is not about to see.
    state.paused = true
  }

  const onPlay = () => {
    if (state.disposed) return
    state.paused = false
    handlePosition(state, indexAt(state.subtitles, currentTime()))
  }

  const bindings = [
    ['seeking', onSeeking],
    ['seeked', onSeeked],
    ['timeupdate', onTimeUpdate],
    ['loadedmetadata', onTimeUpdate],
    ['play', onPlay],
    ['pause', onPause],
  ]

  for (const [event, handler] of bindings) {
    video.addEventListener(event, handler)
    state.listeners.push([event, handler])
  }
  state.video = video
  // A page can load onto a paused player, and `pause` never fires on its own
  // then: taking the element's word for it keeps the scheduler from speculating
  // ahead for a video that is not playing.
  state.paused = Boolean(video.paused)
}

function teardown(state) {
  state.disposed = true
  abortRequest(state.pending?.requestId)
  state.pending = null

  if (state.video) {
    for (const [event, handler] of state.listeners) {
      state.video.removeEventListener(event, handler)
    }
  }
  state.listeners = []
  state.video = null
}

/**
 * Starts translating `store.subtitles` for `videoId`, resuming from whatever the
 * cache already holds. Safe to call again to retarget: the previous session is
 * torn down first, which is what makes a language switch or a new video drop the
 * old scheduler instead of racing it.
 */
export async function startTranslation(videoId) {
  stopTranslation()

  if (!videoId || !store.subtitles.length) {
    console.info(
      `[Lingo] Không dịch: videoId=${videoId || 'null'}, cues=${store.subtitles.length}`,
    )
    return
  }
  // Nothing to learn from a text already in the language the user reads. This
  // is also the state a fresh install starts in, so it says so out loud rather
  // than sitting there looking like a broken proxy.
  if (store.nativeLanguage === store.targetLanguage) {
    console.info(
      `[Lingo] Không dịch: ngôn ngữ đích và ngôn ngữ gốc đều là "${store.nativeLanguage}".`,
      'Đổi một trong hai trong Cài đặt > Ngôn ngữ để dịch.',
    )
    return
  }
  console.info(
    `[Lingo] Bắt đầu dịch: video=${videoId}, cues=${store.subtitles.length},`,
    `${store.nativeLanguage} -> ${store.targetLanguage}, batch=${BATCH_SIZE}, lead=${PREFETCH_LEAD_SECONDS}s`,
  )

  const state = createSession(videoId)
  session = state

  // The backend may have shipped translations of its own; those sentences are
  // done and must never be requested again.
  store.subtitles.forEach((cue, index) => {
    if (cue.translated) state.resolved.add(index)
  })

  try {
    const cached = await readCachedTranslations(
      videoId,
      state.targetLanguage,
      state.nativeLanguage,
    )
    if (state.disposed) return

    for (const [index, text] of cached) {
      state.resolved.add(index)
      const cue = state.subtitles[index]
      if (cue && !cue.translated) cue.translated = text
    }
  } catch (err) {
    console.warn('Lingo: không đọc được cache phụ đề', err)
  }
  if (state.disposed) return

  bindVideoEvents(state)

  // Opening from the start: the batch under the playhead goes out right away,
  // and the following one is picked up once the lead opens.
  handlePosition(state, indexAt(state.subtitles, getVideo()?.currentTime ?? 0))
}

export function stopTranslation() {
  if (!session) return
  teardown(session)
  session = null
}
