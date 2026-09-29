<script setup>
import { computed } from 'vue'
import {
  boxShadowCss,
  effectiveWeight,
  fontStack,
  textShadowCss,
  withAlpha,
} from '../../shared/settings.js'
import { MIN_PREVIEW_FONT_SIZE } from '../composables/previewMetrics.js'

/**
 * Applies the exact same declarations as the content overlay, so the popup is
 * a faithful preview instead of an approximation. 18px is the overlay's own
 * minimum font size, i.e. the reference case for small players.
 */
const props = defineProps({
  settings: { type: Object, required: true },
})

const rootStyle = computed(() => {
  const { font, background: bg } = props.settings

  return {
    fontSize: `${Math.round(MIN_PREVIEW_FONT_SIZE * font.scale)}px`,
    fontFamily: fontStack(font.family),
    fontWeight: effectiveWeight(font),
    fontStyle: font.italic ? 'italic' : 'normal',
    lineHeight: font.lineHeight,
    letterSpacing: `${font.letterSpacing}em`,
    textAlign: font.align,
    width: `${font.width}%`,

    '--sub-original-color': withAlpha(props.settings.original.color, props.settings.original.opacity),
    '--sub-translated-color': withAlpha(props.settings.translated.color, props.settings.translated.opacity),
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
</script>

<template>
  <div class="preview" aria-label="Xem trước phụ đề">
    <div class="preview-stage">
      <div class="preview-sub" :style="rootStyle">
        <div class="preview-line preview-line--original">{{ lines.original }}</div>
        <div
          class="preview-line preview-line--translated"
          :style="{ marginTop: `${settings.gap}em` }"
        >
          {{ lines.translated }}
        </div>
      </div>
    </div>
    <p class="preview-caption">Xem trước</p>
  </div>
</template>
