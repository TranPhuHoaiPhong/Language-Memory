<script setup>
defineProps({
  label: { type: String, required: true },
  modelValue: { type: Number, required: true },
  min: { type: Number, required: true },
  max: { type: Number, required: true },
  step: { type: Number, default: 0.05 },
  displayValue: { type: String, required: true },
})

const emit = defineEmits(['update:modelValue'])
</script>

<template>
  <div class="field">
    <div class="field-head">
      <span class="field-label">{{ label }}</span>
      <span class="field-value">{{ displayValue }}</span>
    </div>
    <input
      class="range"
      type="range"
      :min="min"
      :max="max"
      :step="step"
      :value="modelValue"
      :aria-label="label"
      @input="emit('update:modelValue', Number($event.target.value))"
    />
  </div>
</template>
