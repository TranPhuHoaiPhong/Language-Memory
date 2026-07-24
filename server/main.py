from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
import eng_to_ipa as ipa
import edge_tts
import os
import re
import asyncio
import httpx
from functools import lru_cache
from datetime import datetime, timedelta

app = FastAPI()

AUDIO_DIR = "audio"
os.makedirs(AUDIO_DIR, exist_ok=True)
app.mount("/audio", StaticFiles(directory=AUDIO_DIR), name="audio")

# -------------------- VOICE MAP (dict) --------------------
VOICE_MAP = {
    "en": "en-US-JennyNeural",
    "fr": "fr-FR-DeniseNeural",
    "es": "es-ES-ElviraNeural",
    "it": "it-IT-ElsaNeural",
    "pt": "pt-BR-FranciscaNeural",
    "ro": "ro-RO-AlinaNeural",
    "ca": "ca-ES-JoanaNeural",
    "gl": "gl-ES-SabelaNeural",
    "de": "de-DE-KatjaNeural",
    "nl": "nl-NL-ColetteNeural",
    "af": "af-ZA-AdriNeural",
    "sv": "sv-SE-SofieNeural",
    "da": "da-DK-ChristelNeural",
    "no": "nb-NO-PernilleNeural",
    "is": "is-IS-GudrunNeural",
    "ru": "ru-RU-SvetlanaNeural",
    "uk": "uk-UA-PolinaNeural",
    "pl": "pl-PL-ZofiaNeural",
    "cs": "cs-CZ-VlastaNeural",
    "sk": "sk-SK-ViktoriaNeural",
    "bg": "bg-BG-KalinaNeural",
    "sr": "sr-RS-SophieNeural",
    "hr": "hr-HR-GabrijelaNeural",
    "sl": "sl-SI-PetraNeural",
    "lt": "lt-LT-OnaNeural",
    "lv": "lv-LV-EveritaNeural",
    "et": "et-EE-AnuNeural",
    "zh": "zh-CN-XiaoxiaoNeural",
    "ja": "ja-JP-NanamiNeural",
    "ko": "ko-KR-SunHiNeural",
    "vi": "vi-VN-HoaiMyNeural",
    "th": "th-TH-PremwadeeNeural",
    "id": "id-ID-GadisNeural",
    "ms": "ms-MY-YasminNeural",
    "hi": "hi-IN-SwaraNeural",
    "ta": "ta-IN-PallaviNeural",
    "te": "te-IN-ShrutiNeural",
    "kn": "kn-IN-SapnaNeural",
    "ml": "ml-IN-SobhanaNeural",
    "bn": "bn-BD-NabanitaNeural",
    "gu": "gu-IN-DhwaniNeural",
    "mr": "mr-IN-AarohiNeural",
    "ur": "ur-PK-UzmaNeural",
    "ar": "ar-SA-ZariyahNeural",
    "he": "he-IL-HilaNeural",
    "fa": "fa-IR-DilaraNeural",
    "tr": "tr-TR-EmelNeural",
    "fi": "fi-FI-NooraNeural",
    "hu": "hu-HU-NoemiNeural",
    "el": "el-GR-AthinaNeural",
    "sw": "sw-KE-ZuriNeural",
    "zu": "zu-ZA-ThandoNeural",
    "am": "am-ET-MekdesNeural",
    "ne": "ne-NP-HemkalaNeural",
    "kk": "kk-KZ-AigulNeural",
    "uz": "uz-UZ-MadinaNeural",
    "az": "az-AZ-BanuNeural",
    "ka": "ka-GE-EkaNeural",
    "mk": "mk-MK-MarijaNeural",
    "sq": "sq-AL-AnilaNeural",
    "eu": "eu-ES-AinhoaNeural",
}

# -------------------- HTTP Client --------------------
http_client = None

@app.on_event("startup")
async def startup_event():
    global http_client
    http_client = httpx.AsyncClient(
        timeout=httpx.Timeout(5.0, connect=3.0),
        limits=httpx.Limits(max_keepalive_connections=20, max_connections=50),
        http2=False
    )

@app.on_event("shutdown")
async def shutdown_event():
    if http_client:
        await http_client.aclose()

# -------------------- Caching --------------------
@lru_cache(maxsize=2048)
def generate_ipa_sync(word: str):
    result = ipa.convert(word)
    return result if result.lower() != word.lower() else None

@lru_cache(maxsize=256)
def normalize_language(lang: str):
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

meaning_cache = {}
CACHE_TTL = timedelta(minutes=15)

async def get_context_meaning(word: str, sentence: str, native: str, language: str):
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
    marked = re.sub(pattern, f"[[{word}]]", sentence, count=1, flags=re.IGNORECASE)
    url = "https://translate.googleapis.com/translate_a/single"
    params = {
        "client": "gtx",
        "sl": language,
        "tl": native,
        "dt": "t",
        "q": marked
    }
    try:
        resp = await http_client.get(url, params=params)
        resp.raise_for_status()
        data = resp.json()
        translated = data[0][0][0]
        match = re.search(r"\[\[(.*?)\]\]", translated)
        result = match.group(1) if match else None
    except Exception:
        result = None
    meaning_cache[key] = (result, now)
    return result

async def generate_ipa_async(word: str):
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, generate_ipa_sync, word)

async def generate_audio(word: str, voice: str, filepath: str):
    # Tạo thư mục cha nếu chưa có
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    if not os.path.exists(filepath):
        await edge_tts.Communicate(text=word, voice=voice).save(filepath)
    return filepath

# -------------------- Endpoint --------------------
@app.post("/ipa")
async def get_ipa(data: dict):
    word = data.get("word", "").strip()
    if not word:
        return {"error": "Missing word"}
    
    language = data.get("language", "en")
    sentence = data.get("sentence", "")
    native = data.get("native", "vi")
    
    lang = normalize_language(language)
    voice = VOICE_MAP.get(lang, VOICE_MAP["en"])
    
    # Tạo tên file an toàn
    safe_word = re.sub(r'[^a-zA-Z0-9_]', '_', word.lower())
    # Đường dẫn tương đối: audio/lang/safe_word.mp3
    relative_path = f"{lang}/{safe_word}.mp3"
    filepath = os.path.join(AUDIO_DIR, relative_path)
    
    tasks = []
    if lang == "en":
        tasks.append(("ipa", generate_ipa_async(word)))
    else:
        tasks.append(("ipa", asyncio.sleep(0, None)))
    
    if sentence:
        tasks.append(("meaning", get_context_meaning(word, sentence, native, lang)))
    else:
        tasks.append(("meaning", asyncio.sleep(0, None)))
    
    tasks.append(("audio", generate_audio(word, voice, filepath)))
    
    results = await asyncio.gather(
        *(task for _, task in tasks),
        return_exceptions=True
    )
    
    result_dict = {}
    for (name, _), res in zip(tasks, results):
        result_dict[name] = None if isinstance(res, Exception) else res
    
    return {
        "word": word,
        "ipa": result_dict.get("ipa"),
        "meaning": result_dict.get("meaning"),
        "audio": f"http://localhost:8000/audio/{relative_path}"
    }