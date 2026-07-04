const axios = require("axios");

async function translate(text, language) {

    const response = await axios.get(
        "https://translate.googleapis.com/translate_a/single",
        {
            params: {
                client: "gtx",
                sl: "en",
                tl: language,
                dt: "t",
                q: text
            }
        }
    );

    return response.data[0]
        .map(x => x[0])
        .join("");

}

function chunk(arr, size) {

    let result = [];

    for (let i = 0; i < arr.length; i += size) {

        result.push(
            arr.slice(i, i + size)
        );

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
    language
) {

    const lines =
    transcriptText
        .split("\n")
        .map(x => x.trim())
        .filter(Boolean);

    const parsed = lines
        .map(line => {

            const match =
            line.match(
                /^(\d{2}:\d{2}:\d{2}\.\d{3})\s+(.+)$/
            );

            if (!match)
                return null;

            return {

                time: match[1],
                english: match[2]

            };

        })
        .filter(Boolean);

    const batches =
    chunk(parsed, 15);

    let translatedItems = [];

    for (const batch of batches) {

        const translatedBatch =
        await Promise.all(

            batch.map(async item => ({

                time: item.time,
                english: item.english,
                translated:
                await translate(
                    item.english,
                    language
                )

            }))

        );

        translatedItems.push(
            ...translatedBatch
        );

        // console.log(
        //     `Translated batch: ${translatedItems.length}/${parsed.length}`
        // );

    }

    const result =
    translatedItems.map(
        (item, index) => {

            const start =
            timeToSeconds(
                item.time
            );

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

                original:
                item.english,

                translated:
                item.translated

            };

        }
    );

    return result;

}

module.exports = {
    translateTranscript
};