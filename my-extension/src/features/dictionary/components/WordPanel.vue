<script setup>
import { computed, ref } from 'vue'
import { runtimeUrl } from '../../../core/js/browser.js'
import { AUDIO_ICON_URL } from '../../../core/js/constants.js'
import { useWordPanel } from '../composables/useWordPanel.js'

const {
  open,
  loading,
  word,
  ipa,
  pos,
  meaning,
  audioUrl,
  canSave,
  close,
  onSave,
  onAudioClick,
} = useWordPanel()

const posClass = computed(() =>
  pos.value ? ['word-popup-pos', `pos-${pos.value.toLowerCase()}`] : ['word-popup-pos'],
)

const audioIcon = runtimeUrl(AUDIO_ICON_URL)

/* ------------------------------------------------------------------ */
/* Dữ liệu từ vựng "move" (gộp từ move muːv.txt)                       */
/* ------------------------------------------------------------------ */
const moveData = {
  word: 'move',
  ipa: '/muːv/',
  verbSenses: [
    {
      index: 1,
      title: 'chuyển chỗ ở, chuyển nơi làm việc',
      definition: 'Rời nơi đang sống hoặc làm việc để đến một nơi khác.',
      examples: [
        {
          en: "My sister moved to Da Nang last spring to be closer to her husband's family.",
          vi: 'Chị tôi chuyển vào Đà Nẵng hồi mùa xuân năm ngoái để ở gần gia đình chồng.',
        },
      ],
    },
    {
      index: 2,
      title: 'di chuyển, nhúc nhích; làm cho thứ gì đó đổi vị trí',
      definition:
        'Thay đổi vị trí của chính mình, hoặc đẩy, mang, chuyển một vật hay một người sang chỗ khác.',
      examples: [
        {
          en: 'The cat refused to move from the warm spot by the window.',
          vi: 'Con mèo nhất quyết không nhúc nhích khỏi chỗ ấm bên cửa sổ.',
        },
        {
          en: 'Would you mind moving your bag so I can sit down?',
          vi: 'Bạn làm ơn dời cái túi đi để tôi ngồi được không?',
        },
      ],
    },
    {
      index: 3,
      title: 'tiến lên, có tiến triển',
      definition: 'Phát triển hoặc đi tới trước theo một hướng nhất định.',
      examples: [
        {
          en: 'Construction of the bridge is moving faster than anyone expected.',
          vi: 'Việc xây cây cầu đang tiến nhanh hơn mọi người dự đoán.',
        },
      ],
    },
    {
      index: 4,
      title: 'khiến ai xúc động, làm lay động cảm xúc',
      definition: 'Tác động mạnh đến tình cảm của ai đó.',
      examples: [
        {
          en: "The old soldier's speech moved the whole room into silence.",
          vi: 'Bài phát biểu của người lính già làm cả căn phòng lặng đi vì xúc động.',
        },
      ],
    },
    {
      index: 5,
      title: 'chính thức đưa ra đề nghị',
      definition: 'Nêu một kiến nghị theo thủ tục trong cuộc họp hoặc cơ quan lập pháp.',
      examples: [
        {
          en: 'She moved that the budget be reviewed before the final vote.',
          vi: 'Bà ấy đề nghị xem xét lại ngân sách trước khi bỏ phiếu cuối cùng.',
        },
      ],
    },
  ],
  nounSenses: [
    {
      index: 1,
      title: 'nước đi, lượt đi (trong trò chơi)',
      definition: 'Một lần đi quân hoặc một lượt hành động của người chơi.',
      examples: [
        {
          en: 'After a long pause, he finally made his move on the board.',
          vi: 'Sau một hồi dừng lại, cuối cùng anh ấy cũng đi nước cờ của mình.',
        },
      ],
    },
    {
      index: 2,
      title: 'bước đi, biện pháp, hành động có tính toán',
      definition: 'Việc làm nhằm đạt một mục tiêu cụ thể.',
      examples: [
        {
          en: 'Lowering prices before the holidays was a bold move by the shop.',
          vi: 'Hạ giá trước kỳ nghỉ lễ là một bước đi táo bạo của cửa hàng.',
        },
      ],
    },
    {
      index: 3,
      title: 'việc dọn đến nơi ở hoặc nơi làm việc mới',
      definition: 'Quá trình chuyển sang chỗ ở hay chỗ làm khác.',
      examples: [
        {
          en: 'The move to the new office is scheduled for early November.',
          vi: 'Việc chuyển sang văn phòng mới được lên lịch vào đầu tháng Mười Một.',
        },
      ],
    },
    {
      index: 4,
      title: 'cử động, động tác',
      definition: 'Sự thay đổi vị trí của cơ thể hay một bộ phận cơ thể.',
      examples: [
        {
          en: 'One wrong move and the whole tower would collapse.',
          vi: 'Chỉ một cử động sai là cả tòa tháp sẽ đổ.',
        },
      ],
    },
  ],
  forms: [
    { label: 'Hiện tại (he/she/it)', value: 'moves' },
    { label: 'Quá khứ', value: 'moved' },
    { label: 'Phân từ II', value: 'moved' },
    { label: 'V-ing', value: 'moving' },
  ],
  origin:
    'Xuất phát từ động từ Latinh movere ("làm chuyển động, khuấy động, gây ra"), du nhập vào tiếng Anh theo dạng cổ movian. Cách dùng với nghĩa "làm xúc động" bắt đầu phổ biến từ khoảng cuối thế kỷ 14.',
  extendedExamples: [
    {
      en: 'The museum will move its collection to a restored warehouse by the river.',
      vi: 'Bảo tàng sẽ chuyển bộ sưu tập sang một nhà kho đã được phục dựng cạnh sông.',
    },
    {
      en: 'Their quiet kindness moved me more than any gift could.',
      vi: 'Sự tử tế lặng lẽ của họ làm tôi cảm động hơn bất kỳ món quà nào.',
    },
    {
      en: "Take your time, but remember it's your move.",
      vi: 'Cứ thong thả, nhưng nhớ là đến lượt bạn rồi.',
    },
  ],
  phrases: [
    {
      phrase: 'move over',
      meaning: 'nhích sang bên, nhường chỗ',
      examples: [
        {
          en: "Could you move over a little? There's room for one more.",
          vi: 'Bạn nhích sang một chút được không? Còn chỗ cho thêm một người.',
        },
      ],
    },
    {
      phrase: 'move away',
      meaning: 'dọn đi nơi khác, rời xa',
      examples: [
        {
          en: 'Many young people move away from the village to find work.',
          vi: 'Nhiều người trẻ rời làng đi nơi khác tìm việc.',
        },
      ],
    },
    {
      phrase: 'move along',
      meaning: 'đi tiếp, đừng dừng lại; tiến triển',
      examples: [
        {
          en: 'The guard told the crowd to move along.',
          vi: 'Người bảo vệ bảo đám đông đi tiếp, đừng dừng lại.',
        },
      ],
    },
    {
      phrase: 'move forward',
      meaning: 'tiến lên phía trước; thúc đẩy tiếp',
      examples: [
        {
          en: "Let's move forward with the plan.",
          vi: 'Hãy tiếp tục thúc đẩy kế hoạch này.',
        },
      ],
    },
    {
      phrase: 'on the move',
      meaning: 'đang di chuyển; đang hoạt động không ngừng',
      examples: [
        {
          en: 'Journalists are always on the move.',
          vi: 'Các nhà báo luôn trong tình trạng di chuyển liên tục.',
        },
      ],
    },
    {
      phrase: 'move with the times',
      meaning: 'bắt kịp thời đại',
      examples: [
        {
          en: 'Businesses must move with the times to survive.',
          vi: 'Doanh nghiệp phải bắt kịp thời đại để tồn tại.',
        },
      ],
    },
    {
      phrase: 'move heaven and earth',
      meaning: 'dốc hết sức lực, làm mọi cách có thể',
      examples: [
        {
          en: "She'd move heaven and earth to protect her children.",
          vi: 'Bà ấy sẵn sàng làm mọi cách để bảo vệ các con.',
        },
      ],
    },
  ],
  synonyms: [
    { word: 'budge', meaning: 'nhúc nhích' },
    { word: 'transfer', meaning: 'chuyển giao, chuyển đi' },
    { word: 'touch', meaning: 'làm động lòng' },
    { word: 'advance', meaning: 'tiến tới' },
    { word: 'propose', meaning: 'đề xuất' },
  ],
  wordFamily: [
    { word: 'motion', meaning: 'sự chuyển động; kiến nghị' },
    { word: 'motionless', meaning: 'bất động' },
    { word: 'immovable', meaning: 'không thể xê dịch' },
    { word: 'remove', meaning: 'loại bỏ, dời đi' },
    { word: 'emotion', meaning: 'cảm xúc' },
  ],
}

