// src/features/dictionary/composables/useWordPanel.js
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { claimSlot, releaseSlot, sidebar } from '../../../core/js/sidebar.js'
import { store } from '../../../core/js/state.js'
import { subtitleStore } from '../../subtitles/state/state.js'
import { isSpeechSupported, playAudio, speak, stopAudio } from '../logic/audio.js'
import { wordPanelControl } from '../logic/panelControl.js'
import { fetchWordDetail, readEntry, readMeanings, saveWord } from '../logic/word.js'

/** The panel's name in the sidebar slot; see `claimSlot`. */
const SLOT_ID = 'word'

/**
 * The clicked-word panel: the same lookup the popup does, but kept in the fixed
 * right-hand dock so it survives the pointer leaving the subtitle and the video
 * being scrubbed.
 */
export function useWordPanel() {
  const open = ref(false)
  const loading = ref(false)
  const word = ref('')
  const ipa = ref('')
  const pos = ref('')

  /** Flat list of explanation strings; kept for backward-compatible saving. */
  const meanings = ref([])

  /** Full structured entries, one per part-of-speech meaning. */
  const meaningEntries = ref([])

  /** Extra sections from the payload. */
  const inflections = ref([])
  const synonyms = ref([])
  const relatedWords = ref([])
  const phrases = ref([])

  /** Every pronunciation of the entry, US and GB included. */
  const phonetics = ref([])

  /** Cách phát âm theo từng giọng: Mỹ và Anh đọc cùng một từ khác nhau. */
  const ipaUs = computed(
    () => phonetics.value.find((p) => /(^|[-_])us$/i.test(p.dialect))?.ipa || '',
  )
  const ipaGb = computed(
    () => phonetics.value.find((p) => /(^|[-_])(gb|uk)$/i.test(p.dialect))?.ipa || '',
  )

  /** Pronunciation URL of the current entry; empty when the API has none. */
  const audioUrl = ref('')

  /**
   * The API ships no pronunciation file, so the entry is spoken by the browser.
   * The button is shown whenever there is something to pronounce.
   */
  const canPlayAudio = computed(
    () => Boolean(audioUrl.value || (word.value && isSpeechSupported())),
  )

  /** Payload of the last successful lookup; `null` while loading or on error. */
  const savePayload = ref(null)

  /**
   * One dock, one panel: opening a word evicts the settings. `visible` also
   * covers the pages without a sidebar, where there is nothing to look up.
   */
  const visible = computed(() => open.value && sidebar.value !== null)

  /** Bumped on every open so a slow response for a previous word is dropped. */
  let requestId = 0

  /** Closing the panel dismisses the dock slot it holds. */
  function close() {
    requestId++
    stopAudio()
    open.value = false
    releaseSlot(SLOT_ID)
  }

  /** Reset every field so a previous word never leaks into the next lookup. */
  function reset() {
    word.value = ''
    ipa.value = ''
    pos.value = ''
    meanings.value = []
    meaningEntries.value = []
    inflections.value = []
    synonyms.value = []
    relatedWords.value = []
    phrases.value = []
    phonetics.value = []
    audioUrl.value = ''
    savePayload.value = null
  }

  async function show(text, lemma = '') {
    if (!sidebar.value) return

    const subtitle = subtitleStore.currentSubtitle
    const language = store.nativeLanguage
    const sourceLanguage = store.targetLanguage
    const currentRequestId = ++requestId

    reset()
    word.value = text
    loading.value = true
    open.value = true
    claimSlot(SLOT_ID, close)

    try {
      const data = await fetchWordDetail(lemma || text, language)
      if (currentRequestId !== requestId) return

      const info = readEntry(data)
      word.value = info.word || text
      ipa.value = info.ipa ? `/${info.ipa}/` : ''
      phonetics.value = info.phonetics || []
      pos.value = info.pos || ''
      meanings.value = readMeanings(info)
      meaningEntries.value = info.meanings || []
      inflections.value = info.inflections || []
      synonyms.value = info.synonyms || []
      relatedWords.value = info.relatedWords || []
      phrases.value = info.phrases || []
      audioUrl.value = info.audio || ''

      savePayload.value = {
        word: word.value,
        ipa: info.ipa || '',
        pos: pos.value,
        meaning: meanings.value.join('; '),
        subtitle,
        language,
        sourceLanguage,
        // Preserve the full entry so nothing is lost server-side.
        detail: data,
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

  /**
   * Plays the current entry's pronunciation: the API's audio file when there is
   * one, the browser's own voice otherwise.
   */
  function onAudioClick() {
    if (audioUrl.value) {
      playAudio(audioUrl.value)
      return
    }
    speak(word.value, store.targetLanguage)
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
    meaningEntries,
    inflections,
    synonyms,
    relatedWords,
    phrases,
    phonetics,
    ipaUs,
    ipaGb,
    audioUrl,
    canPlayAudio,
    canSave: computed(() => savePayload.value !== null),
    close,
    onSave,
    onAudioClick,
  }
}