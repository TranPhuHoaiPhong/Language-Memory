<script setup>
defineProps({
  label: { type: String, required: true },
  modelValue: { type: Boolean, required: true },
  hint: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue'])
</script>

<template>
  <div class="toggle-row">
    <div class="toggle-text">
      <span class="field-label">{{ label }}</span>
      <span v-if="hint" class="field-hint">{{ hint }}</span>
    </div>

    <button
      class="toggle"
      type="button"
      role="switch"
      :class="{ on: modelValue }"
      :aria-checked="modelValue"
      :aria-label="label"
      @click="emit('update:modelValue', !modelValue)"
    >
      <span class="toggle-knob"></span>
    </button>
  </div>
</template>
