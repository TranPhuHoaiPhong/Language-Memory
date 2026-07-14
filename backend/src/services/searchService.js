const axios = require("axios");

const PYTHON_API = "http://127.0.0.1:8000/ipa";

exports.searchService = async (word, language, subtitle) => {
    try {
    
        const { data } = await axios.post(PYTHON_API, {
            "word": word
        });

        return {
            word: data.word,
            ipa: data.ipa,
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