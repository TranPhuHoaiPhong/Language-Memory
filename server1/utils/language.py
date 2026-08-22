from functools import lru_cache

@lru_cache(maxsize=256)
def normalize_language(lang: str) -> str:
    if not lang:
        return "en"
    lang = lang.lower()
    aliases = {
        "en-us": "en", "en-gb": "en", "en-au": "en",
        "fr-fr": "fr", "fr-ca": "fr",
        "es-es": "es", "es-mx": "es", "es-us": "es",
        "pt-br": "pt", "pt-pt": "pt",
        "zh-cn": "zh", "zh-tw": "zh", "zh-hans": "zh", "zh-hant": "zh",
        "nb": "no", "nn": "no",
        "iw": "he",
    }
    return aliases.get(lang, lang.split("-")[0])