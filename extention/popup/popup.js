
const nativeSelect = document.getElementById("language");
const learningSelect = document.getElementById("learningLanguage");

// Populate native language
NATIVE_LANGUAGES.forEach(lang => {

    const nativeOption = document.createElement("option");

    nativeOption.value = lang.code;
    nativeOption.textContent = lang.name;

    nativeSelect.appendChild(nativeOption);
});


// Populate learning language
TARGET_LANGUAGES.forEach(lang => {

    const learningOption = document.createElement("option");

    learningOption.value = lang.code;
    learningOption.textContent = lang.name;

    learningSelect.appendChild(learningOption);
});


// Load saved languages
chrome.storage.sync.get(
    ["target_language", "native_language"],
    ({ target_language, native_language }) => {

        // Native language (ngôn ngữ mẹ đẻ – dịch ra)
        if (native_language) {
            nativeSelect.value = native_language;
        } else {
            nativeSelect.value = "en";
        }

        // Target language (ngôn ngữ đang học – lấy phụ đề)
        if (target_language) {
            learningSelect.value = target_language;
        } else {
            learningSelect.value = "en";
        }
    }
);


// Save languages
document.getElementById("save").addEventListener("click", () => {

    chrome.storage.sync.set(
        {
            target_language: learningSelect.value,
            native_language: nativeSelect.value
        },
        () => window.close()
    );

});
