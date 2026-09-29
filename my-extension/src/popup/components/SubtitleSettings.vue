<script setup>
import ColorPicker from './ColorPicker.vue'
import RangeField from './RangeField.vue'
import SectionBlock from './SectionBlock.vue'
import SelectField from './SelectField.vue'
import SubtitlePreview from './SubtitlePreview.vue'
import ToggleField from './ToggleField.vue'
import {
  ALIGN_OPTIONS,
  BOX_SHADOWS,
  FONT_FAMILIES,
  FONT_WEIGHTS,
  GAP_RANGE,
  LETTER_SPACING_RANGE,
  LINE_HEIGHT_RANGE,
  OPACITY_RANGE,
  PADDING_X_RANGE,
  PADDING_Y_RANGE,
  RADIUS_RANGE,
  SCALE_RANGE,
  TEXT_SHADOWS,
  WIDTH_RANGE,
} from '../../shared/settings.js'

const props = defineProps({
  settings: { type: Object, required: true },
})

const emit = defineEmits(['update:settings', 'reset'])

/**
 * Settings are three levels deep, so a flat `patch(key)` is not enough.
 * Cloning only the touched branch keeps the other groups referentially
 * stable, which is what makes the preview re-render only when it must.
 */
function patch(path, value) {
  const keys = path.split('.')
  const next = { ...props.settings }
  let cursor = next

  for (let i = 0; i < keys.length - 1; i += 1) {
    cursor[keys[i]] = { ...cursor[keys[i]] }
    cursor = cursor[keys[i]]
  }

  cursor[keys[keys.length - 1]] = value
  emit('update:settings', next)
}

const percent = (n) => `${Math.round(n * 100)}%`
</script>

