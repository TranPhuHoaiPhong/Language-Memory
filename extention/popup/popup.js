const select = document.getElementById("language");

LANGUAGES.forEach(lang => {

    const option = document.createElement("option");

    option.value = lang.code;
    option.textContent = `${lang.name}`;

    select.appendChild(option);

});

chrome.storage.sync.get("language", ({ language }) => {

    if (language) {
        select.value = language;
    } else {
        select.value = "en";
    }

});

document.getElementById("save").addEventListener("click", () => {

    chrome.storage.sync.set(
        {
            language: select.value
        },
        () => window.close()
    );

});