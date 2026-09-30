<script setup>
defineProps({
  title: { type: String, required: true },
  open: { type: Boolean, default: false },
})
</script>

<template>
  <!-- Native <details> gives us open/closed state, keyboard support and
       in-page find-in-page for the headings without any JS. -->
  <details class="section" :open="open">
    <summary class="section-head">
      <span>{{ title }}</span>
      <svg class="section-chevron" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </summary>

    <div class="section-body">
      <slot />
    </div>
  </details>
</template>
