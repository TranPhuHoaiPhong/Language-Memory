<script setup>
import { computed } from 'vue'
import { splitWordPart, tokenizeBlock } from '../logic/tokenize.js'
import { alignWordTimings } from '../logic/wordTiming.js'
import { subtitleStore } from '../state/state.js'

const props = defineProps({
  text: { type: String, default: '' },
  /** Per-word timings of the owning cue; `null` for lines without them. */
  words: { type: Array, default: null },
})

const lines = computed(() => {
  const parsed = tokenizeBlock(props.text)

  // The cursor spans every line: `words` is a property of the cue, so a cue
  // wrapped over two lines must not restart the alignment halfway through.
  const timings = alignWordTimings(
    parsed.flatMap((line) => line.parts),
    props.words,
  )

  let cursor = 0
  return parsed.map((line) => ({
    parts: line.parts.flatMap((part) => {
      const timing = timings ? timings[cursor] : null
      // The part's own position, which is what groups the pieces of one word
      // together: the backend ids the *word*, but a cue can arrive without any
      // word timings at all, and the split does not depend on them.
      const group = String(cursor)
      cursor += 1

      if (!part.word) return [{ ...part, timing }]

      // One word can be several pieces ("it's" -> "it" + "'s"): each gets its own
      // span and its own lemma. They share the group's id, so a selection over
      // one of them still snaps to the whole word, and they share the timing when
      // there is one, because the backend timed the word and not its pieces.
      const pieces = splitWordPart(part.text, timing?.tokens)
      if (!pieces) return [{ ...part, timing }]

      return pieces.map((piece) => ({
        text: piece.text,
        word: true,
        lemma: piece.lemma,
        wordId: group,
        timing,
      }))
    }),
  }))
})

/** True while the video clock has not reached this word yet. */
function isPending(part) {
  return !!part.timing && part.timing.start > subtitleStore.activeWordTime
}

/**
 * Every part is a span, not just the words: the dimming has to cross the
 * punctuation too, or a sentence reads as half-faded. Only the word parts carry
 * `.sub-word`, which is the class the selection snapping and the click
 * handling latch onto.
 */
function partClass(part) {
  return [part.word ? 'sub-word' : 'sub-plain', { 'sub-word--pending': isPending(part) }]
}

/**
 * The lemma and the group id travel on the element instead of through a Vue
 * event: hovering and clicking are both delegated from the document, so whatever
 * is under the pointer has to carry its own lookup payload. The group id is only
 * set on the pieces of a split word, which is exactly what the selection snapping
 * needs to grow a range back to the whole word.
 */
function partAttrs(part) {
  if (!part.word) return null

  return {
    'data-lemma': part.lemma || undefined,
    'data-word-id': part.wordId,
  }
}
</script>

<template>
  <div v-for="(line, index) in lines" :key="index" class="sub-line">
    <span
      v-for="(part, partIndex) in line.parts"
      :key="partIndex"
      :class="partClass(part)"
      v-bind="partAttrs(part)"
      >{{ part.text }}</span
    >
  </div>
</template>
