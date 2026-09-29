<script setup>
import { computed } from 'vue'
import { tokenizeBlock } from '../utils/tokenize.js'

const props = defineProps({
  text: { type: String, default: '' },
})

const lines = computed(() => tokenizeBlock(props.text))
</script>

<template>
  <div v-for="(line, index) in lines" :key="index" class="sub-line">
    <template v-for="(part, partIndex) in line.parts" :key="partIndex">
      <span v-if="part.word" class="sub-word">{{ part.text }}</span>
      <template v-else>{{ part.text }}</template>
    </template>
  </div>
</template>
