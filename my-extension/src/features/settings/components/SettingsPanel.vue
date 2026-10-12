<script setup>
import { onBeforeUnmount, onMounted } from 'vue'
import { t } from '../../../core/i18n/index.js'
import LanguageSelect from '../../../core/ui/LanguageSelect.vue'
import SectionBlock from '../../../core/ui/SectionBlock.vue'
import { LANGUAGES } from '../../../core/js/languages.js'
import { useSettingsPanel } from '../composables/useSettingsPanel.js'

const {
  visible,
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
  <!-- Kept mounted (`v-show`) so the settings keep their state (open <details>,
       scroll position). It is a fixed dock on the right of the screen; the enter
       transition slides it in from the right. -->
  <Transition name="settings-panel">
    <aside id="lingo-settings" v-show="visible" :aria-hidden="!visible">
      <header class="head">
        <button class="close-btn" type="button" :aria-label="t('settings.close')" @click="close">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
          </svg>
        </button>
        <h2>LINGO</h2>
        <transition name="fade">
          <span v-if="showSavedHint" class="saved-hint">{{ t('settings.saved') }}</span>
        </transition>
      </header>

      <!-- One panel, no tab bar: the language pair and every feature section used
           to be tabs of their own, which hid two related settings behind a click
           for no reason. They are collapsible sections of a single list instead,
           and a feature that registers a tab later lands here as well. It is also
           the panel's one scrolling region: it fills what the header leaves and
           scrolls when the settings are longer than the sidebar column. -->
      <div class="panels" id="content">
        <SectionBlock :title="t('settings.languageSection')" :open="true">
          <LanguageSelect
            id="learningLanguage"
            v-model="targetLanguage"
            :options="LANGUAGES"
            :label="t('settings.learningLanguage')"
          />
          <LanguageSelect
            id="language"
            v-model="nativeLanguage"
            :options="LANGUAGES"
            :label="t('settings.nativeLanguage')"
          />
          <p class="hint">{{ t('settings.languageHint') }}</p>
        </SectionBlock>

        <SectionBlock v-for="tab in tabs" :key="tab.id" :title="tab.labelKey ? t(tab.labelKey) : tab.label" :open="true">
          <component
            :is="tab.component"
            v-model:settings="model[tab.storageKey]"
            @reset="setField(tab.storageKey, null)"
          />
        </SectionBlock>
      </div>
    </aside>
  </Transition>
</template>
