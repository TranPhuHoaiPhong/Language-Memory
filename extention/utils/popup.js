const WORD_INFO_API = "http://localhost:3000/api/search";
const SAVE_WORD_API = "http://localhost:3000/api/save";

async function fetchWordInfo(word, language, subtitle, sourceLanguage) {

    const response = await fetch(WORD_INFO_API, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ word, language, subtitle, sourceLanguage})
    });

    if (!response.ok) {
        throw new Error("Request failed: " + response.status);
    }

    return response.json();
}

async function saveWord(data) {

    const response = await fetch(SAVE_WORD_API, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ data})
    });

    if (!response.ok) {
        throw new Error("Request failed: " + response.status);
    }

    return response.json();
}

function buildPopupSkeleton(wordPopup) {

    wordPopup.innerHTML = `
        <div class="word-popup-word"></div>
        <div class="word-popup-ipa"></div>
        <div class="word-popup-meaning"></div>
        <div class="container-word">
            <button class="word-popup-audio">
            🔉
            </button>
            <button class="word-popup-btn">Save</button>
        </div>
        
    `;

    return {
        wordEl: wordPopup.querySelector(".word-popup-word"),
        ipaEl: wordPopup.querySelector(".word-popup-ipa"),
        meaningEl: wordPopup.querySelector(".word-popup-meaning"),
        audioEl: wordPopup.querySelector(".word-popup-audio"),
        btnEl: wordPopup.querySelector(".word-popup-btn")
    };
}

