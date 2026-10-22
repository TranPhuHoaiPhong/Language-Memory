<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { SPEAKER_ICON } from '../../../core/js/icons.js'
import { useWordPanel } from '../composables/useWordPanel.js'

const {
  visible,
  loading,
  word,
  ipaUs,
  ipaGb,
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

/** Phần thân cuộn được của panel. */
const panelBody = ref(null)

/**
 * Mỗi lần mở một từ mới, phần thân panel bắt đầu từ trên cùng. Không reset thì
 * panel giữ vị trí cuộn của từ trước và mở ra là thấy giữa chừng nội dung.
 */
watch(loading, async (value) => {
  if (value) return
  await nextTick()
  panelBody.value?.scrollTo({ top: 0, left: 0 })
})

/**
 * Từ loại: API trả về cả viết tắt ("n.", "v.") lẫn dạng đầy đủ ("noun",
 * "verb"). Bảng này đặt tên tiếng Việt cho cả hai, vì viết tắt của tiếng Anh
 * không nói được gì với người đọc tiếng Việt — "v." là "Động từ", "n." là
 * "Danh từ". Từ loại lạ thì giữ nguyên như API trả về.
 */
const POS_LABELS = {
  n: 'Danh từ',
  noun: 'Danh từ',
  propn: 'Danh từ riêng',
  v: 'Động từ',
  verb: 'Động từ',
  aux: 'Trợ động từ',
  adj: 'Tính từ',
  a: 'Tính từ',
  adjective: 'Tính từ',
  adv: 'Trạng từ',
  adverb: 'Trạng từ',
  prep: 'Giới từ',
  preposition: 'Giới từ',
  conj: 'Liên từ',
  conjunction: 'Liên từ',
  cconj: 'Liên từ',
  sconj: 'Liên từ',
  pron: 'Đại từ',
  pronoun: 'Đại từ',
  det: 'Từ hạn định',
  determiner: 'Từ hạn định',
  num: 'Số từ',
  numeral: 'Số từ',
  intj: 'Thán từ',
  interj: 'Thán từ',
  exclamation: 'Thán từ',
  part: 'Trợ từ',
  particle: 'Trợ từ',
  punct: 'Dấu câu',
  punctuation: 'Dấu câu',
  x: 'Khác',
}

/** Khoá chuẩn hoá của một từ loại: "n." và "noun" cùng ra "n". */
function posKey(raw) {
  return String(raw || '')
    .replace(/[^a-z]/gi, '')
    .toLowerCase()
}

/** Tên tiếng Việt của một từ loại; từ lạ thì giữ nguyên chữ của API. */
function posLabel(raw) {
  const key = posKey(raw)
  return POS_LABELS[key] || raw
}

/**
 * Mỗi từ loại của từ đang tra, dạng nhãn ở đầu panel: nhãn tiếng Việt để hiện,
 * class màu theo từ loại, và viết tắt gốc của API để làm tooltip.
 */
const posTags = computed(() => {
  return (pos.value || '')
    .split(/[,;]\s*/)
    .map((raw) => raw.trim())
    .filter(Boolean)
    .map((raw) => {
      const key = posKey(raw)
      return {
        key,
        raw,
        label: POS_LABELS[key] || raw,
        className: `pos-${key}`,
      }
    })
    .filter((tag) => tag.key)
})

/* Gom nghĩa theo từ loại để chia section cho đẹp */
const groupedMeanings = computed(() => {
  const map = new Map()
  for (const m of meaningEntries.value) {
    const key = m.part_of_speech || 'Khác'
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(m)
  }
  return [...map.entries()].map(([pos, items]) => ({
    pos,
    label: posLabel(pos),
    items,
  }))
})

const hasMeaningEntries = computed(() => groupedMeanings.value.length > 0)
const hasFallbackMeanings = computed(() => !hasMeaningEntries.value && meanings.value.length > 0)
const hasInflections = computed(() => inflections.value.length > 0)
const hasSynonyms = computed(() => synonyms.value.length > 0)
const hasRelated = computed(() => relatedWords.value.length > 0)
const hasPhrases = computed(() => phrases.value.length > 0)
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

      <div class="panel-body" id="content" ref="panelBody">
        <!-- Skeleton loading: các khối xám đúng hình dạng nội dung thật -->
        <div
          v-if="loading"
          class="wx-skeleton"
          role="status"
          aria-label="Đang tải dữ liệu"
        >
          <!-- Tiêu đề từ -->
          <div class="sk-line sk-line--word"></div>

          <!-- Hàng nút phát âm + phiên âm UK / US -->
          <div class="sk-meta-row">
            <div class="sk-ipa-group">
              <div class="sk-dot"></div>
              <div class="sk-line sk-line--ipa"></div>
            </div>
            <div class="sk-ipa-group">
              <div class="sk-dot"></div>
              <div class="sk-line sk-line--ipa"></div>
            </div>
          </div>

          <!-- Section 1: nghĩa + 2 ví dụ -->
          <div class="sk-block">
            <div class="sk-line sk-line--title"></div>
            <div class="sk-line"></div>
            <div class="sk-line"></div>
            <div class="sk-line sk-line--short"></div>
            <div class="sk-line sk-line--example"></div>
            <div class="sk-line sk-line--example"></div>
          </div>

          <!-- Section 2: nghĩa + 1 ví dụ -->
          <div class="sk-block">
            <div class="sk-line sk-line--title"></div>
            <div class="sk-line"></div>
            <div class="sk-line sk-line--short"></div>
            <div class="sk-line sk-line--example"></div>
          </div>

          <!-- Section 3: nghĩa -->
          <div class="sk-block">
            <div class="sk-line sk-line--title"></div>
            <div class="sk-line"></div>
            <div class="sk-line sk-line--short"></div>
          </div>

          <!-- Section 4: bảng "Các dạng của từ" -->
          <div class="sk-block">
            <div class="sk-line sk-line--title"></div>
            <div class="sk-table-row">
              <div class="sk-line sk-line--cell"></div>
              <div class="sk-line sk-line--cell sk-line--cell-strong"></div>
            </div>
            <div class="sk-table-row">
              <div class="sk-line sk-line--cell"></div>
              <div class="sk-line sk-line--cell sk-line--cell-strong"></div>
            </div>
            <div class="sk-table-row">
              <div class="sk-line sk-line--cell"></div>
              <div class="sk-line sk-line--cell sk-line--cell-strong"></div>
            </div>
          </div>

          <!-- Section 5: danh sách entry (đồng nghĩa / cùng họ / cụm từ) -->
          <div class="sk-block">
            <div class="sk-line sk-line--title"></div>
            <div class="sk-entry">
              <div class="sk-line sk-line--entry-head"></div>
              <div class="sk-line sk-line--entry-meaning"></div>
            </div>
            <div class="sk-entry">
              <div class="sk-line sk-line--entry-head"></div>
              <div class="sk-line sk-line--entry-meaning"></div>
            </div>
            <div class="sk-entry">
              <div class="sk-line sk-line--entry-head"></div>
              <div class="sk-line sk-line--entry-meaning"></div>
            </div>
          </div>
        </div>

        <div v-show="!loading">
          <div class="panel-word">{{ word }}</div>

          <div class="panel-word-pos">
            <!-- GB IPA -->
            <div class="panel-word-meta" v-show="ipaGb">
              <button
                v-if="canPlayAudio"
                class="word-audio-btn"
                type="button"
                aria-label="Phát âm"
                @click="onAudioClick"
              >
                <img :src="audioIcon" alt="" />
              </button>

              <span class="word-popup-ipa">
                <span class="word-popup-ipa-label">UK</span>/{{ ipaGb }}/
              </span>
            </div>

            <!-- US IPA -->
            <div class="panel-word-meta" v-show="ipaUs">
              <button
                v-if="canPlayAudio"
                class="word-audio-btn"
                type="button"
                aria-label="Phát âm"
                @click="onAudioClick"
              >
                <img :src="audioIcon" alt="" />
              </button>

              <span class="word-popup-ipa">
                <span class="word-popup-ipa-label">US</span>/{{ ipaUs }}/
              </span>
            </div>
          </div>
        </div>

        <!-- Nghĩa, các dạng của từ, từ đồng nghĩa, từ cùng họ và cụm từ: một
             danh sách liên tiếp, không tách tab. -->
        <div v-show="!loading" class="wx-pane">
          <template v-if="hasMeaningEntries">
            <section
              v-for="group in groupedMeanings"
              :key="group.pos"
              class="wx-section"
            >
              <h3 class="wx-title" :title="group.pos">{{ group.label }}</h3>
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
              <tbody>
                <tr v-for="f in inflections" :key="f.form + f.word">
                  <td>{{ f.form }}</td>
                  <td>{{ f.word }}</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section v-if="hasSynonyms" class="wx-section">
            <h3 class="wx-title">Từ đồng nghĩa</h3>
            <ul class="wx-entry-list">
              <li v-for="s in synonyms" :key="s.synonym" class="wx-entry">
                <p class="wx-entry__head">
                  <strong>{{ s.synonym }}</strong>
                </p>
                <p v-if="s.translation" class="wx-entry__meaning">
                  {{ s.translation }}
                </p>
              </li>
            </ul>
          </section>

          <section v-if="hasRelated" class="wx-section">
            <h3 class="wx-title">Từ cùng họ</h3>
            <ul class="wx-entry-list">
              <li v-for="w in relatedWords" :key="w.word" class="wx-entry">
                <p class="wx-entry__head">
                  <strong>{{ w.word }}</strong>
                </p>
                <p v-if="w.meaning" class="wx-entry__meaning">
                  {{ w.meaning }}
                </p>
              </li>
            </ul>
          </section>

          <section v-if="hasPhrases" class="wx-section">
            <h3 class="wx-title">Cụm từ thường gặp</h3>
            <ul class="wx-entry-list">
              <li v-for="p in phrases" :key="p.normalized" class="wx-entry">
                <p class="wx-entry__head">
                  <strong>{{ p.normalized }}</strong>
                </p>
                <p v-if="p.translations?.length" class="wx-entry__meaning">
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