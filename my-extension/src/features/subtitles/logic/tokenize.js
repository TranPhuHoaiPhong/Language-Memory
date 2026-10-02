// src/features/subtitles/logic/tokenize.js

// Captions mix the apostrophe variants freely and the backend only ever times the
// straight one, so the comparison folds them together. Every variant also has to
// count as part of the *word*: `it’s` split on the curly one renders as three
// parts, and the trailing `s` becomes a word of its own to hover.
const APOSTROPHE_CHARS = '\u2018\u2019\u02bc\u00b4'
const APOSTROPHE = new RegExp(`['${APOSTROPHE_CHARS}]`)
const APOSTROPHES = new RegExp(`[${APOSTROPHE_CHARS}]`, 'g')

// Letters and digits rather than `\w`, which is ASCII-only: without it a
// Vietnamese or French cue renders as one long run of plain text and none of it
// is hoverable. Must stay in sync with `expandRangeToWords` so that every token
// rendered as a `.sub-word` span is exactly what the selection snapping can
// latch onto.
const WORD_CHAR = new RegExp(`[\\p{L}\\p{N}'${APOSTROPHE_CHARS}-]`, 'u')
const WORD_TOKEN = new RegExp(`^[\\p{L}\\p{N}'${APOSTROPHE_CHARS}-]+$`, 'u')
const WORD_PART = new RegExp(`([\\p{L}\\p{N}'${APOSTROPHE_CHARS}-]+)`, 'gu')

/**
 * Clitics a written word ends with, longest match first so `n't` wins over `'t`.
 * `lemma` is the dictionary form the lookup has to be sent with, because the
 * clitic on its own is not a word anybody can look up.
 */
const CLITICS = [
  { suffix: "n't", lemma: 'not' },
  { suffix: "'re", lemma: 'be' },
  { suffix: "'ve", lemma: 'have' },
  { suffix: "'ll", lemma: 'will' },
  { suffix: "'d", lemma: 'would' },
  { suffix: "'m", lemma: 'am' },
  { suffix: "'s", lemma: 'be' },
  { suffix: "'t", lemma: 'not' },
]

// `'s` is the copula after a pronoun ("it's") but a possessive after a noun
// ("driver's"), and only the copula has a dictionary form worth sending: the
// possessive one resolves to nothing, so it is left empty on purpose.
const COPULA_BASES = new Set([
  'it',
  'he',
  'she',
  'that',
  'this',
  'there',
  'here',
  'what',
  'who',
  'where',
  'when',
  'why',
  'how',
  'let',
])

// `n't` swallows the n of its auxiliary, so what is left is the verb on its own
// ("do", "does", "is") — which is exactly the piece worth hovering. Four of them
// are not spelled out that way and cutting them would draw two-letter fragments
// ("wo", "ca", "sha", "ai") nobody can look up, so they stay a single word.
const WHOLE_NEGATIVES = new Set(["won't", "can't", "shan't", "ain't"])

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
        .split(WORD_PART)
        .filter((token) => token !== '')
        .map((token) => ({ text: token, word: WORD_TOKEN.test(token) })),
    }))
}

function fold(char) {
  return char.replace(APOSTROPHES, "'").toLowerCase()
}

/**
 * The comparable form of a string plus, per kept character, where it sits in the
 * original. Punctuation is dropped because a word part never contains any: the
 * tokenizer peels it off, so the token `Mr.` has to line up with the `Mr` that
 * is actually rendered.
 */
function comparable(text) {
  let key = ''
  const offsets = []

  for (let i = 0; i < text.length; i++) {
    const char = fold(text[i])
    if (!WORD_CHAR.test(char)) continue
    key += char
    offsets.push(i)
  }

  return { key, offsets }
}

