const { convertTranscriptToText } = require("../utils/transcript");
const { convertTranscriptToVietnamese, translateTranscript } = require("../utils/translate");

const fs = require("fs").promises;

exports.transcriptSer = async (data, language) => {
    try {

        const transcriptText = convertTranscriptToText(data);

        const subtitle = await translateTranscript(transcriptText, language);

        await fs.writeFile(
            "data/subtitle.json",
            JSON.stringify(
                subtitle,
                null,
                2
            ),
            "utf8"
        );

        return subtitle;

    } catch (err) {
        console.error(err);
        throw err;
    }
};
