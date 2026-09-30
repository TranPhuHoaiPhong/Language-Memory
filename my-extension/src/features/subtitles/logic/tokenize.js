// src/features/subtitles/logic/tokenize.js

// Must stay in sync with `expandRangeToWords` so that every token rendered as
// a `.sub-word` span is exactly what the selection snapping can latch onto.
const WORD_TOKEN = /^[\w'-]+$/

/**
 * Splits a subtitle block into display lines, each line being a list of
 * `{ text, word }` parts. Word parts get rendered as `.sub-word` spans,
 * everything else is plain text.
 */
export function tokenizeBlock(text) {
  if (!text) return []

  return String(text)
    .split(/\r?\n/)
    .map((line) => ({
      parts: line
        .split(/([\w'-]+)/)
        .filter((token) => token !== '')
        .map((token) => ({ text: token, word: WORD_TOKEN.test(token) })),
    }))
}
