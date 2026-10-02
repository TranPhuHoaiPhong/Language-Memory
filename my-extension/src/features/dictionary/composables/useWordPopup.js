// src/features/dictionary/composables/useWordPopup.js
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { attachTo, getPlayerContainer, getPlayerRoot, getVideo } from '../../../core/js/dom.js'
import { store } from '../../../core/js/state.js'
import { subtitleStore } from '../../subtitles/state/state.js'
import { playAudio, stopAudio } from '../logic/audio.js'
import { wordPopupHost } from '../logic/hosts.js'
import { wordPanelControl } from '../logic/panelControl.js'
import { expandRangeToWords } from '../logic/range.js'
import { fetchWordInfo, saveWord } from '../logic/word.js'

const EDITABLE = 'input, textarea, [contenteditable="true"]'
const POPUP_GAP = 5
/** Distance (px) below which a mouse gesture still counts as a plain click. */
const CLICK_MOVE_THRESHOLD = 4
const AUTOPLAY_DELAY = 300
/** Resting on a word long enough before the lookup is worth a request. */
const HOVER_DELAY = 250
/** Grace period so the pointer can travel from the word to the popup. */
const HOVER_HIDE_DELAY = 220

function closest(node, selector) {
  if (!node) return null
  const el = node.nodeType === Node.TEXT_NODE ? node.parentElement : node
  return el?.closest ? el.closest(selector) : null
}

/**
 * The hovered (or clicked) word plus the lemma of the token it renders as.
 *
 * A word can be several spans — `it's` is drawn as `it` + `'s`, each with its
 * own lemma — so the payload has to be read off the exact element under the
 * pointer instead of off the surrounding word.
 */
function readTarget(el) {
  const text = el?.textContent.trim() || ''
  if (!text) return null

  return { text, lemma: el.dataset.lemma || '' }
}

/**
 * Everything behind the word popup: selection handling, dictionary lookups,
 * playback and saving. The lookup uses the learning language as the source
 * language and returns the definition in the user's native language.
 */