/* Tab đang mở trong panel: 'overview' | 'details' */
const activeTab = ref('overview')
</script>

<template>
  <!-- `v-if` instead of `v-show`: a transition can only animate an element that
       is being inserted or removed, and `v-show` only flips `display`. -->
  <Transition name="word-panel">
    <aside
      id="lingo-word-panel"
      v-if="open"
      :class="{ loading }"
      @mousedown.stop
    >
      <!-- Same drawer handle as the settings sidebar: out of the header flow,
           pinned to the right edge and centred vertically. -->
      <button class="panel-close" type="button" aria-label="Đóng" @click="close">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>

      <header class="panel-head">
        <div class="panel-word panel-word--loading" v-show="loading">{{ word }}</div>
        <div class="panel-word" v-show="!loading">{{ word }}</div>
      </header>

      <div class="panel-body">
        <div class="word-popup-spinner" v-show="loading"></div>

        <!-- The same white card the settings sections sit in. -->
        <div class="panel-card" v-show="!loading">
          <div class="word-popup-ipa">{{ ipa }}</div>
          <div v-show="pos" :class="posClass">{{ pos }}</div>
          <div class="word-popup-meaning">{{ meaning }}</div>
        </div>

        <!-- ============ DỮ LIỆU MỞ RỘNG TỪ move muːv.txt ============ -->
        <div class="word-extra" v-show="!loading">
          <!-- Tabs -->
          <div class="word-extra__tabs">
            <button
              type="button"
              :class="['word-extra__tab', { active: activeTab === 'overview' }]"
              @click="activeTab = 'overview'"
            >
              Tổng quan
            </button>
            <button
              type="button"
              :class="['word-extra__tab', { active: activeTab === 'details' }]"
              @click="activeTab = 'details'"
            >
              Chi tiết
            </button>
          </div>

          <!-- Tab Tổng quan: nghĩa + ví dụ + dạng + nguồn gốc -->
          <div v-show="activeTab === 'overview'" class="word-extra__pane">
            <section class="wx-section">
              <h3 class="wx-title">Động từ (v.)</h3>
              <ol class="wx-sense-list">
                <li v-for="s in moveData.verbSenses" :key="s.index" class="wx-sense">
                  <p class="wx-sense__title">{{ s.title }}</p>
                  <p class="wx-sense__def">{{ s.definition }}</p>
                  <ul class="wx-example-list">
                    <li v-for="(ex, i) in s.examples" :key="i" class="wx-example">
                      <p class="wx-example__en">{{ ex.en }}</p>
                      <p class="wx-example__vi">{{ ex.vi }}</p>
                    </li>
                  </ul>
                </li>
              </ol>
            </section>

            <section class="wx-section">
              <h3 class="wx-title">Danh từ (n.)</h3>
              <ol class="wx-sense-list">
                <li v-for="s in moveData.nounSenses" :key="s.index" class="wx-sense">
                  <p class="wx-sense__title">{{ s.title }}</p>
                  <p class="wx-sense__def">{{ s.definition }}</p>
                  <ul class="wx-example-list">
                    <li v-for="(ex, i) in s.examples" :key="i" class="wx-example">
                      <p class="wx-example__en">{{ ex.en }}</p>
                      <p class="wx-example__vi">{{ ex.vi }}</p>
                    </li>
                  </ul>
                </li>
              </ol>
            </section>

            <section class="wx-section">
              <h3 class="wx-title">Các dạng của từ</h3>
              <table class="wx-table">
                <thead>
                  <tr><th>Dạng</th><th>Từ</th></tr>
                </thead>
                <tbody>
                  <tr v-for="f in moveData.forms" :key="f.label">
                    <td>{{ f.label }}</td>
                    <td>{{ f.value }}</td>
                  </tr>
                </tbody>
              </table>
            </section>

            <section class="wx-section">
              <h3 class="wx-title">Nguồn gốc</h3>
              <p class="wx-origin">{{ moveData.origin }}</p>
            </section>
          </div>

          <!-- Tab Chi tiết: ví dụ mở rộng + cụm từ + đồng nghĩa + họ từ -->
          <div v-show="activeTab === 'details'" class="word-extra__pane">
            <section class="wx-section">
              <h3 class="wx-title">Ví dụ mở rộng</h3>
              <ul class="wx-example-list">
                <li v-for="(ex, i) in moveData.extendedExamples" :key="i" class="wx-example">
                  <p class="wx-example__en">{{ ex.en }}</p>
                  <p class="wx-example__vi">{{ ex.vi }}</p>
                </li>
              </ul>
            </section>

            <section class="wx-section">
              <h3 class="wx-title">Cụm từ thường gặp</h3>
              <ul class="wx-phrase-list">
                <li v-for="p in moveData.phrases" :key="p.phrase" class="wx-phrase">
                  <p class="wx-phrase__head">
                    <strong>{{ p.phrase }}</strong>: {{ p.meaning }}
                  </p>
                  <ul class="wx-example-list">
                    <li v-for="(ex, i) in p.examples" :key="i" class="wx-example">
                      <p class="wx-example__en">{{ ex.en }}</p>
                      <p class="wx-example__vi">{{ ex.vi }}</p>
                    </li>
                  </ul>
                </li>
              </ul>
            </section>

            <section class="wx-section">
              <h3 class="wx-title">Từ cùng nghĩa</h3>
              <ul class="wx-inline-list">
                <li v-for="s in moveData.synonyms" :key="s.word">
                  <strong>{{ s.word }}</strong>: {{ s.meaning }}
                </li>
              </ul>
            </section>

            <section class="wx-section">
              <h3 class="wx-title">Từ cùng họ</h3>
              <ul class="wx-inline-list">
                <li v-for="w in moveData.wordFamily" :key="w.word">
                  <strong>{{ w.word }}</strong>: {{ w.meaning }}
                </li>
              </ul>
            </section>
          </div>
        </div>
        <!-- ============ /DỮ LIỆU MỞ RỘNG ============ -->
      </div>

      <footer class="panel-foot" v-show="!loading">
        <div class="container-word">
          <div class="container-word-audio">
            <div class="inside-word-audio">
              <button class="word-popup-audio" v-show="audioUrl" @click="onAudioClick">
                <img :src="audioIcon" alt="Play audio" />
              </button>
            </div>
          </div>
          <div class="container-word-save">
            <div class="inside-word-save">
              <button class="word-popup-btn" :disabled="!canSave" @click="onSave">Save</button>
            </div>
          </div>
        </div>
      </footer>
    </aside>
  </Transition>
</template>
