<script setup>
import ColorPicker from '../../../core/ui/ColorPicker.vue'
import RangeField from '../../../core/ui/RangeField.vue'
import SectionBlock from '../../../core/ui/SectionBlock.vue'
import SelectField from '../../../core/ui/SelectField.vue'
import ToggleField from '../../../core/ui/ToggleField.vue'
import SubtitlePreview from './SubtitlePreview.vue'
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
} from '../state/settings.js'

const props = defineProps({
  settings: { type: Object, required: true },
})

const emit = defineEmits(['update:settings', 'reset'])

/**
 * Settings are nested, so a flat `patch(key)` is not enough. Cloning only the
 * touched branch keeps the other groups referentially stable, which is what
 * makes the preview re-render only when it must.
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

/** The two rendered rows, so their fields are declared once instead of twice. */
const LINES = [
  { key: 'original', title: 'Dòng phụ đề gốc' },
  { key: 'translated', title: 'Dòng phụ đề dịch' },
]
</script>

<template>
  <div class="tab-body">
    <SubtitlePreview :settings="settings" />

    <!-- ================= Shared typography ================= -->
    <SectionBlock title="Chung cho cả 2 dòng" :open="true">
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

      <RangeField
        label="Khoảng cách 2 dòng"
        :model-value="settings.gap"
        :min="GAP_RANGE.min"
        :max="GAP_RANGE.max"
        :step="GAP_RANGE.step"
        :display-value="`${settings.gap.toFixed(2)}em`"
        @update:model-value="patch('gap', $event)"
      />
    </SectionBlock>

    <!-- ================= Per-line settings =================
         Show/hide, family, size, colour and opacity are per line: the source and
         the translation are read side by side, so styling them together is what
         the user wants. -->
    <SectionBlock v-for="line in LINES" :key="line.key" :title="line.title">
      <ToggleField
        label="Hiện dòng này"
        hint="Tắt để chỉ giữ dòng còn lại"
        :model-value="settings[line.key].enabled"
        @update:model-value="patch(`${line.key}.enabled`, $event)"
      />

      <SelectField
        label="Kiểu chữ"
        :model-value="settings[line.key].family"
        :options="FONT_FAMILIES"
        @update:model-value="patch(`${line.key}.family`, $event)"
      />

      <RangeField
        label="Kích thước"
        :model-value="settings[line.key].scale"
        :min="SCALE_RANGE.min"
        :max="SCALE_RANGE.max"
        :step="SCALE_RANGE.step"
        :display-value="percent(settings[line.key].scale)"
        @update:model-value="patch(`${line.key}.scale`, $event)"
      />

      <ColorPicker
        label="Màu chữ"
        :model-value="settings[line.key].color"
        @update:model-value="patch(`${line.key}.color`, $event)"
      />

      <RangeField
        label="Độ mờ chữ"
        :model-value="settings[line.key].opacity"
        :min="OPACITY_RANGE.min"
        :max="OPACITY_RANGE.max"
        :step="OPACITY_RANGE.step"
        :display-value="percent(settings[line.key].opacity)"
        @update:model-value="patch(`${line.key}.opacity`, $event)"
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
