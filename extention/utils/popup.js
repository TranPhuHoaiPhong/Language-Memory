// ===== API endpoints =====
const WORD_INFO_API = 'http://localhost:3000/api/search';
const SAVE_WORD_API = 'http://localhost:3000/api/save';
const AUDIO_ICON_URL = chrome.runtime.getURL('icons/2.svg');

// ===== API calls =====
async function fetchWordInfo(word, language, subtitle, sourceLanguage) {
  const response = await fetch(WORD_INFO_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ word, language, subtitle, sourceLanguage })
  });
  if (!response.ok) throw new Error('Request failed: ' + response.status);
  return response.json();
}

async function saveWord(data) {
  const response = await fetch(SAVE_WORD_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data })
  });
  if (!response.ok) throw new Error('Request failed: ' + response.status);
  return response.json();
}

// ===== Popup DOM builder =====
function buildPopupSkeleton(wordPopup) {
  wordPopup.innerHTML = `
    <div class="popup-container">

      <div class="popup-content">
        <div class="word-popup-word"></div>
        <div class="word-popup-ipa"></div>
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
    meaningEl: wordPopup.querySelector('.word-popup-meaning'),
    audioEl: wordPopup.querySelector('.word-popup-audio'),
    btnEl: wordPopup.querySelector('.word-popup-btn')
  };
}

// ===== Main popup event initializer =====
function initPopupEvents(
  wordPopup,
  getVideo,
  language,
  getCurrentSubtitle,
  getSourceLanguage
) {
  const { wordEl, ipaEl, meaningEl, audioEl, btnEl } = buildPopupSkeleton(wordPopup);
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
    hidePopup();
  }

  function attachPopupToPlayer() {
    const container = document.querySelector('#player');
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
    const selBottom = selectedRect.bottom;

    // Tính left: căn giữa theo từ được chọn
    let left = (selCenterX - containerRect.left) - popupWidth / 2;
    let top = (selTop - containerRect.top) - popupHeight - 5;

    // Giới hạn left để không tràn ra ngoài container
    const minLeft = 0;
    const maxLeft = containerRect.width - popupWidth;
    left = Math.max(minLeft, Math.min(left, maxLeft));

    wordPopup.style.left = left + 'px';
    wordPopup.style.top = top + 'px';
    wordPopup.style.visibility = 'visible';
  }

  async function loadWordInfo(word) {
    const subtitle = getCurrentSubtitle();
    const sourceLanguage = getSourceLanguage();
    const currentRequestId = ++requestId;

    wordEl.textContent = 'Loading...';
    ipaEl.textContent = '';
    meaningEl.textContent = '';
    audioEl.style.display = 'none';
    btnEl.disabled = true;
    wordPopup.classList.add('loading');
    positionPopup();

    try {
      const data = await fetchWordInfo(word, language, subtitle, sourceLanguage);
      if (currentRequestId !== requestId) return;
      wordPopup.classList.remove('loading');
      wordEl.textContent = data.data.word || word;
      ipaEl.textContent = data.data.ipa || '';
      meaningEl.textContent = data.data.meaning || '';
      currentAudioUrl = data.data.audio || '';
      audioEl.style.display = 'block';
      currentWordData = {
        word: data.data.word || word,
        ipa: data.data.ipa || '',
        meaning: data.data.meaning || '',
        subtitle: getCurrentSubtitle(),
        language,
        sourceLanguage,
        audio: data.data.audio || ''
      };
    } catch (err) {
      if (currentRequestId !== requestId) return;
      wordPopup.classList.remove('loading');
      wordEl.textContent = 'Failed';
      ipaEl.textContent = '';
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
  btnEl.addEventListener('click', async (e) => {
    e.stopPropagation();
    if (!currentWordData) return;
    try {
      // For demo: open Facebook instead of saving
    //   window.open('https://facebook.com', '_blank');
    alert("lưu")
    } catch (err) {
      console.error(err);
      alert('Lưu thất bại');
    }
  });

  // Prevent popup from losing focus
  wordPopup.addEventListener('mousedown', (e) => e.preventDefault());

  // Mouseup selection handling
  document.addEventListener('mouseup', (e) => {
    if (e.target.closest('#word-popup')) return;
    const video = getVideo();
    if (video && !video.paused) {
      hidePopupSafe();
      window.getSelection().removeAllRanges();
      return;
    }
    const selection = window.getSelection();
    if (!selection.rangeCount) {
      hidePopupSafe();
      return;
    }
    const text = selection.toString().trim();
    if (!text) {
      hidePopupSafe();
      return;
    }
    const range = selection.getRangeAt(0);
    const anchorNode = selection.anchorNode;
    const anchorElement = anchorNode
      ? (anchorNode.nodeType === 3 ? anchorNode.parentElement : anchorNode)
      : null;
    const subOriginalEl = anchorElement ? anchorElement.closest('.sub-original') : null;
    if (!subOriginalEl) {
      hidePopupSafe();
      return;
    }
    selectedText = text;
    selectedRect = range.getBoundingClientRect();
    loadWordInfo(text);
  });

  // Selection change to hide popup if not on subtitle
  document.addEventListener('selectionchange', () => {
    const selection = window.getSelection();
    const text = selection.toString().trim();
    const anchorNode = selection.anchorNode;
    const anchorElement = anchorNode
      ? (anchorNode.nodeType === 3 ? anchorNode.parentElement : anchorNode)
      : null;
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
  });

  // Click outside to hide
  document.addEventListener('mousedown', (e) => {
    if (!e.target.closest('#word-popup') && !e.target.closest('.sub-original')) {
      hidePopupSafe();
      window.getSelection().removeAllRanges();
    }
  });

  // Press Enter to hide
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      hidePopupSafe();
      window.getSelection().removeAllRanges();
    }
  });

  // Reposition on container resize
  const resizeObserver = new ResizeObserver(() => {
    if (wordPopup.style.display === 'block') {
      positionPopup();
    }
  });
  const container = document.querySelector('#player');
  if (container) resizeObserver.observe(container);

  // Audio play
  audioEl.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!currentAudioUrl) return;
    audioPlayer.pause();
    audioPlayer.currentTime = 0;
    audioPlayer.src = currentAudioUrl;
    audioPlayer.play();
  });
}