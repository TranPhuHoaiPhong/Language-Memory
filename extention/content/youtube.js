const wordPopup = document.createElement("div");
wordPopup.id = "word-popup";
document.body.appendChild(wordPopup);

const subtitleDiv = document.createElement("div");
subtitleDiv.id = "subtitle-translate";

document.addEventListener("yt-navigate-finish", () => {
    loadTranscript();
});

const observer = new ResizeObserver(() => {
    updateSubtitlePosition();
});

const video = getVideo();

if (video) {
    observer.observe(video);
    video.addEventListener("play", () => {
        hidePopup();
        window.getSelection().removeAllRanges();
    });
}

let lastHeight = 0;
let subtitlesData = [];
let lastSubtitle = null;
let currentIndex = 0;
let loading = false;
let currentVideoId = null;
let currentLanguage = "en";
let sourceLanguage = "";

function attachSubtitle() {

    const container = document.querySelector("#player");

    if (!container) return false;

    if (!container.contains(subtitleDiv)) {
        container.appendChild(subtitleDiv);
    }

    return true;
}

function updateSubtitlePosition() {

    const video = getVideo();

    if (!video) return;

    if (video.clientHeight !== lastHeight) {

        lastHeight = video.clientHeight;

        const fontSize = Math.max(18, Math.round(lastHeight * 0.04));

        subtitleDiv.style.fontSize = fontSize + "px";
    }

    subtitleDiv.style.bottom = (parseFloat(subtitleDiv.style.fontSize)) + "px";
}

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

// ======================= Main =======================

async function loadLanguage() {
    const { language = "en" } = await new Promise((resolve) => {
        chrome.storage.sync.get("language", resolve);
    });

    currentLanguage = language;
}

async function loadTranscript() {

    const videoId = new URL(location.href).searchParams.get("v");

    if (!videoId) return;

    if (videoId === currentVideoId) return;

    currentVideoId = videoId;

    showSubtitle([]);

    try {

        const response = await fetch(
            "http://localhost:3000/api/send-id",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    id: videoId,
                    language: currentLanguage
                })
            }
        );

        const data = await response.json();

        sourceLanguage = data.lang;

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

        let sub = null;
        let lastError = null;

        for (let i = 1; i <= 5; i++) {
            try {
                sub = await downloadTranscript(
                    data.dta,
                    currentLanguage,
                    data.lang,
                    videoId
                );

                break; 

            } catch (err) {

                lastError = err;

                console.warn(`Retry ${i}/5 failed`, err);

                if (i < 5) {
                    // Chờ 1 giây rồi thử lại
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
        }

        loading = false;

        if (!sub) {
            throw lastError;
        }

        showSubtitle(sub.data);

    } catch (err) {
 
        loading = false;

        showSubtitle([]);

        showMessage(err);

    }

}

injectCss();
updateLoop();

(async () => {
    await loadLanguage();
    initPopupEvents(wordPopup, getVideo, currentLanguage, () => lastSubtitle, () => sourceLanguage);
    loadTranscript();
})();