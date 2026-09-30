// src/content/composables/usePlayerObservers.js
import { onBeforeUnmount, onMounted } from 'vue'
import { getPlayerContainer, getPlayerRoot, getVideo } from '../utils/dom.js'
import { popupControl } from '../store.js'
import { useSubtitle } from './useSubtitle.js'
import { loadTranscript } from './useTranscript.js'

/**
 * Wires the overlay to the YouTube player: keeps it sized with the video,
 * dismisses the word popup when playback resumes, and reloads the transcript
 * after SPA navigation.
 */
export function usePlayerObservers(rootRef) {
  const { updatePosition, fontSize } = useSubtitle(rootRef)

  let observer = null
  const cleanups = []

  function handlePlay() {
    popupControl.hide()
    window.getSelection()?.removeAllRanges()
  }

  onMounted(() => {
    observer = new ResizeObserver(() => updatePosition())

    const video = getVideo()
    if (video) {
      observer.observe(video)
      video.addEventListener('play', handlePlay)
      cleanups.push(() => {
        observer.unobserve(video)
        video.removeEventListener('play', handlePlay)
      })
    }

    const player = getPlayerContainer()
    if (player) observer.observe(player)

    // YouTube is a single-page app: re-fetch on in-app navigation.
    document.addEventListener('yt-navigate-finish', loadTranscript)
    cleanups.push(() => document.removeEventListener('yt-navigate-finish', loadTranscript))
  })

  onBeforeUnmount(() => {
    observer?.disconnect()
    cleanups.forEach((fn) => fn())
  })

  return { fontSize }
}