export function useWordPopup(rootRef) {
  const visible = ref(false)
  const loading = ref(false)
  const word = ref('')
  const ipa = ref('')
  const pos = ref('')
  const meaning = ref('')
  const audioUrl = ref('')

  /** Payload of the last successful lookup; `null` while loading or on error. */
  const savePayload = ref(null)

  /** Bumped on every hide/lookup so stale responses are discarded. */
  let requestId = 0
  let selectedRect = null
  let mouseDownX = 0
  let mouseDownY = 0
  let resizeObserver = null

  let hoverTimer = null
  let hoverHideTimer = null
  let hoveredWord = null
  let pointerOnPopup = false
  /** Set only when the hover itself stopped the video, so a deliberate pause
      (a click, a selection) is never undone by the pointer leaving. */
  let pausedByHover = false

  function attachToPlayer() {
    const container = document.fullscreenElement || getPlayerContainer() || getPlayerRoot()
    if (!container) return null

    if (getComputedStyle(container).position === 'static') {
      container.style.position = 'relative'
    }
    attachTo(container, wordPopupHost)
    return container
  }

  async function positionPopup() {
    const root = rootRef.value
    const container = attachToPlayer()
    if (!root || !container || !selectedRect) return

    const containerRect = container.getBoundingClientRect()

    // Measure off-screen first so the popup never flashes at the wrong spot.
    root.style.visibility = 'hidden'
    visible.value = true
    await nextTick()

    const anchorX = selectedRect.left + selectedRect.width / 2
    // `maxLeft` can go negative on very narrow players; the left edge wins.
    const left = Math.max(0, Math.min(anchorX - containerRect.left - root.offsetWidth / 2, containerRect.width - root.offsetWidth))

    root.style.left = `${left}px`
    root.style.top = `${selectedRect.top - containerRect.top - root.offsetHeight - POPUP_GAP}px`
    root.style.visibility = 'visible'
  }

  function hide() {
    requestId++
    stopAudio()
    visible.value = false
    clearHover()
  }

  // ===== Hover lifecycle =====

  function clearHover() {
    clearTimeout(hoverTimer)
    clearTimeout(hoverHideTimer)
    hoverTimer = null
    hoverHideTimer = null
    hoveredWord = null
  }

  function pauseForHover() {
    const video = getVideo()
    if (video && !video.paused) {
      video.pause()
      pausedByHover = true
    }
  }

  function resumeAfterHover() {
    if (!pausedByHover) return
    pausedByHover = false

    const video = getVideo()
    if (video && video.paused) video.play().catch(() => {})
  }

  function scheduleHoverHide() {
    clearTimeout(hoverHideTimer)
    hoverHideTimer = setTimeout(() => {
      if (pointerOnPopup) return
      hide()
      resumeAfterHover()
    }, HOVER_HIDE_DELAY)
  }

  /**
   * Resting on a word is the cheap way to read it: the video stops and the
   * popup looks the word up. The delay keeps a mouse sweep across a line from
   * firing a request per word, and the same word is never looked up twice.
   */
  function onMouseOver(e) {
    if (closest(e.target, '#word-popup')) {
      pointerOnPopup = true
      clearTimeout(hoverHideTimer)
      return
    }
    pointerOnPopup = false

    const el = closest(e.target, '.sub-original .sub-word')
    if (!el) {
      if (hoveredWord) scheduleHoverHide()
      return
    }

    const target = readTarget(el)
    if (!target) return

    // Travelling towards the popup must not tear the lookup down.
    clearTimeout(hoverHideTimer)
    if (hoveredWord === target.text) return

    hoveredWord = target.text
    clearTimeout(hoverTimer)
    hoverTimer = setTimeout(() => {
      if (hoveredWord !== target.text) return
      pauseForHover()
      selectedRect = el.getBoundingClientRect()
      lookup(target.text, target.lemma)
    }, HOVER_DELAY)
  }

  function onMouseOut(e) {
    if (closest(e.target, '#word-popup')) {
      pointerOnPopup = false
      if (hoveredWord) scheduleHoverHide()
      return
    }

    if (!closest(e.target, '.sub-original .sub-word')) return
    if (closest(e.relatedTarget, '#word-popup')) return

    scheduleHoverHide()
  }

  function clearSelection() {
    window.getSelection()?.removeAllRanges()
  }

  async function lookup(selectedWord, lemma = '') {
    const subtitle = subtitleStore.currentSubtitle
    const language = store.nativeLanguage
    const sourceLanguage = store.targetLanguage
    const currentRequestId = ++requestId

    word.value = ''
    ipa.value = ''
    pos.value = ''
    meaning.value = ''
    audioUrl.value = ''
    savePayload.value = null
    loading.value = true

    await positionPopup()

    try {
      const data = await fetchWordInfo(selectedWord, language, subtitle, sourceLanguage, lemma)
      if (currentRequestId !== requestId) return

      const info = data.data || {}
      word.value = info.word || selectedWord
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
      ipa.value = ''
      pos.value = ''
      meaning.value = ''
      audioUrl.value = ''
    } finally {
      if (currentRequestId === requestId) {
        loading.value = false
        await positionPopup()
      }
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

  // ===== Selection lifecycle =====

  /** Clears a selection when the user starts a drag inside our own subtitles. */
  function onMouseDownClearOverlap(e) {
    if (closest(e.target, EDITABLE) || closest(e.target, '#word-popup')) return
    if (!closest(e.target, '.sub-original')) return

    const selection = window.getSelection()
    if (!selection?.rangeCount || selection.isCollapsed) return

    const rects = selection.getRangeAt(0).getClientRects()
    for (const rect of rects) {
      const inside =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom
      if (inside) {
        selection.removeAllRanges()
        return
      }
    }
  }

  function onMouseDownTrack(e) {
    mouseDownX = e.clientX
    mouseDownY = e.clientY
  }

  async function onMouseUp(e) {
    if (closest(e.target, EDITABLE) || closest(e.target, '#word-popup')) return

    const video = getVideo()
    const onSubtitle = closest(e.target, '.sub-original')

    if (video && !video.paused) {
      if (!onSubtitle) {
        hide()
        clearSelection()
        return
      }
      video.pause()
    }

    const dx = e.clientX - mouseDownX
    const dy = e.clientY - mouseDownY
    const isPlainClick = Math.sqrt(dx * dx + dy * dy) < CLICK_MOVE_THRESHOLD

    const selection = window.getSelection()
    let range = null

    if (isPlainClick) {
      // Only treat it as a word click when the target really is a `.sub-word`.
      // Snapping to the nearest text node instead would make clicks on
      // punctuation and spaces resolve to the wrong "word".
      const clicked = closest(e.target, '.sub-word')
      if (!clicked) {
        hide()
        clearSelection()
        return
      }

      const target = readTarget(clicked)
      if (!target) {
        hide()
        return
      }

      // A click is a deliberate "keep this one": the floating popup belongs to
      // hovering and to drag-selection, a clicked word goes to the side panel.
      // The pause it inherits is the user's now, so the pointer walking away
      // must not resume the video under the panel.
      pausedByHover = false
      hide()
      clearSelection()
      wordPanelControl.open(target.text, target.lemma)
      return
    }

    // A drag is a phrase, not a word: the popup shows the whole selection.
    if (!selection?.rangeCount || !selection.toString().trim()) {
      hide()
      return
    }
    range = selection.getRangeAt(0)

    if (!closest(range.startContainer, '.sub-original')) {
      hide()
      return
    }

    const expanded = expandRangeToWords(range)
    if (!expanded) {
      hide()
      clearSelection()
      return
    }
    selection.removeAllRanges()
    selection.addRange(expanded)
    range = expanded

    const text = selection.toString().trim()
    if (!text) {
      hide()
      return
    }

    selectedRect = range.getBoundingClientRect()
    await lookup(text)
  }

  function onSelectionChange() {
    const selection = window.getSelection()
    if (!selection) return

    const anchor = closest(selection.anchorNode, `${EDITABLE}, #word-popup`)
    if (anchor) return

    if (!selection.toString().trim()) {
      hide()
      return
    }
    if (!closest(selection.anchorNode, '.sub-original')) return

    const video = getVideo()
    if (video && !video.paused) video.pause()
  }

  function onMouseDownOutside(e) {
    if (closest(e.target, EDITABLE)) return
    if (closest(e.target, '#word-popup') || closest(e.target, '.sub-original')) return

    hide()
    clearSelection()
  }

  function onTripleClick(e) {
    if (e.detail < 3 || !closest(e.target, '.sub-original')) return

    e.preventDefault()
    hide()
    setTimeout(clearSelection, 0)
  }

  function onKeyDown(e) {
    if (e.key !== 'Enter') return
    hide()
    clearSelection()
  }

  function onFullscreenChange() {
    if (!visible.value) return
    positionPopup()
  }

  onMounted(() => {
    document.addEventListener('mousedown', onMouseDownClearOverlap, true)
    document.addEventListener('mousedown', onMouseDownTrack)
    document.addEventListener('mouseup', onMouseUp)
    document.addEventListener('mouseover', onMouseOver)
    document.addEventListener('mouseout', onMouseOut)
    document.addEventListener('selectionchange', onSelectionChange)
    document.addEventListener('mousedown', onMouseDownOutside)
    document.addEventListener('mousedown', onTripleClick, true)
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('fullscreenchange', onFullscreenChange)

    const player = getPlayerRoot()
    if (player) {
      resizeObserver = new ResizeObserver(() => {
        if (visible.value) positionPopup()
      })
      resizeObserver.observe(player)
    }
  })

  onBeforeUnmount(() => {
    document.removeEventListener('mousedown', onMouseDownClearOverlap, true)
    document.removeEventListener('mousedown', onMouseDownTrack)
    document.removeEventListener('mouseup', onMouseUp)
    document.removeEventListener('mouseover', onMouseOver)
    document.removeEventListener('mouseout', onMouseOut)
    document.removeEventListener('selectionchange', onSelectionChange)
    document.removeEventListener('mousedown', onMouseDownOutside)
    document.removeEventListener('mousedown', onTripleClick, true)
    document.removeEventListener('keydown', onKeyDown)
    document.removeEventListener('fullscreenchange', onFullscreenChange)
    resizeObserver?.disconnect()
    clearHover()
    stopAudio()
  })

  return {
    visible,
    loading,
    word,
    ipa,
    pos,
    meaning,
    audioUrl,
    canSave: computed(() => savePayload.value !== null),
    hide,
    onSave,
    onAudioClick,
  }
}
