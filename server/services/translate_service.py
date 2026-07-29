import re
from datetime import datetime
import app_state
from config import CACHE_TTL

meaning_cache = {}

async def get_context_meaning(word: str, sentence: str, native: str, language: str) -> str | None:
    if not sentence:
        return None
    key = (word, sentence, native, language)
    now = datetime.now()
    if key in meaning_cache:
        value, timestamp = meaning_cache[key]
        if now - timestamp < CACHE_TTL:
            return value
        else:
            del meaning_cache[key]

    pattern = r"\b" + re.escape(word) + r"\b"
    marked = re.sub(pattern, f"[{word}]", sentence, count=1, flags=re.IGNORECASE)

    url = "https://translate.googleapis.com/translate_a/single"
    params = {
        "client": "gtx",
        "sl": language,
        "tl": native,
        "dt": "t",
        "q": marked
    }
    try:
        resp = await app_state.http_client.get(url, params=params)
        resp.raise_for_status()
        data = resp.json()
        translated = data[0][0][0]
        match = re.search(r"\[(.*?)\]", translated)
        result = match.group(1) if match else None
    except Exception:
        result = None

    if result is not None:
        meaning_cache[key] = (result, now)

    return result