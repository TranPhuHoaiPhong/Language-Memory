<script setup>
import { onBeforeUnmount, onMounted } from 'vue'
import LanguageSelect from '../../../core/ui/LanguageSelect.vue'
import { LANGUAGES } from '../../../core/js/languages.js'
import { useSettingsPanel } from '../composables/useSettingsPanel.js'

const {
  isOpen,
  activeTab,
  tabs,
  model,
  nativeLanguage,
  targetLanguage,
  setField,
  showSavedHint,
  close,
} = useSettingsPanel()

const TABS = [
  { id: 'language', label: 'Ngôn ngữ' },
  ...tabs.map((tab) => ({ id: tab.id, label: tab.label })),
]

function onKeydown(event) {
  if (event.key === 'Escape') close()
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <!-- Kept mounted and only translated off-screen, so opening it is instant and
       the settings keep their state (open <details>, scroll, active tab). -->
  <aside id="lingo-settings" :class="{ open: isOpen }" :aria-hidden="!isOpen">
    <header class="head">
      <button class="close-btn" type="button" aria-label="Đóng" @click="close">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
        </svg>
      </button>
      <h2>LINGO</h2>
      <transition name="fade">
        <span v-if="showSavedHint" class="saved-hint">Đã lưu</span>
      </transition>
    </header>

    <nav class="tabs" role="tablist">
      <button
        v-for="tab in TABS"
        :key="tab.id"
        class="tab"
        type="button"
        role="tab"
        :class="{ active: activeTab === tab.id }"
        :aria-selected="activeTab === tab.id"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </nav>

    <div class="panels">
      <section v-show="activeTab === 'language'" class="tab-body" role="tabpanel">
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
      </section>

      <component
        v-for="tab in tabs"
        :is="tab.component"
        :key="tab.id"
        v-show="activeTab === tab.id"
        v-model:settings="model[tab.storageKey]"
        @reset="setField(tab.storageKey, null)"
      />
    </div>
  </aside>
</template>
