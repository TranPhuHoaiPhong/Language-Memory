const WORD_INFO_API = "http://localhost:3000/api/search";

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

function buildPopupSkeleton(wordPopup) {

    wordPopup.innerHTML = `
        <div class="word-popup-word"></div>
        <div class="word-popup-ipa"></div>
        <div class="container-word">
            <button class="word-popup-audio">
            🔊
            </button>
            <button class="word-popup-btn">Save</button>
        </div>
        
    `;

    return {
        wordEl: wordPopup.querySelector(".word-popup-word"),
        ipaEl: wordPopup.querySelector(".word-popup-ipa"),
        audioEl: wordPopup.querySelector(".word-popup-audio"),
        btnEl: wordPopup.querySelector(".word-popup-btn")
    };
}

// Nguyên

function initPopupEvents(wordPopup, getVideo, language, getCurrentSubtitle, getSourceLanguage) {

    const { wordEl, ipaEl, audioEl, btnEl } = buildPopupSkeleton(wordPopup);

    let selectedText = "";
    let selectedRect = null;
    let requestId = 0;
    let currentAudioUrl = "";
    let audioPlayer = new Audio();

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

        wordEl.textContent = word;
        ipaEl.textContent = "Searching...";
        ipaEl.classList.add("word-popup-loading");
        btnEl.disabled = true;

        positionPopup();

        try {

            const data = await fetchWordInfo(word, language, subtitle, sourceLanguage);

            if (currentRequestId !== requestId) return;

            ipaEl.classList.remove("word-popup-loading");
            ipaEl.textContent = data.data.ipa || "";

            currentAudioUrl = data.data.audio || "";


        } catch (err) {

            if (currentRequestId !== requestId) return;

            ipaEl.classList.remove("word-popup-loading");
            ipaEl.textContent = "";
            audioEl.textContent = "Failed. Try again!";

        } finally {

            if (currentRequestId === requestId) {
                btnEl.disabled = false;
                positionPopup();
            }
        }
    }

    btnEl.addEventListener("click", (e) => {
        e.stopPropagation();
        alert("đã lưu")


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