function showLoginModal() {
    const modal = document.createElement("div");

    modal.innerHTML = `
        <div id="lm-overlay">
            <div id="lm-modal">
                <h2>🔒 Chưa đăng nhập</h2>

                <p>
                    Bạn cần đăng nhập để lưu từ vựng và đồng bộ dữ liệu giữa các thiết bị.
                </p>

                <div class="buttons">
                    <button id="lm-login">
                        Đăng nhập
                    </button>

                    <button id="lm-close">
                        Để sau
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    document.getElementById("lm-login").onclick = () => {
        window.open(
            "https://language-memory.com/login",
            "_blank"
        );

        modal.remove();
    };

    document.getElementById("lm-close").onclick = () => {
        modal.remove();
    };
}

// Nguyên

function initPopupEvents(wordPopup, getVideo, language, getCurrentSubtitle, getSourceLanguage) {

    const { wordEl, ipaEl,  meaningEl, audioEl, btnEl } = buildPopupSkeleton(wordPopup);

    let selectedText = "";
    let selectedRect = null;
    let requestId = 0;
    let currentAudioUrl = "";
    let audioPlayer = new Audio();
    let currentWordData = null;

    function hidePopupSafe() {
        requestId++;
        hidePopup();
    }

    function attachPopupToPlayer() {

        const container = document.querySelector("#player");

        if (!container) return null;

        if (getComputedStyle(container).position === "static") {
            container.style.position = "relative";
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

        wordPopup.style.visibility = "hidden";
        wordPopup.style.display = "block";

        const popupWidth = wordPopup.offsetWidth;
        const popupHeight = wordPopup.offsetHeight;

        const selCenterX = selectedRect.left + selectedRect.width / 2;

        let left = (selCenterX - containerRect.left) - popupWidth / 2;
        let top = (selectedRect.top - containerRect.top) - popupHeight - 5;

        const minLeft = 4;
        const maxLeft = containerRect.width - popupWidth - 4;
        left = Math.max(minLeft, Math.min(left, maxLeft));

        if (top < 0) {
            top = (selectedRect.bottom - containerRect.top) + 5;
        }

        wordPopup.style.left = left + "px";
        wordPopup.style.top = top + "px";
        wordPopup.style.visibility = "visible";
    }

    async function loadWordInfo(word) {

        const subtitle = getCurrentSubtitle();
        const sourceLanguage = getSourceLanguage();

        const currentRequestId = ++requestId;

        wordEl.textContent = "Loading...";
        ipaEl.textContent = "";
        meaningEl.textContent = "";

        audioEl.style.display = "none";
        btnEl.disabled = true;

        wordPopup.classList.add("loading");


        positionPopup();


        try {

            const data = await fetchWordInfo(
                word,
                language,
                subtitle,
                sourceLanguage
            );


            if (currentRequestId !== requestId) return;


            wordPopup.classList.remove("loading");


            wordEl.textContent = data.data.word || word;

            ipaEl.textContent = data.data.ipa || "";

            meaningEl.textContent = data.data.meaning || "";

            currentAudioUrl = data.data.audio || "";


            audioEl.style.display = "block";

            currentWordData = {
                word: data.data.word || word,
                ipa: data.data.ipa || "",
                meaning: data.data.meaning || "",
                subtitle: getCurrentSubtitle(),
                language,
                sourceLanguage,
                audio: data.data.audio || ""
            };


        } catch (err) {

            if (currentRequestId !== requestId) return;


            wordPopup.classList.remove("loading");

            wordEl.textContent = "Failed";

            ipaEl.textContent = "";

            meaningEl.textContent = "";

            audioEl.style.display = "none";


        } finally {

            if (currentRequestId === requestId) {

                btnEl.disabled = false;

                positionPopup();

            }
        }
    }

    btnEl.addEventListener("click", async (e) => {
        e.stopPropagation();

        if (!currentWordData) return;

        try {
            // btnEl.disabled = true;

            // const result = await saveWord(currentWordData);
            
            // alert("Đã lưu");
            window.open("https://facebook.com", "_blank");

        } catch (err) {
            console.error(err);

            alert("Lưu thất bại");
        } finally {
            btnEl.disabled = false;
        }
    });

    wordPopup.addEventListener("mousedown", (e) => {
        e.preventDefault();
    });

    document.addEventListener("mouseup", (e) => {

        if (e.target.closest("#word-popup")) {
            return;
        }

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

        const subOriginalEl = anchorElement ? anchorElement.closest(".sub-original") : null;

        if (!subOriginalEl) {
            hidePopupSafe();
            return;
        }

        selectedText = text;
        selectedRect = range.getBoundingClientRect();

        loadWordInfo(text);
    });

    document.addEventListener("selectionchange", () => {

        const selection = window.getSelection();
        const text = selection.toString().trim();

        const anchorNode = selection.anchorNode;
        const anchorElement = anchorNode
            ? (anchorNode.nodeType === 3 ? anchorNode.parentElement : anchorNode)
            : null;

        if (anchorElement && anchorElement.closest("#word-popup")) {
            return;
        }

        if (!text) {
            hidePopupSafe();
            return;
        }

        if (!anchorElement || !anchorElement.closest(".sub-original")) return;

        const video = getVideo();

        if (video && !video.paused) {
            video.pause();
        }

        if (!window.getSelection().toString().trim()) {
            hidePopupSafe();
        }

    });

    document.addEventListener("mousedown", (e) => {

        if (
            !e.target.closest("#word-popup") &&
            !e.target.closest(".sub-original")
        ) {
            hidePopupSafe();
            window.getSelection().removeAllRanges();
        }

    });

    document.addEventListener("keydown", (e) => {

        if (e.key === "Enter") {
            hidePopupSafe();
            window.getSelection().removeAllRanges();
        }

    });

    const resizeObserver = new ResizeObserver(() => {
        if (wordPopup.style.display === "block") {
            positionPopup();
        }
    });

    const container = document.querySelector("#player");
    if (container) resizeObserver.observe(container);

    audioEl.addEventListener("click", (e) => {

        e.stopPropagation();

        if (!currentAudioUrl) return;

        audioPlayer.pause();
        audioPlayer.currentTime = 0;

        audioPlayer.src = currentAudioUrl;
        audioPlayer.play();
    });

}