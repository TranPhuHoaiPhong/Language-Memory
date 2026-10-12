<script setup>
import { computed } from 'vue'
import { t } from '../../../core/i18n/index.js'
import ColorPicker from '../../../core/ui/ColorPicker.vue'
import RangeField from '../../../core/ui/RangeField.vue'
import SectionBlock from '../../../core/ui/SectionBlock.vue'
import SelectField from '../../../core/ui/SelectField.vue'
import ToggleField from '../../../core/ui/ToggleField.vue'
import {
  ALIGN_OPTIONS,
  FONT_FAMILIES,
  FONT_WEIGHTS,
  GAP_RANGE,
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
 * touched branch keeps the other groups referentially stable.
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

/**
 * Dropdown option labels live in the locale JSON, keyed by their value, so a
 * language switch re-labels them like every other string. The stored value does
 * not change — only the visible label is replaced.
 */
function localizeOptions(options, group) {
  return options.map((option) => ({ ...option, label: t(`options.${group}.${option.value}`) }))
}

const weightOptions = computed(() => localizeOptions(FONT_WEIGHTS, 'weight'))
const alignOptions = computed(() => localizeOptions(ALIGN_OPTIONS, 'align'))
const textShadowOptions = computed(() => localizeOptions(TEXT_SHADOWS, 'textShadow'))
const familyOptions = computed(() => localizeOptions(FONT_FAMILIES, 'family'))

/** The two rendered rows, so their fields are declared once instead of twice. */
const LINES = [
  { key: 'original', titleKey: 'subtitles.originalLine' },
  { key: 'translated', titleKey: 'subtitles.translatedLine' },
]
</script>

<template>
  <div class="tab-body">
    <!-- ================= Display & word states ================= -->
    <SectionBlock :title="t('subtitles.display')" :open="true">
      <ToggleField
        :label="t('subtitles.enabled')"
        :hint="t('subtitles.enabledHint')"
        :model-value="settings.enabled"
        @update:model-value="patch('enabled', $event)"
      />

      <ToggleField
        :label="t('subtitles.pending')"
        :hint="t('subtitles.pendingHint')"
        :model-value="settings.pending.enabled"
        @update:model-value="patch('pending.enabled', $event)"
      />

      <RangeField
        v-if="settings.pending.enabled"
        :label="t('subtitles.pendingOpacity')"
        :model-value="settings.pending.opacity"
        :min="OPACITY_RANGE.min"
        :max="OPACITY_RANGE.max"
        :step="OPACITY_RANGE.step"
        :display-value="percent(settings.pending.opacity)"
        @update:model-value="patch('pending.opacity', $event)"
      />

      <ToggleField
        :label="t('subtitles.highlight')"
        :hint="t('subtitles.highlightHint')"
        :model-value="settings.highlight.enabled"
        @update:model-value="patch('highlight.enabled', $event)"
      />

      <ColorPicker
        v-if="settings.highlight.enabled"
        :label="t('subtitles.highlightColor')"
        :model-value="settings.highlight.color"
        @update:model-value="patch('highlight.color', $event)"
      />
    </SectionBlock>

    <!-- ================= Shared typography ================= -->
    <SectionBlock :title="t('subtitles.shared')" :open="true">
      <SelectField
        :label="t('subtitles.weight')"
        :model-value="settings.font.weight"
        :options="weightOptions"
        @update:model-value="patch('font.weight', $event)"
      />

      <RangeField
        :label="t('subtitles.lineHeight')"
        :model-value="settings.font.lineHeight"
        :min="LINE_HEIGHT_RANGE.min"
        :max="LINE_HEIGHT_RANGE.max"
        :step="LINE_HEIGHT_RANGE.step"
        :display-value="settings.font.lineHeight.toFixed(2)"
        @update:model-value="patch('font.lineHeight', $event)"
      />

      <RangeField
        :label="t('subtitles.width')"
        :model-value="settings.font.width"
        :min="WIDTH_RANGE.min"
        :max="WIDTH_RANGE.max"
        :step="WIDTH_RANGE.step"
        :display-value="`${settings.font.width}%`"
        @update:model-value="patch('font.width', $event)"
      />

      <SelectField
        :label="t('subtitles.align')"
        :model-value="settings.font.align"
        :options="alignOptions"
        @update:model-value="patch('font.align', $event)"
      />

      <ToggleField
        :label="t('subtitles.bold')"
        :model-value="settings.font.bold"
        @update:model-value="patch('font.bold', $event)"
      />
      <ToggleField
        :label="t('subtitles.italic')"
        :model-value="settings.font.italic"
        @update:model-value="patch('font.italic', $event)"
      />

      <RangeField
        :label="t('subtitles.gap')"
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
    <SectionBlock v-for="line in LINES" :key="line.key" :title="t(line.titleKey)">
      <ToggleField
        :label="t('subtitles.lineEnabled')"
        :hint="t('subtitles.lineEnabledHint')"
        :model-value="settings[line.key].enabled"
        @update:model-value="patch(`${line.key}.enabled`, $event)"
      />

      <SelectField
        :label="t('subtitles.family')"
        :model-value="settings[line.key].family"
        :options="familyOptions"
        @update:model-value="patch(`${line.key}.family`, $event)"
      />

      <RangeField
        :label="t('subtitles.scale')"
        :model-value="settings[line.key].scale"
        :min="SCALE_RANGE.min"
        :max="SCALE_RANGE.max"
        :step="SCALE_RANGE.step"
        :display-value="percent(settings[line.key].scale)"
        @update:model-value="patch(`${line.key}.scale`, $event)"
      />

      <ColorPicker
        :label="t('subtitles.color')"
        :model-value="settings[line.key].color"
        @update:model-value="patch(`${line.key}.color`, $event)"
      />

      <RangeField
        :label="t('subtitles.lineOpacity')"
        :model-value="settings[line.key].opacity"
        :min="OPACITY_RANGE.min"
        :max="OPACITY_RANGE.max"
        :step="OPACITY_RANGE.step"
        :display-value="percent(settings[line.key].opacity)"
        @update:model-value="patch(`${line.key}.opacity`, $event)"
      />
    </SectionBlock>

    <!-- ================= Background box ================= -->
    <SectionBlock :title="t('subtitles.background')">
      <ToggleField
        :label="t('subtitles.bgEnabled')"
        :model-value="settings.background.enabled"
        @update:model-value="patch('background.enabled', $event)"
      />

      <template v-if="settings.background.enabled">
        <ColorPicker
          :label="t('subtitles.bgColor')"
          :model-value="settings.background.color"
          @update:model-value="patch('background.color', $event)"
        />

        <RangeField
          :label="t('subtitles.bgOpacity')"
          :model-value="settings.background.opacity"
          :min="OPACITY_RANGE.min"
          :max="OPACITY_RANGE.max"
          :step="OPACITY_RANGE.step"
          :display-value="percent(settings.background.opacity)"
          @update:model-value="patch('background.opacity', $event)"
        />

        <RangeField
          :label="t('subtitles.paddingX')"
          :model-value="settings.background.paddingX"
          :min="PADDING_X_RANGE.min"
          :max="PADDING_X_RANGE.max"
          :step="PADDING_X_RANGE.step"
          :display-value="`${settings.background.paddingX}px`"
          @update:model-value="patch('background.paddingX', $event)"
        />

        <RangeField
          :label="t('subtitles.paddingY')"
          :model-value="settings.background.paddingY"
          :min="PADDING_Y_RANGE.min"
          :max="PADDING_Y_RANGE.max"
          :step="PADDING_Y_RANGE.step"
          :display-value="`${settings.background.paddingY}px`"
          @update:model-value="patch('background.paddingY', $event)"
        />

        <RangeField
          :label="t('subtitles.radius')"
          :model-value="settings.background.radius"
          :min="RADIUS_RANGE.min"
          :max="RADIUS_RANGE.max"
          :step="RADIUS_RANGE.step"
          :display-value="`${settings.background.radius}px`"
          @update:model-value="patch('background.radius', $event)"
        />

        <SelectField
          :label="t('subtitles.textShadow')"
          :model-value="settings.background.textShadow"
          :options="textShadowOptions"
          @update:model-value="patch('background.textShadow', $event)"
        />
      </template>
    </SectionBlock>

    <div class="actions">
      <button class="reset-btn" type="button" @click="emit('reset')">{{ t('subtitles.reset') }}</button>
      <p class="hint">{{ t('subtitles.appliedHint') }}</p>
    </div>
  </div>
</template>
