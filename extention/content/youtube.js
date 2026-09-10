// content/youtube.js

// ===== DOM elements =====
const wordPopup = document.createElement('div');
wordPopup.id = 'word-popup';
document.body.appendChild(wordPopup);

const subtitleDiv = document.createElement('div');
subtitleDiv.id = 'subtitle-translate';
subtitleDiv.style.position = 'absolute';
subtitleDiv.style.pointerEvents = 'none';
subtitleDiv.style.userSelect = 'none';

// ---- Drag handle ----
const dragHandle = document.createElement('div');
dragHandle.className = 'subtitle-drag-handle';
dragHandle.textContent = '⠿';
dragHandle.style.cssText = `
  position: absolute;
  top: -18px;
  left: 50%;
  transform: translateX(-50%);
  width: 36px;
  height: 14px;
  background: rgba(0,0,0,0.45);
  border-radius: 8px;
  cursor: grab;
  z-index: 20;
  font-size: 12px;
  line-height: 14px;
  text-align: center;
  color: rgba(255,255,255,0.9);
  user-select: none;
  opacity: 0;
  pointer-events: auto;
  transition: opacity 0.2s;
`;
dragHandle.addEventListener('mouseenter', () => dragHandle.style.opacity = '1');
dragHandle.addEventListener('mouseleave', () => {
  if (!isDragging) dragHandle.style.opacity = '0';
});
subtitleDiv.appendChild(dragHandle);

// ---- Content container (giữ nội dung phụ đề) ----
const contentDiv = document.createElement('div');
contentDiv.className = 'subtitle-content';
contentDiv.style.userSelect = 'text';
subtitleDiv.appendChild(contentDiv);

// ---- Hover trên toàn bộ subtitleDiv để hiện/ẩn nút kéo ----
subtitleDiv.addEventListener('mouseenter', () => {
  dragHandle.style.opacity = '0.5';
});
subtitleDiv.addEventListener('mouseleave', () => {
  if (!isDragging) {
    dragHandle.style.opacity = '0';
  }
});

// ===== Drag state =====
let dragPosition = null;
let isDragging = false;
let dragData = null;

// Load saved position
try {
  const saved = localStorage.getItem('subtitlePosition');
  if (saved) {
    const pos = JSON.parse(saved);
    if (pos.topRatio !== undefined) {
      dragPosition = pos;
    }
  }
} catch (e) {}

// ===== State =====
let lastHeight = 0;
let subtitlesData = [];
let lastSubtitle = null;
let currentIndex = 0;
let loading = false;
let currentVideoId = null;
let sourceLanguage = '';

let targetLanguage = 'en';   
let nativeLanguage = 'en'; 

// ===== DOM helpers =====
function attachSubtitle() {
  const container = document.querySelector('.html5-video-player');
  if (!container) return false;
  if (!container.contains(subtitleDiv)) {
    container.appendChild(subtitleDiv);
  }
  return true;
}

function updateSubtitlePosition() {
  const video = getVideo();
  if (!video) return;
  const container = document.querySelector('.html5-video-player');
  if (!container) return;

  if (video.clientHeight !== lastHeight) {
    lastHeight = video.clientHeight;
    const fontSize = Math.max(18, Math.round(lastHeight * 0.04));
    subtitleDiv.style.fontSize = fontSize + 'px';
  }

  subtitleDiv.style.left = '50%';
  subtitleDiv.style.transform = 'translateX(-50%)';

  if (dragPosition) {
    const containerHeight = container.clientHeight;
    const subHeight = subtitleDiv.offsetHeight;
    const maxTop = Math.max(0, containerHeight - subHeight);
    let top = dragPosition.topRatio * containerHeight;
    top = Math.max(0, Math.min(top, maxTop));

    subtitleDiv.style.top = top + 'px';
    subtitleDiv.style.bottom = 'auto';
  } else {
    const fontSize = parseFloat(subtitleDiv.style.fontSize) || 18;
    subtitleDiv.style.bottom = fontSize + 'px';
    subtitleDiv.style.top = 'auto';
  }
}

function showSubtitle(subtitles) {
  subtitlesData = subtitles;
  lastSubtitle = null;
  currentIndex = 0;
  contentDiv.innerHTML = '';
}

function showMessage(message) {
  attachSubtitle();
  updateSubtitlePosition();
  const text = message || 'Loading';
  contentDiv.innerHTML = `
    <div class="sub-original">${text}</div>
    <div class="sub-translated">${text}</div>
  `;
}

function hidePopup() {
  wordPopup.style.display = 'none';
}

