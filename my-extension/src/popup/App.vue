<script setup>
import LanguageSelect from './components/LanguageSelect.vue'
import SubtitleSettings from './components/SubtitleSettings.vue'
import { LANGUAGES } from '../shared/languages.js'
import { usePopup } from './composables/usePopup.js'

const {
  ready,
  activeTab,
  nativeLanguage,
  targetLanguage,
  settings,
  showSavedHint,
  resetSettings,
} = usePopup()

const TABS = [
  { id: 'language', label: 'Ngôn ngữ' },
  { id: 'subtitle', label: 'Phụ đề' },
]
</script>

<template>
  <main class="container">
    <header class="head">
      <h2>LINGO</h2>
      <transition name="fade">
        <span v-if="ready && showSavedHint" class="saved-hint">Đã lưu</span>
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

      <SubtitleSettings v-show="activeTab === 'subtitle'" v-model:settings="settings" @reset="resetSettings" />
    </div>
  </main>
</template>
