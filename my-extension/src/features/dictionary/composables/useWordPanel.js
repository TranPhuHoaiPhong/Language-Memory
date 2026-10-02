// src/features/dictionary/composables/useWordPanel.js
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { store } from '../../../core/js/state.js'
import { subtitleStore } from '../../subtitles/state/state.js'
import { playAudio, stopAudio } from '../logic/audio.js'
import { wordPanelControl } from '../logic/panelControl.js'
import { fetchWordInfo, saveWord } from '../logic/word.js'

const AUTOPLAY_DELAY = 300

/**
 * The clicked-word panel: the same lookup the popup does, but pinned to the right
 * edge of the page so it survives the pointer leaving the subtitle and the video
 * being scrubbed.
 */
export function useWordPanel() {
  const open = ref(false)
  const loading = ref(false)
  const word = ref('')
  const ipa = ref('')
  const pos = ref('')
  const meaning = ref('')
  const audioUrl = ref('')

  /** Payload of the last successful lookup; `null` while loading or on error. */
  const savePayload = ref(null)

  /** Bumped on every open so a slow response for a previous word is dropped. */
  let requestId = 0

  function close() {
    requestId++
    stopAudio()
    open.value = false
  }

  async function show(text, lemma = '') {
    const subtitle = subtitleStore.currentSubtitle
    const language = store.nativeLanguage
    const sourceLanguage = store.targetLanguage
    const currentRequestId = ++requestId

    word.value = text
    ipa.value = ''
    pos.value = ''
    meaning.value = ''
    audioUrl.value = ''
    savePayload.value = null
    loading.value = true
    open.value = true

    try {
      const data = await fetchWordInfo(text, language, subtitle, sourceLanguage, lemma)
      if (currentRequestId !== requestId) return

      const info = data.data || {}
      word.value = info.word || text
      ipa.value = info.ipa ? `/${info.ipa}/` : ''
      pos.value = info.pos || ''
      meaning.value = info.meaning || ''
      audioUrl.value = info.audio || ''

      savePayload.value = {
        word: word.value,
        ipa: info.ipa || '',
        pos: pos.value,
        meaning: meaning.value,
        subtitle,
        language,
        sourceLanguage,
        audio: audioUrl.value,
      }

      if (audioUrl.value) {
        setTimeout(() => {
          if (currentRequestId === requestId) playAudio(audioUrl.value)
        }, AUTOPLAY_DELAY)
      }
    } catch {
      if (currentRequestId !== requestId) return
      word.value = 'Failed'
    } finally {
      if (currentRequestId === requestId) loading.value = false
    }
  }

  async function onSave() {
    if (!savePayload.value) return
    try {
      await saveWord(savePayload.value)
      alert('Saved successfully!')
    } catch (err) {
      console.error(err)
      alert('Save failed')
    }
  }

  function onAudioClick() {
    playAudio(audioUrl.value)
  }

  function onKeyDown(e) {
    if (e.key !== 'Escape') return
    close()
  }

  onMounted(() => {
    wordPanelControl.open = show
    wordPanelControl.close = close
    document.addEventListener('keydown', onKeyDown)
  })

  onBeforeUnmount(() => {
    wordPanelControl.open = () => {}
    wordPanelControl.close = () => {}
    document.removeEventListener('keydown', onKeyDown)
    stopAudio()
  })

  return {
    open,
    loading,
    word,
    ipa,
    pos,
    meaning,
    audioUrl,
    canSave: computed(() => savePayload.value !== null),
    close,
    onSave,
    onAudioClick,
  }
}
