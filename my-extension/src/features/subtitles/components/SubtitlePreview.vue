<script setup>
import { computed } from 'vue'
import { boxShadowCss, effectiveWeight, lineStyle, textShadowCss, withAlpha } from '../state/settings.js'
import { MIN_PREVIEW_FONT_SIZE } from '../logic/previewMetrics.js'

/**
 * Applies the exact same declarations as the content overlay, so the sidebar is
 * a faithful preview instead of an approximation. 18px is the overlay's own
 * minimum font size, i.e. the reference case for small players, and the per-line
 * scales multiply it the way they multiply the overlay's auto size.
 */
const props = defineProps({
  settings: { type: Object, required: true },
})

const rootStyle = computed(() => {
  const { font, background: bg } = props.settings

  return {
    fontSize: `${MIN_PREVIEW_FONT_SIZE}px`,
    fontWeight: effectiveWeight(font),
    fontStyle: font.italic ? 'italic' : 'normal',
    lineHeight: font.lineHeight,
    letterSpacing: `${font.letterSpacing}em`,
    textAlign: font.align,
    width: `${font.width}%`,

    '--sub-background': bg.enabled ? withAlpha(bg.color, bg.opacity) : 'transparent',
    '--sub-radius': `${bg.radius}px`,
    '--sub-padding': `${bg.paddingY}px ${bg.paddingX}px`,
    '--sub-box-shadow': boxShadowCss(bg.boxShadow),
    '--sub-text-shadow': textShadowCss(bg.textShadow),
  }
})

const lines = {
  original: 'The quick brown fox jumps over the lazy dog',
  translated: 'Con cáo nâu nhảy qua con chó lười biếng',
}

const anyLineVisible = computed(
  () => props.settings.original.enabled || props.settings.translated.enabled,
)
</script>

<template>
  <div class="preview" aria-label="Xem trước phụ đề">
    <div class="preview-stage">
      <div class="preview-sub" :style="rootStyle">
        <!-- A row switched off is left out here too, so the preview cannot
             promise something the overlay will not draw. -->
        <div v-if="settings.original.enabled" class="preview-line" :style="lineStyle(settings.original)">
          {{ lines.original }}
        </div>
        <div
          v-if="settings.translated.enabled"
          class="preview-line"
          :style="[lineStyle(settings.translated), { marginTop: `${settings.gap}em` }]"
        >
          {{ lines.translated }}
        </div>

        <p v-if="!anyLineVisible" class="preview-empty">Cả hai dòng đang tắt</p>
      </div>
    </div>
    <p class="preview-caption">Xem trước</p>
  </div>
</template>
