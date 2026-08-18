// ===== DOM elements =====
const wordPopup = document.createElement('div');
wordPopup.id = 'word-popup';
document.body.appendChild(wordPopup);

const subtitleDiv = document.createElement('div');
subtitleDiv.id = 'subtitle-translate';
subtitleDiv.style.position = 'absolute';
subtitleDiv.style.pointerEvents = 'auto';
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
  opacity: 0.5;
  transition: opacity 0.2s;
`;
dragHandle.addEventListener('mouseenter', () => dragHandle.style.opacity = '1');
dragHandle.addEventListener('mouseleave', () => dragHandle.style.opacity = '0.5');
subtitleDiv.appendChild(dragHandle);

// ---- Content container (giữ nội dung phụ đề) ----
const contentDiv = document.createElement('div');
contentDiv.className = 'subtitle-content';
contentDiv.style.userSelect = 'text';
subtitleDiv.appendChild(contentDiv);

// ===== Drag state =====
let dragPosition = null;        // { topRatio }  -- tỷ lệ 0..1 theo chiều cao container
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
let currentLanguage = 'en';
let sourceLanguage = '';

// ===== DOM helpers =====
function attachSubtitle() {
  const container = document.querySelector('#player');
  if (!container) return false;
  if (!container.contains(subtitleDiv)) {
    container.appendChild(subtitleDiv);
  }
  return true;
}

function updateSubtitlePosition() {
  const video = getVideo();
  if (!video) return;
  const container = document.querySelector('#player');
  if (!container) return;

  if (video.clientHeight !== lastHeight) {
    lastHeight = video.clientHeight;
    const fontSize = Math.max(18, Math.round(lastHeight * 0.04));
    subtitleDiv.style.fontSize = fontSize + 'px';
  }

  // Ngang: luôn căn giữa, không cho chỉnh
  subtitleDiv.style.left = '50%';
  subtitleDiv.style.transform = 'translateX(-50%)';

  // Dọc: nếu có vị trí đã lưu -> quy đổi theo tỷ lệ chiều cao container hiện tại
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
  contentDiv.innerHTML = `
    <div class="sub-original">
      <div class="sub-line">${message}</div>
    </div>
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
  const { language = 'en' } = await new Promise(resolve => {
    chrome.storage.sync.get('language', resolve);
  });
  currentLanguage = language;
}

async function loadTranscript() {
  const videoId = new URL(location.href).searchParams.get('v');
  if (!videoId || videoId === currentVideoId) return;
  currentVideoId = videoId;
  showSubtitle([]);

  try {
    const response = await fetch('http://localhost:3000/api/send-id', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: videoId, language: currentLanguage })
    });
    const data = await response.json();
    sourceLanguage = data.lang;

    if (data.dta === data.lang) {
      loading = false;
      showSubtitle([]);
      showMessage('');
      contentDiv.querySelectorAll('.sub-line').forEach(el => {
        el.style.padding = '0';
      });
      return;
    }

    loading = true;
    showSubtitle([]);
    showMessage('Generating subtitles...');

    let sub = null;
    let lastError = null;
    for (let attempt = 1; attempt <= 5; attempt++) {
      try {
        sub = await downloadTranscript(data.dta, currentLanguage, data.lang, videoId);
        break;
      } catch (err) {
        lastError = err;
        if (attempt < 5) await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    loading = false;
    if (!sub) throw lastError;
    showSubtitle(sub.data);
  } catch (err) {
    loading = false;
    showSubtitle([]);
    showMessage(err);
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
const playerContainer = document.querySelector('#player');
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
  initPopupEvents(wordPopup, getVideo, currentLanguage, () => lastSubtitle, () => sourceLanguage);
  loadTranscript();
})();

// ============================================================
// ===== DRAG SUBTITLE EVENTS (thêm sau cùng) =====
// ============================================================

dragHandle.addEventListener('mousedown', function(e) {
  e.preventDefault();
  e.stopPropagation();
  const container = document.querySelector('#player');
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
  const container = document.querySelector('#player');
  if (!container) return;
  const containerRect = container.getBoundingClientRect();

  let newTop = e.clientY - containerRect.top - dragData.offsetY;

  const subHeight = subtitleDiv.offsetHeight;
  const maxTop = Math.max(0, containerRect.height - subHeight);
  newTop = Math.max(0, Math.min(newTop, maxTop));

  dragPosition = { top: newTop };
  subtitleDiv.style.top = newTop + 'px';
  subtitleDiv.style.bottom = 'auto';
  // left/transform giữ nguyên, không đụng vào
});

document.addEventListener('mousemove', function(e) {
  if (!dragData) return;
  const container = document.querySelector('#player');
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

// ===== Sửa các sự kiện chọn từ để bỏ qua khi đang kéo =====
// Lưu lại các listener cũ để override (do code trên đã định nghĩa, ta chỉ cần bổ sung kiểm tra)
// Các listener này được định nghĩa trong initPopupEvents, nhưng ta có thể patch bằng cách
// lưu lại các handler và thêm điều kiện isDragging.
// Tuy nhiên, vì các listener được thêm trong initPopupEvents (gọi sau), ta sẽ thêm flag
// ngay trong các handler đó bằng cách sử dụng closure.

// Cách khác: override bằng cách thêm một listener ưu tiên cao hơn để chặn nếu isDragging.
// Nhưng đơn giản hơn: ta sẽ sửa trực tiếp trong initPopupEvents ở file API endpoints.
// Ở đây ta chỉ cần đảm bảo isDragging được chia sẻ.
// Để tiện, ta sẽ patch các hàm trong initPopupEvents bằng cách truyền isDragging vào.
// Vì initPopupEvents đã được gọi, ta sẽ không sửa lại mà thêm một lớp kiểm tra bên ngoài.

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
  }
}, true);

document.addEventListener('selectionchange', function(e) {
  if (isDragging) {
    // Ngăn không cho popup xuất hiện
    return;
  }
}, true);