// ===== Subtitle rendering loop =====
function updateLoop() {
  attachSubtitle();
  if (loading) {
    requestAnimationFrame(updateLoop);
    return;
  }
  const video = getVideo();
  if (!video) {
    requestAnimationFrame(updateLoop);
    return;
  }
  updateSubtitlePosition();

  const current = video.currentTime;
  while (currentIndex < subtitlesData.length - 1 && current > subtitlesData[currentIndex].end) {
    currentIndex++;
  }
  while (currentIndex > 0 && current < subtitlesData[currentIndex].start) {
    currentIndex--;
  }

  const currentSubtitle =
    subtitlesData[currentIndex] &&
    current >= subtitlesData[currentIndex].start &&
    current <= subtitlesData[currentIndex].end
      ? subtitlesData[currentIndex]
      : null;

  if (currentSubtitle !== lastSubtitle) {
    lastSubtitle = currentSubtitle;
    contentDiv.innerHTML = currentSubtitle
      ? `
        <div class="sub-original">${renderLines(currentSubtitle.original)}</div>
        <div class="sub-translated">${renderLines(currentSubtitle.translated)}</div>
      `
      : '';
  }

  requestAnimationFrame(updateLoop);
}

// ===== Transcript loading =====

async function loadLanguage() {
  const stored = await new Promise(resolve => {
    chrome.storage.sync.get(
      ['target_language', 'native_language'],
      resolve
    );
  });

  targetLanguage = stored.target_language || 'en';
  nativeLanguage = stored.native_language || 'en';
}

async function loadTranscript() {
  const videoId = new URL(location.href).searchParams.get('v');
  if (!videoId || videoId === currentVideoId) return;

  currentVideoId = videoId;
  showSubtitle([]);

  // Hiện trạng thái đang tạo subtitle
  loading = true;
  showMessage('Generating');

  try {
    // Gọi hàm API mới để lấy dữ liệu
    const result = await fetchTranscriptData(
      videoId,
      targetLanguage,
      nativeLanguage,
      (status) => {
        // Có thể truyền callback để cập nhật UI nếu cần
      }
    );

    sourceLanguage = result.sourceLanguage;

    if (result.noTranslation) {
      loading = false;
      showSubtitle([]);
      showMessage('');
      contentDiv.querySelectorAll('.sub-line').forEach(el => {
        el.style.padding = '0';
      });
      return;
    }

    // Nếu có dữ liệu phụ đề
    loading = false;
    showSubtitle(result.subtitles);
  } catch (err) {
    loading = false;
    showSubtitle([]);
    showMessage(err.message || 'Error loading transcript');
  }
}

// ===== Observers =====
const observer = new ResizeObserver(() => updateSubtitlePosition());
const video = getVideo();
if (video) {
  observer.observe(video);
  video.addEventListener('play', () => {
    hidePopup();
    if (window.audioPlayer) {
        window.audioPlayer.pause();
        window.audioPlayer.currentTime = 0;
    }
    window.getSelection().removeAllRanges();
  });
}
const playerContainer = document.querySelector('.html5-video-player');
if (playerContainer) {
  observer.observe(playerContainer);
}
 
// ===== Navigation =====
document.addEventListener('yt-navigate-finish', loadTranscript);

// ===== Init =====
injectCss();
updateLoop();

(async () => {
  await loadLanguage();

  initPopupEvents(
  wordPopup,
  getVideo,
  nativeLanguage,          
  () => lastSubtitle,
  () => targetLanguage    
);
  loadTranscript();
})();

// ============================================================
// ===== DRAG SUBTITLE EVENTS =====
// ============================================================

dragHandle.addEventListener('mousedown', function(e) {
  e.preventDefault();
  e.stopPropagation();
  const container = document.querySelector('.html5-video-player');
  if (!container) return;
  const subRect = subtitleDiv.getBoundingClientRect();
  const offsetY = e.clientY - subRect.top;
  dragData = { offsetY };
  isDragging = true;
  dragHandle.style.cursor = 'grabbing';
  subtitleDiv.style.cursor = 'grabbing';
});

document.addEventListener('mousemove', function(e) {
  if (!dragData) return;
  const container = document.querySelector('.html5-video-player');
  if (!container) return;
  const containerRect = container.getBoundingClientRect();

  let newTop = e.clientY - containerRect.top - dragData.offsetY;

  const subHeight = subtitleDiv.offsetHeight;
  const maxTop = Math.max(0, containerRect.height - subHeight);
  newTop = Math.max(0, Math.min(newTop, maxTop));

  dragPosition = { topRatio: newTop / containerRect.height };

  subtitleDiv.style.top = newTop + 'px';
  subtitleDiv.style.bottom = 'auto';
});

document.addEventListener('mouseup', function(e) {
  if (dragData) {
    e.stopPropagation();
    e.preventDefault();

    dragData = null;
    isDragging = false;
    dragHandle.style.cursor = 'grab';
    subtitleDiv.style.cursor = 'default';

    if (dragPosition) {
      localStorage.setItem('subtitlePosition', JSON.stringify(dragPosition));
    }

    // Ẩn lại nút kéo nếu chuột không còn hover trên subtitle lẫn trên chính nút
    if (!subtitleDiv.matches(':hover') && !dragHandle.matches(':hover')) {
      dragHandle.style.opacity = '0';
    }
  }
}, true);

document.addEventListener('selectionchange', function(e) {
  if (isDragging) {
    return;
  }
}, true);