/**
 * Cuts a rendered word part along the morphological tokens the backend timed for
 * it, so `it's` renders as `it` + `'s` and either half can be hovered on its
 * own. Each piece carries the lemma of the token it came from, which is what the
 * dictionary lookup is sent with.
 *
 * The part and the tokens describe the same string but not always the same
 * segmentation: the punctuation has already been peeled off, so the punctuation
 * tokens are expected to run out. The walk stops at the first token that does
 * not line up, and the result is only trusted when the pieces cover the whole
 * part — otherwise the caller renders the word unsplit rather than cutting it in
 * the wrong place.
 *
 * Returns `[{ text, lemma }]`, or `null` when the part cannot be split.
 */
export function splitPartByTokens(text, tokens) {
  if (!Array.isArray(tokens) || !tokens.length) return null

  const { key, offsets } = comparable(String(text ?? ''))
  if (!key) return null

  const pieces = []
  let cursor = 0

  for (const token of tokens) {
    const needle = comparable(String(token?.text ?? '')).key
    if (!needle) continue
    if (key.slice(cursor, cursor + needle.length) !== needle) break

    // Cut out of the part as it is displayed, so the curly apostrophe the user
    // sees survives into the DOM instead of the straight one the backend timed.
    const from = offsets[cursor]
    const to = offsets[cursor + needle.length - 1] + 1
    pieces.push({ text: text.slice(from, to), lemma: String(token?.lemma ?? '') })
    cursor += needle.length
  }

  return pieces.length && cursor === key.length ? pieces : null
}

/** The clitic `folded` ends with, or `null` when it ends with none of them. */
function matchClitic(folded) {
  for (const clitic of CLITICS) {
    if (!folded.endsWith(clitic.suffix)) continue

    const base = folded.slice(0, -clitic.suffix.length)
    if (!base) return null

    const possessive = clitic.suffix === "'s" && !COPULA_BASES.has(base.toLowerCase())
    return { length: clitic.suffix.length, lemma: possessive ? '' : clitic.lemma }
  }

  return null
}

/**
 * Cuts a rendered word part along the clitics it ends with, so `it's` becomes
 * `it` + `'s`, `don't` becomes `do` + `n't` and `he'd've` becomes `he` + `'d` +
 * `'ve`. This is the fallback for the cues that arrive without a morphological
 * breakdown — the current backend times whole words and sends no tokens at all,
 * so without it every contraction is one dead hover target.
 *
 * Suffixes are matched on the folded text but the pieces are cut out of the part
 * as displayed, so the curly apostrophe the user sees survives into the DOM. A
 * part with no clitic, one that is only a clitic, and the handful that would be
 * cut into an unusable fragment are left whole.
 *
 * Returns `[{ text, lemma }]`, or `null` when there is nothing to cut.
 */
export function splitClitics(text) {
  const source = String(text ?? '')
  if (!APOSTROPHE.test(source)) return null

  const folded = source.replace(APOSTROPHES, "'")
  if (WHOLE_NEGATIVES.has(folded.toLowerCase())) return null

  const pieces = []
  let rest = source
  let tail = folded

  // Peeled from the right and prepended, because that is the order they have to
  // come back in. Each round shortens what is left, so the loop terminates.
  while (APOSTROPHE.test(tail)) {
    const hit = matchClitic(tail)
    if (!hit) break

    const cut = rest.length - hit.length
    pieces.unshift({ text: rest.slice(cut), lemma: hit.lemma })
    rest = rest.slice(0, cut)
    tail = tail.slice(0, -hit.length)
  }

  if (!pieces.length) return null

  // The base is its own dictionary form, apart from the `n` of `n't`, which the
  // clitic took with it — `don't` is drawn as `do` + `n't`, not `don` + `'t`.
  pieces.unshift({ text: rest, lemma: rest })

  return pieces.length > 1 ? pieces : null
}

/**
 * The pieces a word part is drawn as: the backend's own breakdown when it
 * describes more than one token, the clitic rules otherwise. A single-token
 * breakdown is ignored on purpose — it covers the word but does not cut it, so
 * falling back keeps `it's` from rendering as a bare `it`.
 */
export function splitWordPart(text, tokens) {
  const byTokens = splitPartByTokens(text, tokens)
  if (byTokens && byTokens.length > 1) return byTokens

  return splitClitics(text)
}
