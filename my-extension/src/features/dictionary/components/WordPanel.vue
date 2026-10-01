<script setup>
import { computed } from 'vue'
import { runtimeUrl } from '../../../core/js/browser.js'
import { AUDIO_ICON_URL } from '../../../core/js/constants.js'
import { useWordPanel } from '../composables/useWordPanel.js'

const {
  open,
  loading,
  word,
  ipa,
  pos,
  meaning,
  audioUrl,
  canSave,
  close,
  onSave,
  onAudioClick,
} = useWordPanel()

const posClass = computed(() =>
  pos.value ? ['word-popup-pos', `pos-${pos.value.toLowerCase()}`] : ['word-popup-pos'],
)

const audioIcon = runtimeUrl(AUDIO_ICON_URL)
</script>

<template>
  <!-- `v-if` instead of `v-show`: a transition can only animate an element that
       is being inserted or removed, and `v-show` only flips `display`. -->
  <Transition name="word-panel">
    <aside
      id="lingo-word-panel"
      v-if="open"
      :class="{ loading }"
      @mousedown.stop
    >
      <header class="panel-head">
        <button class="panel-close" type="button" title="Close" @click="close">✕</button>
        <div class="panel-word panel-word--loading" v-show="loading">{{ word }}</div>
        <div class="panel-word" v-show="!loading">{{ word }}</div>
      </header>

      <div class="panel-body">
        <div class="word-popup-spinner" v-show="loading"></div>

        <template v-if="!loading">
          <div class="word-popup-ipa">{{ ipa }}</div>
          <div v-show="pos" :class="posClass">{{ pos }}</div>
          <div class="word-popup-meaning">{{ meaning }}</div>
        </template>
      </div>

      <footer class="panel-foot" v-show="!loading">
        <div class="container-word">
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
      </footer>
    </aside>
  </Transition>
</template>
