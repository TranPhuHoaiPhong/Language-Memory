const youtubedl = require("youtube-dl-exec");

exports.processId = async (videoId, language) => {

    const info = await youtubedl(
        `https://www.youtube.com/watch?v=${videoId}`,
        {
            dumpSingleJson: true,
            skipDownload: true,
            writeSub: true,
            writeAutoSub: true
        }
    );

    const captions = info.automatic_captions?.en;

    if (!captions || captions.length === 0) {
        throw new Error("Transcript not found");
    }

    const track = captions[0];

    const url = new URL(track.url);

    const lang = url.searchParams.get("lang");

    if (lang === language) {
        return null;
    }

    url.searchParams.delete("tlang");

    const base1 = url.toString();

    return {
        dta: base1,
        lang: lang
    };
}; 