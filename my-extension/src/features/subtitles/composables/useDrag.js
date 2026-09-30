// src/features/subtitles/composables/useDrag.js
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { getPlayerContainer } from '../../../core/js/dom.js'
import { saveDragPosition, subtitleStore } from '../state/state.js'

/**
 * Makes the overlay's handle draggable. The vertical position is stored as a
 * ratio of the player height so it survives resizing and window changes.
 */
export function useDrag(rootRef, handleRef) {
  const isDragging = ref(false)
  const handleOpacity = ref(0)

  let offsetY = 0

  function onHandleEnter() {
    if (isDragging.value) return
    handleOpacity.value = 1
  }

  function onHandleLeave() {
    if (!isDragging.value) handleOpacity.value = 0
  }

  function onRootEnter() {
    if (isDragging.value) return
    handleOpacity.value = 0.5
  }

  function onRootLeave() {
    if (!isDragging.value) handleOpacity.value = 0
  }

  function onMouseDown(e) {
    e.preventDefault()
    e.stopPropagation()

    const container = getPlayerContainer()
    const root = rootRef.value
    if (!container || !root) return

    offsetY = e.clientY - root.getBoundingClientRect().top
    isDragging.value = true
  }

  function onMouseMove(e) {
    if (!isDragging.value) return

    const root = rootRef.value
    const container = getPlayerContainer()
    if (!root || !container) return

    const containerRect = container.getBoundingClientRect()
    const maxTop = Math.max(0, containerRect.height - root.offsetHeight)
    const top = Math.max(0, Math.min(e.clientY - containerRect.top - offsetY, maxTop))

    subtitleStore.dragPosition = { topRatio: containerRect.height ? top / containerRect.height : 0 }

    root.style.top = `${top}px`
    root.style.bottom = 'auto'
  }

  function onMouseUp(e) {
    if (!isDragging.value) return

    // Swallow the event so YouTube does not treat the drag end as a click.
    e.stopPropagation()
    e.preventDefault()

    isDragging.value = false

    if (subtitleStore.dragPosition) {
      saveDragPosition(subtitleStore.dragPosition)
    }

    const root = rootRef.value
    const handle = handleRef.value
    if (root && handle && !root.matches(':hover') && !handle.matches(':hover')) {
      handleOpacity.value = 0
    }
  }

  onMounted(() => {
    handleRef.value?.addEventListener('mousedown', onMouseDown)
    handleRef.value?.addEventListener('mouseenter', onHandleEnter)
    handleRef.value?.addEventListener('mouseleave', onHandleLeave)
    rootRef.value?.addEventListener('mouseenter', onRootEnter)
    rootRef.value?.addEventListener('mouseleave', onRootLeave)

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp, true)
  })

  onBeforeUnmount(() => {
    handleRef.value?.removeEventListener('mousedown', onMouseDown)
    handleRef.value?.removeEventListener('mouseenter', onHandleEnter)
    handleRef.value?.removeEventListener('mouseleave', onHandleLeave)
    rootRef.value?.removeEventListener('mouseenter', onRootEnter)
    rootRef.value?.removeEventListener('mouseleave', onRootLeave)

    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp, true)
  })

  return { isDragging, handleOpacity }
}