<template>
  <div class="tab-body">
    <SubtitlePreview :settings="settings" />

    <!-- ================= Typography ================= -->
    <SectionBlock title="Chữ" :open="true">
      <SelectField
        label="Font"
        :model-value="settings.font.family"
        :options="FONT_FAMILIES"
        @update:model-value="patch('font.family', $event)"
      />

      <RangeField
        label="Kích thước"
        :model-value="settings.font.scale"
        :min="SCALE_RANGE.min"
        :max="SCALE_RANGE.max"
        :step="SCALE_RANGE.step"
        :display-value="percent(settings.font.scale)"
        @update:model-value="patch('font.scale', $event)"
      />

      <SelectField
        label="Độ đậm"
        :model-value="settings.font.weight"
        :options="FONT_WEIGHTS"
        @update:model-value="patch('font.weight', $event)"
      />

      <RangeField
        label="Chiều cao dòng"
        :model-value="settings.font.lineHeight"
        :min="LINE_HEIGHT_RANGE.min"
        :max="LINE_HEIGHT_RANGE.max"
        :step="LINE_HEIGHT_RANGE.step"
        :display-value="settings.font.lineHeight.toFixed(2)"
        @update:model-value="patch('font.lineHeight', $event)"
      />

      <RangeField
        label="Giãn chữ"
        :model-value="settings.font.letterSpacing"
        :min="LETTER_SPACING_RANGE.min"
        :max="LETTER_SPACING_RANGE.max"
        :step="LETTER_SPACING_RANGE.step"
        :display-value="`${settings.font.letterSpacing.toFixed(2)}em`"
        @update:model-value="patch('font.letterSpacing', $event)"
      />

      <RangeField
        label="Độ rộng phụ đề"
        :model-value="settings.font.width"
        :min="WIDTH_RANGE.min"
        :max="WIDTH_RANGE.max"
        :step="WIDTH_RANGE.step"
        :display-value="`${settings.font.width}%`"
        @update:model-value="patch('font.width', $event)"
      />

      <SelectField
        label="Căn chữ"
        :model-value="settings.font.align"
        :options="ALIGN_OPTIONS"
        @update:model-value="patch('font.align', $event)"
      />

      <ToggleField
        label="In đậm"
        :model-value="settings.font.bold"
        @update:model-value="patch('font.bold', $event)"
      />
      <ToggleField
        label="In nghiêng"
        :model-value="settings.font.italic"
        @update:model-value="patch('font.italic', $event)"
      />
    </SectionBlock>

    <RangeField
      label="Khoảng cách 2 dòng"
      :model-value="settings.gap"
      :min="GAP_RANGE.min"
      :max="GAP_RANGE.max"
      :step="GAP_RANGE.step"
      :display-value="`${settings.gap.toFixed(2)}em`"
      @update:model-value="patch('gap', $event)"
    />

    <!-- ================= Per-language lines ================= -->
    <SectionBlock title="Subtitle gốc (English)">
      <ColorPicker
        label="Màu chữ"
        :model-value="settings.original.color"
        @update:model-value="patch('original.color', $event)"
      />
      <RangeField
        label="Độ mờ chữ"
        :model-value="settings.original.opacity"
        :min="OPACITY_RANGE.min"
        :max="OPACITY_RANGE.max"
        :step="OPACITY_RANGE.step"
        :display-value="percent(settings.original.opacity)"
        @update:model-value="patch('original.opacity', $event)"
      />
    </SectionBlock>

    <SectionBlock title="Subtitle dịch (Tiếng Việt)">
      <ColorPicker
        label="Màu chữ"
        :model-value="settings.translated.color"
        @update:model-value="patch('translated.color', $event)"
      />
      <RangeField
        label="Độ mờ chữ"
        :model-value="settings.translated.opacity"
        :min="OPACITY_RANGE.min"
        :max="OPACITY_RANGE.max"
        :step="OPACITY_RANGE.step"
        :display-value="percent(settings.translated.opacity)"
        @update:model-value="patch('translated.opacity', $event)"
      />
    </SectionBlock>

    <!-- ================= Background box ================= -->
    <SectionBlock title="Nền phụ đề">
      <ToggleField
        label="Bật nền"
        :model-value="settings.background.enabled"
        @update:model-value="patch('background.enabled', $event)"
      />

      <template v-if="settings.background.enabled">
        <ColorPicker
          label="Màu nền"
          :model-value="settings.background.color"
          @update:model-value="patch('background.color', $event)"
        />

        <RangeField
          label="Độ mờ nền"
          :model-value="settings.background.opacity"
          :min="OPACITY_RANGE.min"
          :max="OPACITY_RANGE.max"
          :step="OPACITY_RANGE.step"
          :display-value="percent(settings.background.opacity)"
          @update:model-value="patch('background.opacity', $event)"
        />

        <RangeField
          label="Padding ngang"
          :model-value="settings.background.paddingX"
          :min="PADDING_X_RANGE.min"
          :max="PADDING_X_RANGE.max"
          :step="PADDING_X_RANGE.step"
          :display-value="`${settings.background.paddingX}px`"
          @update:model-value="patch('background.paddingX', $event)"
        />

        <RangeField
          label="Padding dọc"
          :model-value="settings.background.paddingY"
          :min="PADDING_Y_RANGE.min"
          :max="PADDING_Y_RANGE.max"
          :step="PADDING_Y_RANGE.step"
          :display-value="`${settings.background.paddingY}px`"
          @update:model-value="patch('background.paddingY', $event)"
        />

        <RangeField
          label="Bo góc"
          :model-value="settings.background.radius"
          :min="RADIUS_RANGE.min"
          :max="RADIUS_RANGE.max"
          :step="RADIUS_RANGE.step"
          :display-value="`${settings.background.radius}px`"
          @update:model-value="patch('background.radius', $event)"
        />

        <SelectField
          label="Đổ bóng khung"
          :model-value="settings.background.boxShadow"
          :options="BOX_SHADOWS"
          @update:model-value="patch('background.boxShadow', $event)"
        />

        <SelectField
          label="Đổ bóng chữ"
          :model-value="settings.background.textShadow"
          :options="TEXT_SHADOWS"
          @update:model-value="patch('background.textShadow', $event)"
        />
      </template>
    </SectionBlock>

    <div class="actions">
      <button class="reset-btn" type="button" @click="emit('reset')">Đặt lại mặc định</button>
      <p class="hint">Tuỳ chỉnh được áp dụng ngay trên video, không cần tải lại trang.</p>
    </div>
  </div>
</template>
