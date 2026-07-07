const axios = require("axios");
const https = require("https");

const httpsAgent = new https.Agent({
    keepAlive: true,
    maxSockets: 100,
    maxFreeSockets: 20
});

const CONCURRENCY = 40;
const AMOUNT = 10;

async function translate(texts, sourceLanguage, targetLanguage) {

    const merged = texts
        .map((text, index) =>
            `[${String(index + 1).padStart(6, "0")}]\n${text}`
        )
        .join("\n\n");

    const response = await axios.get(
        "https://translate.googleapis.com/translate_a/single",
        {
            httpsAgent,
            timeout: 10000,
            params: {
                client: "gtx",
                sl: sourceLanguage,
                tl: targetLanguage,
                dt: "t",
                q: merged
            }
        }
    );

    const translated = response.data[0]
        .map(x => x[0])
        .join("");

    const matches = [
        ...translated.matchAll(
            /\[(\d{6})\]\s*([\s\S]*?)(?=\[\d{6}\]|$)/g
        )
    ];

    const result = new Array(texts.length);

    for (const match of matches) {

        const index = Number(match[1]) - 1;

        result[index] = match[2].trim();

    }

    return result;

}

function timeToSeconds(time) {

    const [h, m, s] = time.split(":");

    return (
        Number(h) * 3600 +
        Number(m) * 60 +
        Number(s)
    );

}

async function translateTranscript(
    transcriptText,
    language,
    lang
) {

    const lines = transcriptText
        .split("\n")
        .map(x => x.trim())
        .filter(Boolean);

    const parsed = lines
        .map(line => {  

            const match = line.match(/^(\d{2}:\d{2}:\d{2}\.\d{3})\s+(.+)$/);

            if (!match)
                return null;

            return {
                time: match[1],
                english: match[2]
            };

        })
        .filter(Boolean);

    const translatedItems = new Array(parsed.length);

    let nextIndex = 0;

    async function worker(workerId) {

        while (true) {

            const current = nextIndex;

            nextIndex += AMOUNT;

            if (current >= parsed.length)
                return;

            const items =
                parsed.slice(
                    current,
                    current + AMOUNT
                );

            try {

                const translated =
                    await translate(
                        items.map(x => x.english),
                        lang,
                        language
                    );

                items.forEach((item, index) => {

                    translatedItems[current + index] = {

                        time: item.time,

                        english: item.english,

                        translated:
                            translated[index] ??
                            item.english

                    };

                });

            }

            catch (err) {

                items.forEach((item, index) => {

                    translatedItems[current + index] = {

                        time: item.time,

                        english: item.english,

                        translated: item.english

                    };

                });

            }

        }

    }

    await Promise.all(

        Array.from(
            {
                length: Math.min(
                    CONCURRENCY,
                    parsed.length
                )
            },

            (_, i) => worker(i + 1)

        )

    );

    return translatedItems.map(

        (item, index) => {

            const start = timeToSeconds(item.time);

            const end =

                index <

                translatedItems.length - 1

                    ? timeToSeconds(

                        translatedItems[index + 1].time

                    )

                    : start;

            return {
                start,
                end,
                original: item.english,
                translated: item.translated
            };

        }

    );

}

module.exports = {
    translateTranscript
}; 