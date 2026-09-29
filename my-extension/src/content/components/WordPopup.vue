<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { runtimeUrl } from '../../shared/browser.js'
import { AUDIO_ICON_URL } from '../../shared/constants.js'
import { popupControl } from '../store.js'
import { useWordPopup } from '../composables/useWordPopup.js'

const root = ref(null)

const {
  visible,
  loading,
  word,
  ipa,
  pos,
  meaning,
  audioUrl,
  canSave,
  hide,
  onSave,
  onAudioClick,
} = useWordPopup(root)

onMounted(() => {
  popupControl.hide = hide
})

onBeforeUnmount(() => {
  popupControl.hide = () => {}
})

const posClass = computed(() =>
  pos.value ? ['word-popup-pos', `pos-${pos.value.toLowerCase()}`] : ['word-popup-pos'],
)

const audioIcon = runtimeUrl(AUDIO_ICON_URL)
</script>

<template>
  <div id="word-popup" ref="root" v-show="visible" :class="{ loading }" @mousedown.prevent>
    <div class="popup-container">
      <div class="popup-content">
        <div class="word-popup-spinner" v-show="loading"></div>
        <div class="word-popup-word" v-show="!loading">{{ word }}</div>
        <div class="word-popup-ipa" v-show="!loading">{{ ipa }}</div>
        <div v-show="!loading && pos" :class="posClass">{{ pos }}</div>
        <div class="word-popup-meaning" v-show="!loading">{{ meaning }}</div>
      </div>

      <div class="container-word" v-show="!loading">
        <div class="container-word-audio">
          <div class="inside-word-audio">
            <button class="word-popup-audio" v-show="audioUrl" @click="onAudioClick">
              <img :src="audioIcon" alt="Play audio" />
            </button>
          </div>
        </div>
        <div class="container-word-save">
          <div class="inside-word-save">
            <button class="word-popup-btn" :disabled="!canSave" @click="onSave">Save</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
