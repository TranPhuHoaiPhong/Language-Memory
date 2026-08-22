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
  const { wordEl, ipaEl, posEl, meaningEl, audioEl, btnEl } = buildPopupSkeleton(wordPopup);
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

    let left = (selCenterX - containerRect.left) - popupWidth / 2;
    let top = (selTop - containerRect.top) - popupHeight - 5;

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
    posEl.textContent = '';
    meaningEl.textContent = '';
    audioEl.style.display = 'none';
    btnEl.disabled = true;
    wordPopup.classList.add('Loading');
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
        posEl.style.display = 'block';
      } else {
        posEl.style.display = 'none';
      }
      

      if (pos) {
        posEl.classList.add(`pos-${pos.toLowerCase()}`);
      }
      meaningEl.textContent = data.data.meaning || '';
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
    } catch (err) {
      if (currentRequestId !== requestId) return;
      wordPopup.classList.remove('loading');
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
  btnEl.addEventListener('click', async (e) => {
    e.stopPropagation();
    if (!currentWordData) return;
    try {
      // Thay vì alert, có thể gọi saveWord
      await saveWord(currentWordData);
      alert('Saved successfully!');
    } catch (err) {
      console.error(err);
      alert('Save failed');
    }
  });

  document.addEventListener('mouseup', (e) => {
    if (e.target.closest('input, textarea, [contenteditable="true"]')) return;
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

  wordPopup.addEventListener('mousedown', (e) => e.preventDefault());

  document.addEventListener('selectionchange', () => {
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
  });

  document.addEventListener('mousedown', (e) => {
    if (e.target.closest('input, textarea, [contenteditable="true"]')) return;
    if (!e.target.closest('#word-popup') && !e.target.closest('.sub-original')) {
      hidePopupSafe();
      window.getSelection().removeAllRanges();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      hidePopupSafe();
      window.getSelection().removeAllRanges();
    }
  });

  const resizeObserver = new ResizeObserver(() => {
    if (wordPopup.style.display === 'block') {
      positionPopup();
    }
  });
  const container = document.querySelector('#player');
  if (container) resizeObserver.observe(container);

  audioEl.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!currentAudioUrl) return;
    audioPlayer.pause();
    audioPlayer.currentTime = 0;
    audioPlayer.src = currentAudioUrl;
    audioPlayer.play();
  });
}