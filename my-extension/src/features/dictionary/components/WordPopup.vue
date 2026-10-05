<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { popupControl } from '../../../core/js/state.js'
import { useWordPopup } from '../composables/useWordPopup.js'

const root = ref(null)

const { visible, loading, word, meanings, hide } = useWordPopup(root)

onMounted(() => {
  popupControl.hide = hide
})

onBeforeUnmount(() => {
  popupControl.hide = () => {}
})
</script>

<template>
  <!-- Hovering is a reading gesture, so this carries the word and its senses and
       nothing else: no phonetics, no playback, no saving. Clicking the word opens
       the side panel, which is where the full entry lives. -->
  <div id="word-popup" ref="root" v-show="visible" :class="{ loading }" @mousedown.prevent>
    <!-- Looking up: the spinner alone, no content around it. -->
    <div class="word-popup-spinner" v-show="loading"></div>

    <div class="popup-content" v-show="!loading">
      <ul class="word-popup-meanings" v-show="meanings.length">
        <li v-for="(text, index) in meanings" :key="index" class="word-popup-meaning">
          {{ text }}
        </li>
      </ul>
    </div>
  </div>
</template>