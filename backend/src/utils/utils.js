function escapeRegex(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getSentence(word, subtitle) {

    if (!subtitle?.original) {
        return "";
    }

    const sentences = subtitle.original.match(/[^.!?]+[.!?]?/g) || [];

    const regex = new RegExp(`\\b${escapeRegex(word)}\\b`, "i");

    for (const sentence of sentences) {
        if (regex.test(sentence)) {
            return sentence.trim();
        }
    }

    return subtitle.original;
}

module.exports = {
    getSentence
};