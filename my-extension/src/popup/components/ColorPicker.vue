<script setup>
import { computed } from 'vue'
import { COLOR_PRESETS } from '../../shared/settings.js'

const props = defineProps({
  label: { type: String, default: 'Màu chữ' },
  modelValue: { type: String, required: true },
})

const emit = defineEmits(['update:modelValue'])

const current = computed(() => props.modelValue.toLowerCase())
const isPreset = computed(() => COLOR_PRESETS.some((c) => c.value === current.value))
</script>

<template>
  <div class="field">
    <div class="field-head">
      <span class="field-label">{{ label }}</span>
      <span class="field-value field-value--swatch">
        <i class="swatch-dot" :style="{ background: modelValue }"></i>
        {{ modelValue.toUpperCase() }}
      </span>
    </div>

    <div class="swatches">
      <button
        v-for="preset in COLOR_PRESETS"
        :key="preset.value"
        class="swatch"
        type="button"
        :class="{ active: current === preset.value }"
        :style="{ background: preset.value }"
        :title="preset.label"
        :aria-label="preset.label"
        :aria-pressed="current === preset.value"
        @click="emit('update:modelValue', preset.value)"
      ></button>

      <label class="swatch swatch--custom" :style="{ background: modelValue }" title="Màu tùy chỉnh">
        <input
          type="color"
          :value="modelValue"
          :aria-label="`${label} tuỳ chỉnh`"
          @input="emit('update:modelValue', $event.target.value)"
        />
        <span v-if="!isPreset" class="swatch-check">✓</span>
      </label>
    </div>
  </div>
</template>
