<script setup>
import { computed, ref, watch } from 'vue'
import { SPEAKER_ICON } from '../../../core/js/icons.js'
import { useWordPanel } from '../composables/useWordPanel.js'

const {
  visible,
  loading,
  word,
  ipa,
  pos,
  meanings,
  meaningEntries,
  inflections,
  synonyms,
  relatedWords,
  phrases,
  canPlayAudio,
  canSave,
  close,
  onSave,
  onAudioClick,
} = useWordPanel()

const audioIcon = SPEAKER_ICON

/* Tab đang mở: 'overview' | 'details' */
const activeTab = ref('overview')

/* Mỗi lần panel mở lại hoặc tra một từ mới đều quay về tab Tổng quan */
watch([visible, word], ([isVisible]) => {
  if (isVisible) activeTab.value = 'overview'
})

/* Ghép class từ POS, lọc bỏ ký tự lạ: "n., v." -> pos-n pos-v */
const posClass = computed(() => {
  const tokens = (pos.value || '')
    .split(/[,;]\s*/)
    .filter(Boolean)
    .map((t) => `pos-${t.replace(/[^a-z]/gi, '').toLowerCase()}`)
    .filter((c) => c !== 'pos-')
  return ['word-popup-pos', ...tokens]
})

/* Gom nghĩa theo từ loại để chia section cho đẹp */
const groupedMeanings = computed(() => {
  const map = new Map()
  for (const m of meaningEntries.value) {
    const key = m.part_of_speech || 'Khác'
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(m)
  }
  return [...map.entries()].map(([pos, items]) => ({ pos, items }))
})

const hasMeaningEntries = computed(() => groupedMeanings.value.length > 0)
const hasFallbackMeanings = computed(() => !hasMeaningEntries.value && meanings.value.length > 0)
const hasInflections = computed(() => inflections.value.length > 0)
const hasSynonyms = computed(() => synonyms.value.length > 0)
const hasRelated = computed(() => relatedWords.value.length > 0)
const hasPhrases = computed(() => phrases.value.length > 0)
const hasDetails = computed(() => hasSynonyms.value || hasRelated.value || hasPhrases.value)
</script>

<template>
  <Transition name="word-panel">
    <aside
      id="lingo-word-panel"
      v-if="visible"
      :class="{ loading }"
      @mousedown.stop
    >
      <header class="panel-head">
        <button class="panel-close" type="button" aria-label="Đóng" @click="close">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M6 6l12 12M18 6L6 18"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
            />
          </svg>
        </button>

      </header>

      <div class="panel-body" id="content">
        <div class="word-popup-spinner" v-show="loading"></div>

        <div>
          <div class="panel-word" v-show="!loading">{{ word }}</div>

          <div class="panel-word-meta" v-show="!loading">
            <button
              v-if="canPlayAudio"
              class="word-audio-btn"
              type="button"
              aria-label="Phát âm"
              @click="onAudioClick"
            >
              <img :src="audioIcon" alt="" />
            </button>

            <span v-if="ipa" class="word-popup-ipa">{{ ipa }}</span>
            
          </div>
        </div>

        <!-- Tabs -->
        <nav
          class="wx-tabs"
          v-show="!loading && (hasMeaningEntries || hasDetails)"
        >
          <button
            type="button"
            :class="['wx-tab', { active: activeTab === 'overview' }]"
            @click="activeTab = 'overview'"
          >
            Tổng quan
          </button>
          <button
            v-if="hasDetails"
            type="button"
            :class="['wx-tab', { active: activeTab === 'details' }]"
            @click="activeTab = 'details'"
          >
            Chi tiết
          </button>
        </nav>

        <!-- ========== TAB TỔNG QUAN ========== -->
        <div v-show="!loading && activeTab === 'overview'" class="wx-pane">
          <template v-if="hasMeaningEntries">
            <section
              v-for="group in groupedMeanings"
              :key="group.pos"
              class="wx-section"
            >
              <h3 class="wx-title">{{ group.pos }}</h3>
              <ol class="wx-sense-list">
                <li v-for="(m, i) in group.items" :key="i" class="wx-sense">
                  <p v-if="m.explanation" class="wx-sense__title">{{ m.explanation }}</p>
                  <p
                    v-if="m.meaning"
                    :class="m.explanation ? 'wx-sense__def' : 'wx-sense__title'"
                  >
                    {{ m.meaning }}
                  </p>
                  <ul v-if="m.examples?.length" class="wx-example-list">
                    <li
                      v-for="(ex, j) in m.examples"
                      :key="j"
                      class="wx-example"
                    >
                      <p class="wx-example__en">{{ ex.sentence }}</p>
                      <p v-if="ex.translation" class="wx-example__vi">
                        {{ ex.translation }}
                      </p>
                    </li>
                  </ul>
                </li>
              </ol>
            </section>
          </template>

          <section v-else-if="hasFallbackMeanings" class="wx-section">
            <ul class="wx-fallback-list">
              <li v-for="(text, index) in meanings" :key="index">{{ text }}</li>
            </ul>
          </section>

          <section v-if="hasInflections" class="wx-section">
            <h3 class="wx-title">Các dạng của từ</h3>
            <table class="wx-table">
              <thead>
                <tr>
                  <th>Dạng</th>
                  <th>Từ</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="f in inflections" :key="f.form + f.word">
                  <td>{{ f.form }}</td>
                  <td>{{ f.word }}</td>
                </tr>
              </tbody>
            </table>
          </section>
        </div>

        <!-- ========== TAB CHI TIẾT ========== -->
        <div v-show="!loading && activeTab === 'details'" class="wx-pane">
          <section v-if="hasSynonyms" class="wx-section">
            <h3 class="wx-title">Từ đồng nghĩa</h3>
            <ul class="wx-inline-list">
              <li v-for="s in synonyms" :key="s.synonym">
                <strong>{{ s.synonym }}</strong>
                <span v-if="s.translation"> — {{ s.translation }}</span>
              </li>
            </ul>
          </section>

          <section v-if="hasRelated" class="wx-section">
            <h3 class="wx-title">Từ cùng họ</h3>
            <ul class="wx-inline-list">
              <li v-for="w in relatedWords" :key="w.word">
                <strong>{{ w.word }}</strong>
                <span v-if="w.meaning"> — {{ w.meaning }}</span>
              </li>
            </ul>
          </section>

          <section v-if="hasPhrases" class="wx-section">
            <h3 class="wx-title">Cụm từ thường gặp</h3>
            <ul class="wx-phrase-list">
              <li v-for="p in phrases" :key="p.normalized" class="wx-phrase">
                <p class="wx-phrase__head">
                  <strong>{{ p.normalized }}</strong>
                </p>
                <p v-if="p.translations?.length" class="wx-phrase__meaning">
                  {{
                    p.translations
                      .map((t) => t.translation_vi)
                      .filter(Boolean)
                      .join(' · ')
                  }}
                </p>
              </li>
            </ul>
          </section>
        </div>
      </div>

      <footer class="panel-foot" v-show="!loading">
        <button class="word-save-btn" :disabled="!canSave" @click="onSave">
          Lưu từ
        </button>
      </footer>
    </aside>
  </Transition>
</template>

<style scoped src="../styles/panel.css"></style>