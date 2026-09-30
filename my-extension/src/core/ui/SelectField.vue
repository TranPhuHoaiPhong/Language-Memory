<script setup>
const props = defineProps({
  label: { type: String, required: true },
  modelValue: { type: [String, Number], required: true },
  options: { type: Array, required: true },
})

const emit = defineEmits(['update:modelValue'])

/** Native <select> gives us keyboard and mobile behaviour for free. */
function onChange(event) {
  const raw = event.target.value
  const picked = props.options.find((o) => String(o.value) === raw)
  emit('update:modelValue', picked ? picked.value : raw)
}
</script>

<template>
  <div class="field">
    <span class="field-label">{{ label }}</span>
    <div class="select-wrapper select-wrapper--compact">
      <select :value="modelValue" :aria-label="label" @change="onChange($event)">
        <option v-for="option in options" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>
    </div>
  </div>
</template>
