<script setup>
import { computed, ref } from 'vue'
import { store } from '../store.js'
import { useDrag } from '../composables/useDrag.js'
import { usePlayerObservers } from '../composables/usePlayerObservers.js'
import { boxShadowCss, effectiveWeight, fontStack, textShadowCss, withAlpha } from '../../shared/settings.js'
import SubtitleText from './SubtitleText.vue'

const root = ref(null)
const handle = ref(null)

const { isDragging, handleOpacity } = useDrag(root, handle)
const { fontSize } = usePlayerObservers(root)

// `computed` (not a plain object) so the refs are unwrapped before the style
// object reaches the DOM patcher.
const handleStyle = computed(() => ({
  opacity: handleOpacity.value,
  cursor: isDragging.value ? 'grabbing' : undefined,
}))

/**
 * Everything the popup can change is expressed as CSS custom properties on the
 * root. The rules that differ per line (`.sub-original` / `.sub-translated`)
 * or per box (`.sub-line`) read those variables, so the stylesheet stays static
 * and only the inline bindings change when a slider moves.
 */
const rootStyle = computed(() => {
  const { font, gap, original, translated, background: bg } = store.settings

  return {
    fontSize: `${fontSize.value}px`,
    fontFamily: fontStack(font.family),
    fontWeight: effectiveWeight(font),
    fontStyle: font.italic ? 'italic' : 'normal',
    lineHeight: font.lineHeight,
    letterSpacing: `${font.letterSpacing}em`,
    textAlign: font.align,
    width: `${font.width}%`,
    cursor: isDragging.value ? 'grabbing' : undefined,

    '--subtitle-gap': `${gap}em`,
    '--sub-original-color': withAlpha(original.color, original.opacity),
    '--sub-translated-color': withAlpha(translated.color, translated.opacity),
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
      <template v-if="store.message !== null">
        <div class="sub-original">{{ store.message }}</div>
        <div class="sub-translated">{{ store.message }}</div>
      </template>

      <template v-else-if="store.currentSubtitle">
        <div class="sub-original">
          <SubtitleText :text="store.currentSubtitle.original" />
        </div>
        <div class="sub-translated">
          <SubtitleText :text="store.currentSubtitle.translated" />
        </div>
      </template>
    </div>
  </div>
</template>
