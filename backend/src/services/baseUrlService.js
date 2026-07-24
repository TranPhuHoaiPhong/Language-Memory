const { convertTranscriptToText } = require("../utils/transcript");
const { translateTranscript } = require("../utils/translate");

const SubtitleCache = require("../models/SubtitleCache");

const zlib = require("zlib");
const { promisify } = require("util");

const brotliCompress = promisify(zlib.brotliCompress);
const brotliDecompress = promisify(zlib.brotliDecompress);

const fs = require("fs").promises;



exports.transcriptSer = async (data, language, lang, videoId) => {
    try {

        const cache = await SubtitleCache.findOne({
            videoId,
            sourceLanguage: lang,
            language
        });

        if (cache) {

            const json = await brotliDecompress(cache.subtitle);

            return JSON.parse(json.toString());

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


        const compressed = await brotliCompress(
            Buffer.from(JSON.stringify(subtitle)),
            {
                params: {
                    [zlib.constants.BROTLI_PARAM_QUALITY]: 5
                }
            }
        );

        await SubtitleCache.updateOne(
            {
                videoId,
                sourceLanguage: lang,
                language
            },
            {
                $set: {
                    subtitle: compressed
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
