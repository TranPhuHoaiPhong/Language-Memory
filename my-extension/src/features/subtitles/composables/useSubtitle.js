// src/features/subtitles/composables/useSubtitle.js
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { attachTo, getPlayerContainer, getVideo } from '../../../core/js/dom.js'
import { subtitleStore } from '../state/state.js'

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

  /** Auto size for the current player, the `1em` both per-line scales multiply. */
  const baseFontSize = computed(() =>
    Math.max(MIN_FONT_SIZE, Math.round(videoHeight.value * FONT_RATIO)),
  )

  /**
   * The largest size a *visible* line can reach. Only the bottom offset and the
   * repositioning watch need it: the rendered size comes from the settings,
   * multiplied into `1em` by the stylesheet. A hidden row must not count, or
   * switching it off would leave the overlay floating too high.
   */
  const fontSize = computed(() => {
    const { original, translated } = subtitleStore.settings
    const scales = [original, translated]
      .filter((line) => line.enabled)
      .map((line) => line.scale)

    return Math.max(10, Math.round(baseFontSize.value * (scales.length ? Math.max(...scales) : 1)))
  })

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

    if (subtitleStore.dragPosition) {
      const maxTop = Math.max(0, container.clientHeight - root.offsetHeight)
      const top = Math.max(0, Math.min(subtitleStore.dragPosition.topRatio * container.clientHeight, maxTop))
      root.style.top = `${top}px`
      root.style.bottom = 'auto'
    } else {
      root.style.bottom = `${fontSize.value}px`
      root.style.top = 'auto'
    }
  }

  function syncActiveCue(currentTime) {
    while (
      subtitleStore.currentIndex < subtitleStore.subtitles.length - 1 &&
      currentTime > subtitleStore.subtitles[subtitleStore.currentIndex].end
    ) {
      subtitleStore.currentIndex++
    }
    while (subtitleStore.currentIndex > 0 && currentTime < subtitleStore.subtitles[subtitleStore.currentIndex].start) {
      subtitleStore.currentIndex--
    }

    const cue = subtitleStore.subtitles[subtitleStore.currentIndex]
    const active = cue && currentTime >= cue.start && currentTime <= cue.end ? cue : null

    if (active !== subtitleStore.currentSubtitle) {
      subtitleStore.currentSubtitle = active
      subtitleStore.activeWordTime = -1
    }
  }

  /**
   * Walks the active cue's word list and publishes the start time of the last
   * word the clock has reached. Words after that point render dimmed, this one
   * and everything already spoken renders normally. Cues without per-word
   * timings leave the marker at -1, which dimms nothing.
   */
  function syncActiveWord(currentTime) {
    const words = subtitleStore.currentSubtitle?.words
    let start = -1

    if (words) {
      for (const word of words) {
        if (word.start > currentTime) break
        start = word.start
      }
    }

    if (start !== subtitleStore.activeWordTime) {
      subtitleStore.activeWordTime = start
    }
  }

  function loop() {
    attach()

    const video = subtitleStore.loading ? null : getVideo()
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

  return { updatePosition, baseFontSize }
}
