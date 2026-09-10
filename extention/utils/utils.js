// utils/utils.js

// ===== Constants =====
const AUDIO_ICON_URL = chrome.runtime.getURL('icons/2.svg');

// ===== Utilities =====

function getVideo() {
  return document.querySelector('video.html5-main-video');
}

function renderLines(text) {
  if (!text) return '';
  return text
    .split(/\r?\n/)
    .map(line => `<div class="sub-line">${line}</div>`)
    .join('');
}

async function downloadTranscript(url, language, lang, videoId) {
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Failed to fetch transcript');
  const text = await res.text();
  return sendTranscript(text, language, lang, videoId);
}

// ===== Popup DOM builder =====
function buildPopupSkeleton(wordPopup) {
  wordPopup.innerHTML = `
    <div class="popup-container">
      <div class="popup-content">
        <div class="word-popup-spinner"></div>
        <div class="word-popup-word"></div>
        <div class="word-popup-ipa"></div>
        <div class="word-popup-pos"></div>
        <div class="word-popup-space"></div>
        <div class="word-popup-meaning"></div>
      </div>
      <div class="container-word">
        <div class="container-word-audio">
          <div class="inside-word-audio">
            <button class="word-popup-audio">
              <img src="${AUDIO_ICON_URL}" alt="Play audio">
            </button>
          </div>
        </div>
        <div class="container-word-save">
          <div class="inside-word-save">
            <button class="word-popup-btn">Save</button>
          </div>
        </div>
      </div>
    </div>
  `;
  return {
    wordEl: wordPopup.querySelector('.word-popup-word'),
    ipaEl: wordPopup.querySelector('.word-popup-ipa'),
    posEl: wordPopup.querySelector('.word-popup-pos'),
    meaningEl: wordPopup.querySelector('.word-popup-meaning'),
    audioEl: wordPopup.querySelector('.word-popup-audio'),
    btnEl: wordPopup.querySelector('.word-popup-btn'),
    spinnerEl: wordPopup.querySelector('.word-popup-spinner')
  };
}

/**
 * Mở rộng range để bao trọn các từ ở cả hai đầu.
 * Sửa đổi trực tiếp range được truyền vào.
 */
