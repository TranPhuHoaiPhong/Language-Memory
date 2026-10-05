// src/features/dictionary/composables/useWordPanel.js
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { claimSlot, releaseSlot, sidebar } from '../../../core/js/sidebar.js'
import { store } from '../../../core/js/state.js'
import { subtitleStore } from '../../subtitles/state/state.js'
import { playAudio, stopAudio } from '../logic/audio.js'
import { wordPanelControl } from '../logic/panelControl.js'
import { fetchWordInfo, readEntry, readMeanings, saveWord } from '../logic/word.js'

const AUTOPLAY_DELAY = 10

/** The panel's name in the sidebar slot; see `claimSlot`. */
const SLOT_ID = 'word'

/**
 * The clicked-word panel: the same lookup the popup does, but kept in the watch
 * page's sidebar column so it survives the pointer leaving the subtitle and the
 * video being scrubbed.
 */
export function useWordPanel() {
  const open = ref(false)
  const loading = ref(false)
  const word = ref('')
  const ipa = ref('')
  const pos = ref('')
  const meanings = ref([])
  const audioUrl = ref('')

  /** Payload of the last successful lookup; `null` while loading or on error. */
  const savePayload = ref(null)

  /**
   * One column, one panel: opening a word evicts the settings. `visible` also
   * covers the pages without a sidebar, and the navigations where YouTube drops
   * the column the panel was opened in.
   */
  const visible = computed(() => open.value && sidebar.value !== null)

  /** Bumped on every open so a slow response for a previous word is dropped. */
  let requestId = 0

  /** Closing the panel collapses the sidebar column it occupies. */
  function close() {
    requestId++
    stopAudio()
    open.value = false
    releaseSlot(SLOT_ID)
  }

  async function show(text, lemma = '') {
    if (!sidebar.value) return

    const subtitle = subtitleStore.currentSubtitle
    const language = store.nativeLanguage
    const sourceLanguage = store.targetLanguage
    const currentRequestId = ++requestId

    word.value = text
    ipa.value = ''
    pos.value = ''
    meanings.value = []
    audioUrl.value = ''
    savePayload.value = null
    loading.value = true
    open.value = true
    claimSlot(SLOT_ID, close)

    try {
      const data = await fetchWordInfo(lemma || text, language)
      if (currentRequestId !== requestId) return

      const info = readEntry(data)
      word.value = info.word || text
      ipa.value = info.ipa ? `/${info.ipa}/` : ''
      pos.value = info.pos || ''
      meanings.value = readMeanings(info)
      audioUrl.value = info.audio || ''

      savePayload.value = {
        word: word.value,
        ipa: info.ipa || '',
        pos: pos.value,
        meaning: meanings.value.join('; '),
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
    visible,
    loading,
    word,
    ipa,
    pos,
    meanings,
    audioUrl,
    canSave: computed(() => savePayload.value !== null),
    close,
    onSave,
    onAudioClick,
  }
}
