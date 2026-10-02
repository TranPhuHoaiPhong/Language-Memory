<script setup>
defineProps({
  label: { type: String, default: 'Màu chữ' },
  modelValue: { type: String, required: true },
})

const emit = defineEmits(['update:modelValue'])
</script>

<template>
  <div class="field">
    <div class="field-head">
      <span class="field-label">{{ label }}</span>
      <span class="field-value">{{ modelValue.toUpperCase() }}</span>
    </div>

    <!-- No preset chips: the native control opens the whole palette right away,
         so a single click already lands on a colour. The input is stretched
         over a bar painted with the current colour and kept transparent. -->
    <label class="color-bar" :style="{ background: modelValue }" :title="label">
      <input
        type="color"
        :value="modelValue"
        :aria-label="label"
        @input="emit('update:modelValue', $event.target.value)"
      />
    </label>
  </div>
</template>