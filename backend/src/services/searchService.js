const axios = require("axios");
const { getSentence } = require("../utils/utils");

const PYTHON_API = "http://127.0.0.1:8000/ipa";

exports.searchService = async (word, language, subtitle, sourceLanguage) => {
    try {

        const sentence = getSentence(word, subtitle);
    
        const { data } = await axios.post(PYTHON_API, {
            "word": word,
            "language": sourceLanguage,
            "sentence": sentence,
            "native": language

        });
        
        return {
            word: data.word,
            ipa: data.ipa,
            meaning: data.meaning,
            audio: data.audio
        };

    } catch (err) {

        if (err.response?.status === 404) {
            return null;
        }

        console.error(err);
        throw err;
    }
};