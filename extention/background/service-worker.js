chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type !== "SEND_VIDEO_ID") {
        return;
    }

    const { videoId, language } = message;

    console.log("[Language Memory] Background received:", {
        videoId,
        language
    });

    fetch("http://localhost:3000/api/send-id", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            id: videoId,
            language: language
        })
    })
        .then(async (response) => {
            if (!response.ok) {
                throw new Error(
                    `Backend returned ${response.status}`
                );
            }

            const data = await response.json();

            console.log(
                "[Language Memory] Backend response:",
                data
            );

            sendResponse({
                success: true,
                data: data
            });
        })
        .catch((error) => {
            console.error(
                "[Language Memory] Backend error:",
                error
            );

            sendResponse({
                success: false,
                error: error.message
            });
        });

    return true;
});