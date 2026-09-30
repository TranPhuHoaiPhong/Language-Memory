// src/features/subtitles/logic/wordTiming.js

// Punctuation and case are the only things that reliably differ between a
// rendered token and the word the backend timed, so they are dropped before
// comparing. Curly apostrophes show up in captions often enough to be worth
// folding onto the straight one.
const IGNORED = /[^\p{L}\p{N}']+/gu
const LOOKAHEAD = 4

function normalizeWord(value) {
  return String(value ?? '')
    .replace(/\u2019/g, "'")
    .toLowerCase()
    .replace(IGNORED, '')
}

/**
 * Maps the `words` timings of a cue onto the word parts produced by
 * `tokenizeBlock`, so each rendered span knows when it starts.
 *
 * The two lists describe the same text but not the same segmentation — the
 * tokenizer peels punctuation into its own parts — so a small look-ahead is
 * allowed before giving up on a part. Anything unmatched simply renders
 * normally, which is why the result can contain holes.
 *
 * Returns an array parallel to `parts`, holding the matched word or `null`.
 */
export function alignWordTimings(parts, words) {
  if (!Array.isArray(parts) || !parts.length) return null
  if (!Array.isArray(words) || !words.length) return null

  const timings = new Array(parts.length).fill(null)
  let cursor = 0
  let matched = 0

  for (let i = 0; i < parts.length; i++) {
    if (!parts[i]?.word) continue

    const key = normalizeWord(parts[i].text)
    if (!key) continue

    let hit = -1
    for (let offset = 0; offset < LOOKAHEAD; offset++) {
      const candidate = cursor + offset
      if (candidate >= words.length) break
      if (normalizeWord(words[candidate]?.text) === key) {
        hit = candidate
        break
      }
    }

    if (hit === -1) continue

    cursor = hit + 1
    timings[i] = words[hit]
    matched++
  }

  return matched ? timings : null
}
