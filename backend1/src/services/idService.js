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

    let subtitleGroups = info.automatic_captions || {};

    if (Object.keys(subtitleGroups).length === 0) {
        subtitleGroups = info.subtitles || {};
    }

    if (Object.keys(subtitleGroups).length === 0) {
        throw new Error("Transcript not found");
    }

    const keys = Object.keys(subtitleGroups);

    const preferred = info.language?.toLowerCase();

    let firstLang = null;

    if (preferred) {

        firstLang = keys.find(
            k => k.toLowerCase() === preferred
        );

        if (!firstLang) {

            const base = preferred.split("-")[0];

            firstLang =
                keys.find(k => k.toLowerCase() === base) ||
                keys.find(k => k.toLowerCase().startsWith(base + "-"));
        }
    }

    if (!firstLang) {
        firstLang = keys[0];
    }

    const tracks = subtitleGroups[firstLang];

    if (!tracks || tracks.length === 0) {
        throw new Error("Transcript not found");
    }

    const track =
        tracks.find(t => t.ext === "json3") ||
        tracks.find(t => t.ext === "vtt") ||
        tracks[0];

    const url = new URL(track.url);

    url.searchParams.set("fmt", "json3");

    const lang =
        url.searchParams.get("lang") ||
        firstLang;

    if (lang.toLowerCase() === language.toLowerCase()) {
        return {
            dta: lang,
            lang
        };
    }

    url.searchParams.delete("tlang");

    return {
        dta: url.toString(),
        lang
    };
};