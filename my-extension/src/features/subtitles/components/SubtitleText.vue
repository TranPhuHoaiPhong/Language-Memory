<script setup>
import { computed } from 'vue'
import { tokenizeBlock } from '../logic/tokenize.js'
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
    parts: line.parts.map((part) => {
      const timing = timings ? timings[cursor] : null
      cursor += 1
      return { ...part, timing }
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
</script>

<template>
  <div v-for="(line, index) in lines" :key="index" class="sub-line">
    <span v-for="(part, partIndex) in line.parts" :key="partIndex" :class="partClass(part)">{{
      part.text
    }}</span>
  </div>
</template>
