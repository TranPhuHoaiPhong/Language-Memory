<script setup>
defineProps({
  id: { type: String, required: true },
  label: { type: String, required: true },
  options: { type: Array, required: true },
  modelValue: { type: String, default: '' },
})

defineEmits(['update:modelValue'])
</script>

<template>
  <div class="field">
    <p class="desc">{{ label }}</p>
    <div class="select-wrapper">
      <select :id="id" :value="modelValue" @change="$emit('update:modelValue', $event.target.value)">
        <option v-for="lang in options" :key="lang.code" :value="lang.code">{{ lang.name }}</option>
      </select>
    </div>
  </div>
</template>
