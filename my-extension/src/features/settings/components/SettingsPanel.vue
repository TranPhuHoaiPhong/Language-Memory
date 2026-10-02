<script setup>
import { onBeforeUnmount, onMounted } from 'vue'
import LanguageSelect from '../../../core/ui/LanguageSelect.vue'
import SectionBlock from '../../../core/ui/SectionBlock.vue'
import { LANGUAGES } from '../../../core/js/languages.js'
import { useSettingsPanel } from '../composables/useSettingsPanel.js'

const {
  isOpen,
  tabs,
  model,
  nativeLanguage,
  targetLanguage,
  setField,
  showSavedHint,
  close,
} = useSettingsPanel()

function onKeydown(event) {
  if (event.key === 'Escape') close()
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <!-- Kept mounted and only translated off-screen, so opening it is instant and
       the settings keep their state (open <details>, scroll position). -->
  <aside id="lingo-settings" :class="{ open: isOpen }" :aria-hidden="!isOpen">
    <!-- Out of the header and pinned to the right edge, vertically centred: a
         drawer handle. It stays reachable no matter how far the settings are
         scrolled, and the `>` reads as "push it back in". -->
    <button class="close-btn" type="button" aria-label="Đóng" @click="close">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </button>

    <header class="head">
      <h2>LINGO</h2>
      <transition name="fade">
        <span v-if="showSavedHint" class="saved-hint">Đã lưu</span>
      </transition>
    </header>

    <!-- One panel, no tab bar: the language pair and every feature section used
         to be tabs of their own, which hid two related settings behind a click
         for no reason. They are collapsible sections of a single scrolling list
         instead, and a feature that registers a tab later lands here as well. -->
    <div class="panels">
      <SectionBlock title="Ngôn ngữ" :open="true">
        <LanguageSelect
          id="learningLanguage"
          v-model="targetLanguage"
          :options="LANGUAGES"
          label="Ngôn ngữ bạn muốn học"
        />
        <LanguageSelect
          id="language"
          v-model="nativeLanguage"
          :options="LANGUAGES"
          label="Ngôn ngữ bản ngữ của bạn"
        />
        <p class="hint">Đổi ngôn ngữ sẽ tải lại phụ đề của video hiện tại.</p>
      </SectionBlock>

      <SectionBlock v-for="tab in tabs" :key="tab.id" :title="tab.label" :open="true">
        <component
          :is="tab.component"
          v-model:settings="model[tab.storageKey]"
          @reset="setField(tab.storageKey, null)"
        />
      </SectionBlock>
    </div>
  </aside>
</template>