function expandRangeToWords(range) {
  // Xử lý start
  let startNode = range.startContainer;
  if (startNode.nodeType === Node.TEXT_NODE) {
    const text = startNode.textContent;
    const offset = range.startOffset;
    const wordRegex = /[\w'-]+/g;
    let match;
    let wordStart = -1;
    while ((match = wordRegex.exec(text)) !== null) {
      const start = match.index;
      const end = match.index + match[0].length;
      if (start <= offset && offset <= end) {
        wordStart = start;
        break;
      }
    }
    if (wordStart !== -1) {
      range.setStart(startNode, wordStart);
    }
  } else {
    // Nếu không phải text node, lấy text node đầu tiên bên trong
    const walker = document.createTreeWalker(startNode, NodeFilter.SHOW_TEXT, null, false);
    const firstText = walker.nextNode();
    if (firstText) {
      range.setStart(firstText, 0);
    }
  }

  // Xử lý end
  let endNode = range.endContainer;
  if (endNode.nodeType === Node.TEXT_NODE) {
    const text = endNode.textContent;
    const offset = range.endOffset;
    const wordRegex = /[\w'-]+/g;
    let match;
    let wordEnd = -1;
    while ((match = wordRegex.exec(text)) !== null) {
      const start = match.index;
      const end = match.index + match[0].length;
      if (start <= offset && offset <= end) {
        wordEnd = end;
        break;
      }
    }
    if (wordEnd !== -1) {
      range.setEnd(endNode, wordEnd);
    }
  } else {
    // Nếu không phải text node, lấy text node cuối cùng bên trong
    const walker = document.createTreeWalker(endNode, NodeFilter.SHOW_TEXT, null, false);
    let lastText = null;
    let node;
    while ((node = walker.nextNode()) !== null) {
      lastText = node;
    }
    if (lastText) {
      range.setEnd(lastText, lastText.textContent.length);
    }
  }

  return range;
}

// ===== Main popup event initializer =====
function initPopupEvents(
  wordPopup,
  getVideo,
  language,
  getCurrentSubtitle,
  getSourceLanguage
) {
  // ================================================================
  // FIX #1: initPopupEvents() có thể bị gọi lại nhiều lần (mỗi lần
  // reload, mỗi lần chuyển video trên YouTube SPA). Nếu không dọn
  // dẹp, các listener document-level của lần gọi trước vẫn còn,
  // chồng lên listener mới -> hành vi xung đột, khó lường. Trước khi
  // gắn listener mới, chủ động gỡ bộ cũ (nếu có).
  // ================================================================
  if (typeof window.__subtitlePopupCleanup === 'function') {
    try {
      window.__subtitlePopupCleanup();
    } catch (err) {
      console.warn('[subtitle-popup] cleanup lần trước thất bại:', err);
    }
  }

  // --- Thêm style để vô hiệu hóa bôi đen trên sub-translated + spinner ---
  if (!document.getElementById('subtitle-translate-style')) {
    const style = document.createElement('style');
    style.id = 'subtitle-translate-style';
    style.textContent = `
      .sub-translated {
        user-select: none !important;
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
      }
      .sub-original {
        -webkit-user-drag: none;
      }

      /* ===== Spinner khi đang tải thông tin từ ===== */
      .word-popup-spinner {
        display: none;
        width: 20px;
        height: 20px;
        margin: 8px auto;
        border: 2px solid rgba(255, 255, 255, 0.25);
        border-top-color: rgba(255, 255, 255, 0.95);
        border-radius: 50%;
        animation: word-popup-spin 0.7s linear infinite;
      }
      @keyframes word-popup-spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }

  const { wordEl, ipaEl, posEl, meaningEl, audioEl, btnEl, spinnerEl } = buildPopupSkeleton(wordPopup);
  let selectedText = '';
  let selectedRect = null;
  let requestId = 0;
  let currentAudioUrl = '';
  const audioPlayer = new Audio();
  window.audioPlayer = audioPlayer;
  let currentWordData = null;

  function hidePopupSafe() {
    requestId++;
    if (window.audioPlayer) {
        window.audioPlayer.pause();
        window.audioPlayer.currentTime = 0;
    }
    hidePopup(); // hidePopup được định nghĩa trong youtube.js
  }

  // ================================================================
  // FIX #3 (fullscreen): Trước đây popup luôn được gắn vào `#player`.
  // Khi YouTube vào chế độ fullscreen thật sự (Fullscreen API), trình
  // duyệt chỉ đưa `.html5-video-player` (hoặc phần tử cha khác) vào
  // fullscreen element -- `#player` KHÔNG nằm trong fullscreen layer
  // đó -> word-popup tuy vẫn có trong DOM nhưng bị render "phía sau"
  // lớp fullscreen, coi như không hiện ra được.
  // Cách sửa: ưu tiên gắn popup vào document.fullscreenElement khi
  // đang fullscreen, nếu không có thì fallback về .html5-video-player
  // rồi mới đến #player (giữ hành vi cũ cho chế độ bình thường).
  // ================================================================
  function attachPopupToPlayer() {
    const container =
      document.fullscreenElement ||
      document.querySelector('.html5-video-player') ||
      document.querySelector('#player');

    if (!container) return null;
    if (getComputedStyle(container).position === 'static') {
      container.style.position = 'relative';
    }
    if (!container.contains(wordPopup)) {
      container.appendChild(wordPopup);
    }
    return container;
  }

  function positionPopup() {
    const container = attachPopupToPlayer();
    if (!container || !selectedRect) return;
    const containerRect = container.getBoundingClientRect();

    wordPopup.style.visibility = 'hidden';
    wordPopup.style.display = 'flex';

    const popupWidth = wordPopup.offsetWidth;
    const popupHeight = wordPopup.offsetHeight;

    const selCenterX = selectedRect.left + selectedRect.width / 2;
    const selTop = selectedRect.top;

    let left = (selCenterX - containerRect.left) - popupWidth / 2;
    let top = (selTop - containerRect.top) - popupHeight - 5;

    const minLeft = 0;
    const maxLeft = containerRect.width - popupWidth;
    left = Math.max(minLeft, Math.min(left, maxLeft));

    wordPopup.style.left = left + 'px';
    wordPopup.style.top = top + 'px';
    wordPopup.style.visibility = 'visible';
  }

  // ---- Bật/tắt trạng thái spinner, ẩn/hiện các dòng nội dung ----
  function setLoadingUI(isLoading) {
    spinnerEl.style.display = isLoading ? 'block' : 'none';
    wordEl.style.display = isLoading ? 'none' : '';
    ipaEl.style.display = isLoading ? 'none' : '';
    posEl.style.display = isLoading ? 'none' : (posEl.dataset.hasPos === '1' ? 'block' : 'none');
    meaningEl.style.display = isLoading ? 'none' : '';
  }

  async function loadWordInfo(word) {
    const subtitle = getCurrentSubtitle();
    const sourceLanguage = getSourceLanguage();
    const currentRequestId = ++requestId;

    wordEl.textContent = '';
    ipaEl.textContent = '';
    posEl.textContent = '';
    meaningEl.textContent = '';
    audioEl.style.display = 'none';
    btnEl.disabled = true;
    wordPopup.classList.add('Loading');
    setLoadingUI(true);
    positionPopup();

    try {
      const data = await fetchWordInfo(word, language, subtitle, sourceLanguage);

      if (currentRequestId !== requestId) return;

      wordPopup.classList.remove('Loading');
      wordEl.textContent = data.data.word || word;

      const ipa = data.data.ipa || '';
      ipaEl.textContent = ipa ? `/${ipa}/` : '';

      const pos = data.data.pos || '';

      posEl.textContent = pos ? `[${pos}]` : '';
      posEl.className = 'word-popup-pos';

      if (pos) {
        posEl.classList.add(`pos-${pos.toLowerCase()}`);
        posEl.dataset.hasPos = '1';
      } else {
        posEl.dataset.hasPos = '0';
      }

      meaningEl.textContent = data.data.meaning || '';

      setLoadingUI(false);

      currentAudioUrl = data.data.audio || '';
      audioEl.style.display = 'block';
      currentWordData = {
        word: data.data.word || word,
        ipa: data.data.ipa || '',
        pos: data.data.pos || '',
        meaning: data.data.meaning || '',
        subtitle: getCurrentSubtitle(),
        language,
        sourceLanguage,
        audio: data.data.audio || ''
      };
      // ================================
      // AUTO PLAY AUDIO
      // ================================

      if (currentAudioUrl) {
        setTimeout(() => {
          // Kiểm tra request này còn hợp lệ
          if (currentRequestId !== requestId) return;

          audioPlayer.pause();
          audioPlayer.currentTime = 0;
          audioPlayer.src = currentAudioUrl;

          audioPlayer.play().catch(err => {
            console.warn('[AUDIO] Auto play failed:', err);
          });
        }, 300);
      }

    } catch (err) {
      if (currentRequestId !== requestId) return;
      wordPopup.classList.remove('Loading');
      setLoadingUI(false);
      wordEl.textContent = 'Failed';
      ipaEl.textContent = '';
      posEl.textContent = '';
      meaningEl.textContent = '';
      audioEl.style.display = 'none';
    } finally {
      if (currentRequestId === requestId) {
        btnEl.disabled = false;
        positionPopup();
      }
    }
  }

  // Save button
  const handleSaveClick = async (e) => {
    e.stopPropagation();
    if (!currentWordData) return;
    try {
      await saveWord(currentWordData);
      alert('Saved successfully!');
    } catch (err) {
      console.error(err);
      alert('Save failed');
    }
  };
  btnEl.addEventListener('click', handleSaveClick);

  const handleAudioClick = (e) => {
    e.stopPropagation();
    if (!currentAudioUrl) return;
    audioPlayer.pause();
    audioPlayer.currentTime = 0;
    audioPlayer.src = currentAudioUrl;
    audioPlayer.play();
  };
  audioEl.addEventListener('click', handleAudioClick);

  // ================================================================
  // Xoá selection cũ khi mousedown xảy ra NGAY BÊN TRONG vùng đang
  // bôi đen (cho phép bôi đen mới đè lên vùng cũ, ví dụ đang chọn
  // "big", kéo tiếp thành "big ideas").
  // ================================================================
  const handleMouseDownClearOverlapSelection = (e) => {
    if (e.target.closest('input, textarea, [contenteditable="true"]')) return;
    if (e.target.closest('#word-popup')) return;

    const subOriginalEl = e.target.closest('.sub-original');
    if (!subOriginalEl) return;

    const selection = window.getSelection();
    if (!selection.rangeCount || selection.isCollapsed) return;

    const range = selection.getRangeAt(0);
    const rects = range.getClientRects();
    for (let i = 0; i < rects.length; i++) {
      const r = rects[i];
      if (
        e.clientX >= r.left && e.clientX <= r.right &&
        e.clientY >= r.top && e.clientY <= r.bottom
      ) {
        selection.removeAllRanges();
        break;
      }
    }
  };
  document.addEventListener('mousedown', handleMouseDownClearOverlapSelection, true);

  // Theo dõi vị trí mousedown để phân biệt click đơn với kéo chọn
  let mouseDownX = 0;
  let mouseDownY = 0;
  const CLICK_MOVE_THRESHOLD = 4; // px

  const handleMouseDownTrackPosition = (e) => {
    mouseDownX = e.clientX;
    mouseDownY = e.clientY;
  };
  document.addEventListener('mousedown', handleMouseDownTrackPosition);

  // ================================================================
  // FIX #2: Trước đây, nếu video đang phát (ví dụ do autoplay ngay
  // sau khi reload trang) và người dùng CHỈ click 1 cái (không kéo)
  // vào từ trong phụ đề, code sẽ thoát sớm ở nhánh
  // `if (video && !video.paused)` TRƯỚC KHI kịp xử lý từ được click,
  // khiến "nhấp 1 lần vào chữ không có phản ứng gì".
  // Cách sửa: chỉ coi video-đang-phát là lý do bỏ qua khi điểm click
  // KHÔNG nằm trong .sub-original. Nếu click nằm trong phụ đề, chủ
  // động pause video rồi vẫn tiếp tục xử lý tra từ bình thường.
  // ================================================================
  const handleMouseUp = (e) => {
    if (e.target.closest('input, textarea, [contenteditable="true"]')) return;
    if (e.target.closest('#word-popup')) return;

    const video = getVideo();
    const targetSubOriginal = e.target.closest('.sub-original');

    // Video đang phát VÀ điểm click không nằm trong phụ đề gốc
    // -> người dùng đang thao tác với video, không phải tra từ.
    if (video && !video.paused && !targetSubOriginal) {
      hidePopupSafe();
      window.getSelection().removeAllRanges();
      return;
    }

    // Video đang phát nhưng điểm click NẰM TRONG phụ đề gốc (ví dụ
    // click đơn ngay sau khi trang vừa autoplay) -> pause video tại
    // đây, rồi tiếp tục xử lý tra từ như bình thường bên dưới.
    if (video && !video.paused && targetSubOriginal) {
      video.pause();
    }

    const dx = e.clientX - mouseDownX;
    const dy = e.clientY - mouseDownY;
    const movedDistance = Math.sqrt(dx * dx + dy * dy);
    const isPlainClick = movedDistance < CLICK_MOVE_THRESHOLD;

    const selection = window.getSelection();
    let range;

    if (isPlainClick) {
      // Click đơn: không tin selection hiện tại, luôn lấy từ đúng
      // tại điểm click bằng caretRangeFromPoint.
      const targetEl = e.target.closest('.sub-original');
      if (!targetEl) {
        hidePopupSafe();
        selection.removeAllRanges();
        return;
      }

      let caretRange = null;
      if (document.caretRangeFromPoint) {
        caretRange = document.caretRangeFromPoint(e.clientX, e.clientY);
      } else if (document.caretPositionFromPoint) {
        const pos = document.caretPositionFromPoint(e.clientX, e.clientY);
        if (pos) {
          caretRange = document.createRange();
          caretRange.setStart(pos.offsetNode, pos.offset);
          caretRange.collapse(true);
        }
      }

      if (!caretRange) {
        hidePopupSafe();
        selection.removeAllRanges();
        return;
      }

      selection.removeAllRanges();
      selection.addRange(caretRange);
      range = caretRange;
    } else {
      // Có kéo chuột thật sự -> dùng selection người dùng vừa tạo
      if (!selection.rangeCount || !selection.toString().trim()) {
        hidePopupSafe();
        return;
      }
      range = selection.getRangeAt(0);
    }

    // Kiểm tra range có nằm trong .sub-original không
    const startNode = range.startContainer;
    const startElement = startNode
      ? (startNode.nodeType === 3 ? startNode.parentElement : startNode)
      : null;
    const subOriginalEl = startElement ? startElement.closest('.sub-original') : null;
    if (!subOriginalEl) {
      hidePopupSafe();
      return;
    }

    // Mở rộng range thành trọn từ, cập nhật lại selection hiển thị
    const expandedRange = expandRangeToWords(range);
    if (expandedRange) {
      selection.removeAllRanges();
      selection.addRange(expandedRange);
      range = expandedRange;
    }

    const text = selection.toString().trim();
    if (!text) {
      hidePopupSafe();
      return;
    }
    const rect = range.getBoundingClientRect();

    selectedText = text;
    selectedRect = rect;
    loadWordInfo(text);
  };
  document.addEventListener('mouseup', handleMouseUp);

  const handleWordPopupMouseDown = (e) => e.preventDefault();
  wordPopup.addEventListener('mousedown', handleWordPopupMouseDown);

  const handleSelectionChange = () => {
    const selection = window.getSelection();
    const text = selection.toString().trim();
    const anchorNode = selection.anchorNode;
    const anchorElement = anchorNode
      ? (anchorNode.nodeType === 3 ? anchorNode.parentElement : anchorNode)
      : null;

    if (anchorElement && anchorElement.closest('input, textarea, [contenteditable="true"]')) return;
    if (anchorElement && anchorElement.closest('#word-popup')) return;

    if (!text) {
      hidePopupSafe();
      return;
    }
    if (!anchorElement || !anchorElement.closest('.sub-original')) return;
    const video = getVideo();
    if (video && !video.paused) {
      video.pause();
    }
    if (!window.getSelection().toString().trim()) {
      hidePopupSafe();
    }
  };
  document.addEventListener('selectionchange', handleSelectionChange);

  const handleOutsideMouseDown = (e) => {
    if (e.target.closest('input, textarea, [contenteditable="true"]')) return;
    if (!e.target.closest('#word-popup') && !e.target.closest('.sub-original')) {
      hidePopupSafe();
      window.getSelection().removeAllRanges();
    }
  };
  document.addEventListener('mousedown', handleOutsideMouseDown);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      hidePopupSafe();
      window.getSelection().removeAllRanges();
    }
  };
  document.addEventListener('keydown', handleKeyDown);

  const resizeObserver = new ResizeObserver(() => {
    if (wordPopup.style.display === 'block') {
      positionPopup();
    }
  });
  const container = document.querySelector('#player');
  if (container) resizeObserver.observe(container);

  const handleTripleClick = (e) => {
    if (e.detail >= 3 && e.target.closest('.sub-original')) {
      e.preventDefault();                 // Ngăn trình duyệt chọn văn bản
      window.getSelection().removeAllRanges(); // Xóa selection ngay lập tức
      hidePopupSafe();                    // Ẩn popup nếu đang hiển thị
      setTimeout(() => {
        window.getSelection().removeAllRanges();
      }, 0);
    }
  };
  document.addEventListener('mousedown', handleTripleClick, true);

  // ================================================================
  // FIX #3 (fullscreen) tiếp theo: khi người dùng bật/tắt fullscreen,
  // phần tử "container thật" thay đổi (#player <-> fullscreenElement),
  // nên cần re-attach popup vào đúng container mới ngay lập tức, và
  // tính lại vị trí nếu popup đang hiển thị.
  // ================================================================
  const handleFullscreenChange = () => {
    attachPopupToPlayer();
    if (wordPopup.style.display === 'flex' && selectedRect) {
      positionPopup();
    }
  };
  document.addEventListener('fullscreenchange', handleFullscreenChange);

  // ================================================================
  // Đăng ký hàm dọn dẹp cho lần initPopupEvents() TIẾP THEO, đảm bảo
  // không bao giờ có 2 bộ listener document-level tồn tại song song.
  // ================================================================
  window.__subtitlePopupCleanup = () => {
    document.removeEventListener('mousedown', handleMouseDownClearOverlapSelection, true);
    document.removeEventListener('mousedown', handleMouseDownTrackPosition);
    document.removeEventListener('mouseup', handleMouseUp);
    document.removeEventListener('selectionchange', handleSelectionChange);
    document.removeEventListener('mousedown', handleOutsideMouseDown);
    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('mousedown', handleTripleClick, true);
    document.removeEventListener('fullscreenchange', handleFullscreenChange);
    resizeObserver.disconnect();
  };
}