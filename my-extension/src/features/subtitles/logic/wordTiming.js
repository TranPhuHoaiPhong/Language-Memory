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
 * allowed before giving up on a part. An unmatched *word* simply renders
 * normally, which is why the result can contain holes; non-word parts instead
 * inherit the timing of the word before them, so punctuation dims together with
 * the word it trails.
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

  if (!matched) return null

  // The tokenizer peels punctuation and spaces into their own parts, and they
  // trail the word they belong to, so they inherit its timing. Without this they
  // would stay fully lit while the word they follow is still dimmed, which is
  // what makes a sentence look half-faded.
  let last = null
  for (let i = 0; i < timings.length; i++) {
    if (timings[i]) {
      last = timings[i]
      continue
    }
    if (!parts[i]?.word) timings[i] = last
  }

  return timings
}
