async function downloadTranscript(url, language, lang, videoId) {

    const res = await fetch(url.toString());

    if (!res.ok) {
        throw new Error("Failed to fetch transcript");
    }

    const text = await res.text();

    const sub = await fetch("http://localhost:3000/api/transcript", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            transcript: text,
            language: language,
            lang: lang,
            videoId: videoId
        })
    });

    return sub.json();
}

function getVideo() {
    return document.querySelector("video.html5-main-video");
}

function renderLines(text) {

    if (!text) return "";

    return text
        .split(/\r?\n/)
        .map(line => `<div class="sub-line">${line}</div>`)
        .join("");

}

function showMessage(message) {

    attachSubtitle();

    updateSubtitlePosition(); 

    subtitleDiv.innerHTML = `
        <div class="sub-original">
            <div class="sub-line">${message}</div>
        </div>
    `;

}

function hidePopup() {
    wordPopup.style.display = "none";
}