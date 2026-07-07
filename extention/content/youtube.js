injectCss();

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

        const fontSize = Math.max(18, Math.round(lastHeight * 0.04));

        subtitleDiv.style.fontSize = fontSize + "px";
    }

    subtitleDiv.style.bottom = (-lastHeight + parseFloat(subtitleDiv.style.fontSize)) + "px";
}

let subtitlesData = [];

let lastSubtitle = null;

let currentIndex = 0;

let loading = false;

function showSubtitle(subtitles) {

    subtitlesData = subtitles;

    lastSubtitle = null;

    currentIndex = 0;

    subtitleDiv.innerHTML = "";
}

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

    if (videoId === currentVideoId) return;

    currentVideoId = videoId;

    showSubtitle([]);

    try {

        const { language = "en" } = await new Promise((resolve) => {
            chrome.storage.sync.get("language", resolve);
        });

        const response = await fetch(
            "http://localhost:3000/api/send-id",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    id: videoId,
                    language: language
                })
            }
        );

        const data = await response.json();

        if ( data.dta === data.lang ) {
            loading = false;
            showSubtitle([]);
            showMessage("");
            subtitleDiv.querySelectorAll(".sub-line").forEach(el => {
                el.style.padding = "0";
            });
            return;
        }

        loading = true;

        showSubtitle([]);

        showMessage("Generating subtitles...");

        const sub = await downloadTranscript(data.dta, language, data.lang, videoId);

        loading = false;

        showSubtitle(sub.data);

    } catch (err) {
 
        loading = false;

        showSubtitle([]);

        showMessage("Failed to load subtitles. Please try again later.");

    }

}

loadTranscript();

document.addEventListener("yt-navigate-finish", () => {
    loadTranscript();
});

const observer = new ResizeObserver(() => {
    updateSubtitlePosition();
});

const video = getVideo();
if (video) {
    observer.observe(video);
}