// src/content/composables/useSubtitle.js
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { store } from '../store.js'
import { attachTo, getPlayerContainer, getVideo } from '../utils/dom.js'

const MIN_FONT_SIZE = 18
const FONT_RATIO = 0.04

/**
 * Drives the subtitle overlay: keeps it attached to the player, positions it
 * and advances the active cue from the video clock.
 *
 * Positioning writes to the element directly instead of going through Vue
 * refs: it runs on every animation frame and only a handful of properties
 * change, so diffing would be pure overhead. Appearance (size, colour, gap) is
 * left to the render function because it only changes on user input.
 */
export function useSubtitle(rootRef) {
  let frame = 0
  const videoHeight = ref(0)

  /** Auto size for the current player size, before the user's scale factor. */
  const baseFontSize = computed(() =>
    Math.max(MIN_FONT_SIZE, Math.round(videoHeight.value * FONT_RATIO)),
  )

  const fontSize = computed(() =>
    Math.max(10, Math.round(baseFontSize.value * store.settings.font.scale)),
  )

  function attach() {
    return attachTo(getPlayerContainer(), rootRef.value)
  }

  function updatePosition() {
    const root = rootRef.value
    const video = getVideo()
    const container = getPlayerContainer()
    if (!root || !video || !container) return

    if (video.clientHeight !== videoHeight.value) {
      videoHeight.value = video.clientHeight
    }

    root.style.left = '50%'
    root.style.transform = 'translateX(-50%)'

    if (store.dragPosition) {
      const maxTop = Math.max(0, container.clientHeight - root.offsetHeight)
      const top = Math.max(0, Math.min(store.dragPosition.topRatio * container.clientHeight, maxTop))
      root.style.top = `${top}px`
      root.style.bottom = 'auto'
    } else {
      root.style.bottom = `${fontSize.value}px`
      root.style.top = 'auto'
    }
  }

  function syncActiveCue(currentTime) {
    while (
      store.currentIndex < store.subtitles.length - 1 &&
      currentTime > store.subtitles[store.currentIndex].end
    ) {
      store.currentIndex++
    }
    while (store.currentIndex > 0 && currentTime < store.subtitles[store.currentIndex].start) {
      store.currentIndex--
    }

    const cue = store.subtitles[store.currentIndex]
    const active = cue && currentTime >= cue.start && currentTime <= cue.end ? cue : null

    if (active !== store.currentSubtitle) {
      store.currentSubtitle = active
      store.activeWordTime = -1
    }
  }

  /**
   * Walks the active cue's word list and publishes the start time of the last
   * word the clock has reached. Words after that point render dimmed, this one
   * and everything already spoken renders normally. Cues without per-word
   * timings leave the marker at -1, which dimms nothing.
   */
  function syncActiveWord(currentTime) {
    const words = store.currentSubtitle?.words
    let start = -1

    if (words) {
      for (const word of words) {
        if (word.start > currentTime) break
        start = word.start
      }
    }

    if (start !== store.activeWordTime) {
      store.activeWordTime = start
    }
  }

  function loop() {
    attach()

    const video = store.loading ? null : getVideo()
    if (video) {
      updatePosition()
      syncActiveCue(video.currentTime)
      syncActiveWord(video.currentTime)
    }

    frame = requestAnimationFrame(loop)
  }

  onMounted(() => {
    loop()
    // A scale change alters the rendered height, so the clamped top has to be
    // recomputed right away instead of on the next resize.
    watch(fontSize, updatePosition)
  })

  onBeforeUnmount(() => {
    cancelAnimationFrame(frame)
  })

  return { updatePosition, fontSize }
}
