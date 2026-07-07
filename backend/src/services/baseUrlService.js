const { convertTranscriptToText } = require("../utils/transcript");
const { translateTranscript } = require("../utils/translate");
const SubtitleCache = require("../models/SubtitleCache");
const fs = require("fs").promises;

exports.transcriptSer = async (data, language, lang, videoId) => {
    try {

        const cache = await SubtitleCache.findOne({
            videoId,
            sourceLanguage: lang,
            language
        }).lean();

        if (cache) {
            return cache.subtitle;
        }

        const transcriptText = convertTranscriptToText(data);

        const subtitle = await translateTranscript(transcriptText, language, lang);

        // await fs.writeFile(
        //     "data/subtitle.json",
        //     JSON.stringify(
        //         subtitle,
        //         null,
        //         2
        //     ),
        //     "utf8"
        // );

        await SubtitleCache.updateOne(
            {
                videoId,
                sourceLanguage: lang,
                language
            },
            {
                $set: {
                    subtitle
                }
            },
            {
                upsert: true
            }
        );

        return subtitle;

    } catch (err) {
        console.error(err);
        throw err;
    }
};
