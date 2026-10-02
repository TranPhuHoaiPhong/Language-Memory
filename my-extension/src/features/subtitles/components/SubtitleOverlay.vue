<script setup>
import { computed, ref } from 'vue'
import { useDrag } from '../composables/useDrag.js'
import { usePlayerObservers } from '../composables/usePlayerObservers.js'
import { boxShadowCss, effectiveWeight, lineStyle, textShadowCss, withAlpha } from '../state/settings.js'
import { subtitleStore } from '../state/state.js'
import SubtitleText from './SubtitleText.vue'

const root = ref(null)
const handle = ref(null)

const { isDragging, handleOpacity } = useDrag(root, handle)
const { baseFontSize } = usePlayerObservers(root)

// `computed` (not a plain object) so the refs are unwrapped before the style
// object reaches the DOM patcher.
const handleStyle = computed(() => ({
  opacity: handleOpacity.value,
  cursor: isDragging.value ? 'grabbing' : undefined,
}))

/**
 * Everything the settings sidebar can change is expressed as CSS custom properties
 * on the root, except the per-line ones, which are set on the line itself: each
 * row has its own font and size, so `.sub-original` / `.sub-translated` can share
 * a single rule that reads the variables of the element it is applied to.
 */
const rootStyle = computed(() => {
  const { font, gap, background: bg } = subtitleStore.settings

  return {
    fontSize: `${baseFontSize.value}px`,
    fontWeight: effectiveWeight(font),
    fontStyle: font.italic ? 'italic' : 'normal',
    lineHeight: font.lineHeight,
    letterSpacing: `${font.letterSpacing}em`,
    textAlign: font.align,
    width: `${font.width}%`,
    cursor: isDragging.value ? 'grabbing' : undefined,

    '--subtitle-gap': `${gap}em`,
    '--sub-background': bg.enabled ? withAlpha(bg.color, bg.opacity) : 'transparent',
    '--sub-radius': `${bg.radius}px`,
    '--sub-padding': `${bg.paddingY}px ${bg.paddingX}px`,
    '--sub-box-shadow': boxShadowCss(bg.boxShadow),
    '--sub-text-shadow': textShadowCss(bg.textShadow),
  }
})
</script>

<template>
  <div id="subtitle-translate" ref="root" :style="rootStyle">
    <div class="subtitle-drag-handle" ref="handle" :style="handleStyle">⠿</div>

    <div class="subtitle-content">
      <!-- Either row can be switched off in the sidebar, e.g. to read a video
           without the translation or without the source text. A hidden row is
           not rendered at all, so the gap and the box hug what is left. -->
      <template v-if="subtitleStore.message !== null">
        <div
          v-if="subtitleStore.settings.original.enabled"
          class="sub-original"
          :style="lineStyle(subtitleStore.settings.original)"
        >
          {{ subtitleStore.message }}
        </div>
        <div
          v-if="subtitleStore.settings.translated.enabled"
          class="sub-translated"
          :style="lineStyle(subtitleStore.settings.translated)"
        >
          {{ subtitleStore.message }}
        </div>
      </template>

      <template v-else-if="subtitleStore.currentSubtitle">
        <div
          v-if="subtitleStore.settings.original.enabled"
          class="sub-original"
          :style="lineStyle(subtitleStore.settings.original)"
        >
          <SubtitleText
            :text="subtitleStore.currentSubtitle.original"
            :words="subtitleStore.currentSubtitle.words"
          />
        </div>
        <div
          v-if="subtitleStore.currentSubtitle.translated && subtitleStore.settings.translated.enabled"
          class="sub-translated"
          :style="lineStyle(subtitleStore.settings.translated)"
        >
          <SubtitleText :text="subtitleStore.currentSubtitle.translated" />
        </div>
      </template>
    </div>
  </div>
</template>
