injectCss();

// ======================= Subtitle =======================

const subtitleDiv = document.createElement("div");

subtitleDiv.id = "subtitle-translate";

function attachSubtitle() {

    const container = document.querySelector(".html5-video-container");

    if (!container) return false;

    if (!container.contains(subtitleDiv)) {
        container.appendChild(subtitleDiv);
    }

    return true;
}

let lastHeight = 0;

function updateSubtitlePosition() {

    const video = getVideo();

    if (!video) return;

    if (video.clientHeight !== lastHeight) {

        lastHeight = video.clientHeight;

        const fontSize = Math.max(
            18,
            Math.round(lastHeight * 0.04)
        );

        subtitleDiv.style.fontSize = fontSize + "px";

        subtitleDiv.style.bottom = (-lastHeight + fontSize) + "px";
    }
}

let subtitlesData = [];

let lastSubtitle = null;

let currentIndex = 0;

function showSubtitle(subtitles) {

    subtitlesData = subtitles;

    lastSubtitle = null;

    currentIndex = 0;

    subtitleDiv.innerHTML = "";
}

function updateLoop() {

    attachSubtitle();

    const video = getVideo();

    if (!video) {
        requestAnimationFrame(updateLoop);
        return;
    }

    updateSubtitlePosition();

    const current = video.currentTime;

    while (
        currentIndex < subtitlesData.length - 1 &&
        current > subtitlesData[currentIndex].end
    ) {
        currentIndex++;
    }

    while (
        currentIndex > 0 &&
        current < subtitlesData[currentIndex].start
    ) {
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

        subtitleDiv.innerHTML = currentSubtitle
            ? `
            <div class="sub-original">
            ${renderLines(currentSubtitle.original)}
            </div>

            <div class="sub-translated">
            ${renderLines(currentSubtitle.translated)}
            </div>
            `
            : "";
    }

    requestAnimationFrame(updateLoop);
}

updateLoop();

// ======================= Main =======================

let currentVideoId = null;

async function loadTranscript() {

    const videoId = new URL(location.href).searchParams.get("v");

    if (!videoId) return;

    // Không tải lại nếu vẫn là video cũ
    if (videoId === currentVideoId) return;

    currentVideoId = videoId;

    showSubtitle([]);

    try {

        showSubtitle([]);

        const response = await fetch(
            "http://localhost:3000/api/send-id",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    id: videoId
                })
            }
        );

        const data = await response.json();

        const sub = await downloadTranscript(data.data);

        showSubtitle(sub.data);

    } catch (err) {

        console.error(err);

        alert("Can not get the transcript");

    }

}

// Lần đầu extension chạy
loadTranscript();

// Khi YouTube chuyển sang video khác
document.addEventListener("yt-navigate-finish", loadTranscript);