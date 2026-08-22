from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
import eng_to_ipa as ipa
import edge_tts
import os
import re
import asyncio
from functools import lru_cache
from datetime import datetime, timedelta
from deep_translator import GoogleTranslator
import stanza  

app = FastAPI()

AUDIO_DIR = "audio"
os.makedirs(AUDIO_DIR, exist_ok=True)
app.mount("/audio", StaticFiles(directory=AUDIO_DIR), name="audio")


# -------------------- VOICE MAP --------------------

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


# -------------------- CACHING --------------------

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
        "en-us": "en",
        "en-gb": "en",
        "en-au": "en",
        "fr-fr": "fr",
        "fr-ca": "fr",
        "es-es": "es",
        "es-mx": "es",
        "es-us": "es",
        "pt-br": "pt",
        "pt-pt": "pt",
        "zh-cn": "zh",
        "zh-tw": "zh",
        "zh-hans": "zh",
        "zh-hant": "zh",
        "nb": "no",
        "nn": "no",
        "iw": "he",
    }

    return aliases.get(lang, lang.split("-")[0])


meaning_cache = {}
CACHE_TTL = timedelta(minutes=15)

# -------------------- STANZA PIPELINE CACHE --------------------
stanza_pipelines = {}


def get_stanza_pipeline(lang: str):
    """Lấy pipeline stanza cho ngôn ngữ, tải mới nếu chưa có."""
    if lang not in stanza_pipelines:
        try:
            print(f"Đang tải pipeline stanza cho ngôn ngữ: {lang}")
            # Bỏ tham số quiet để tương thích với mọi phiên bản
            stanza.download(lang)
            pipeline = stanza.Pipeline(lang, processors='tokenize,pos', use_gpu=False, verbose=False)
            stanza_pipelines[lang] = pipeline
            print(f"Pipeline cho {lang} đã tải thành công.")
        except Exception as e:
            print(f"Lỗi khi tải pipeline cho {lang}: {e}")
            stanza_pipelines[lang] = None
    return stanza_pipelines[lang]

# -------------------- GOOGLE TRANSLATOR --------------------

def translate_context_sync(
    word: str,
    sentence: str,
    native: str,
    language: str
):
    if not sentence:
        return None

    translator = GoogleTranslator(
        source=language,
        target=native
    )

    pattern = r"\b" + re.escape(word) + r"\b"

    # 3 kiểu marker, ưu tiên marker rõ ràng nhất
    markers = [
        ("(", ")"),
        (("((", "))")),
        ("[[", "]]"),
    ]

    for start, end in markers:

        marked = re.sub(
            pattern,
            f"{start}{word}{end}",
            sentence,
            count=1,
            flags=re.IGNORECASE
        )

        try:
            translated = translator.translate(marked)

            print(f"\nOriginal:   {marked}")
            print(f"Translated: {translated}")

            # Tìm từ nằm giữa marker
            regex = (
                re.escape(start)
                + r"(.*?)"
                + re.escape(end)
            )

            match = re.search(
                regex,
                translated
            )

            if match:
                result = match.group(1).strip()

                if result:
                    print(f"Meaning:    {result}")
                    return result

        except Exception as e:
            print(
                f"Translation failed with "
                f"{start}{end}: {e}"
            )

    print("Không lấy được nghĩa.")
    return None


async def get_context_meaning(
    word: str,
    sentence: str,
    native: str,
    language: str
):
    if not sentence:
        return None

    key = (
        word.lower(),
        sentence,
        native,
        language
    )

    now = datetime.now()

    # Cache
    if key in meaning_cache:
        value, timestamp = meaning_cache[key]

        if now - timestamp < CACHE_TTL:
            return value

        del meaning_cache[key]

    # Chạy GoogleTranslator trong thread
    loop = asyncio.get_running_loop()

    result = await loop.run_in_executor(
        None,
        translate_context_sync,
        word,
        sentence,
        native,
        language
    )

    meaning_cache[key] = (
        result,
        now
    )

    return result


# -------------------- IPA --------------------

async def generate_ipa_async(word: str):

    loop = asyncio.get_running_loop()

    return await loop.run_in_executor(
        None,
        generate_ipa_sync,
        word
    )


# -------------------- AUDIO --------------------

async def generate_audio(
    word: str,
    voice: str,
    filepath: str
):

    os.makedirs(
        os.path.dirname(filepath),
        exist_ok=True
    )

    if not os.path.exists(filepath):

        await edge_tts.Communicate(
            text=word,
            voice=voice
        ).save(filepath)

    return filepath


# -------------------- POS (stanza) --------------------

def get_pos_sync(word: str, sentence: str, lang: str):
    if not sentence or not lang:
        return None

    pipeline = get_stanza_pipeline(lang)
    if pipeline is None:
        print(f"Pipeline cho {lang} là None, không thể lấy POS.")
        return None

    try:
        doc = pipeline(sentence)
        # Lấy danh sách token text
        tokens = []
        for sent in doc.sentences:
            for token in sent.tokens:
                tokens.append(token.text)
        print(f"Stanza tokens: {tokens}")

        # Tìm token khớp với word
        for sent in doc.sentences:
            for token in sent.tokens:
                if token.text.lower() == word.lower():
                    return token.words[0].upos
                for w in token.words:
                    if w.text.lower() == word.lower():
                        return w.upos
        print(f"Không tìm thấy token '{word}' trong các token: {tokens}")
        return None
    except Exception as e:
        print(f"Stanza POS error: {e}")
        return None


async def get_pos_async(word: str, sentence: str, lang: str):
    if not sentence:
        return None
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(
        None,
        get_pos_sync,
        word,
        sentence,
        lang
    )


# -------------------- ENDPOINT --------------------

@app.post("/ipa")
async def get_ipa(data: dict):

    word = data.get(
        "word",
        ""
    ).strip()

    if not word:
        return {
            "error": "Missing word"
        }

    language = data.get(
        "language",
        "en"
    )

    sentence = data.get(
        "sentence",
        ""
    )

    native = data.get(
        "native",
        "vi"
    )

    lang = normalize_language(
        language
    )

    voice = VOICE_MAP.get(
        lang,
        VOICE_MAP["en"]
    )

    # --------------------
    # Audio filename
    # --------------------

    safe_word = re.sub(
        r"[^a-zA-Z0-9_]",
        "_",
        word.lower()
    )

    relative_path = (
        f"{lang}/{safe_word}.mp3"
    )

    filepath = os.path.join(
        AUDIO_DIR,
        relative_path
    )

    # --------------------
    # Tasks
    # --------------------

    tasks = []

    # IPA chỉ dành cho tiếng Anh
    if lang == "en":
        tasks.append(
            (
                "ipa",
                generate_ipa_async(word)
            )
        )
    else:
        tasks.append(
            (
                "ipa",
                asyncio.sleep(0, None)
            )
        )

    # Context meaning
    if sentence:
        tasks.append(
            (
                "meaning",
                get_context_meaning(
                    word,
                    sentence,
                    native,
                    lang
                )
            )
        )
    else:
        tasks.append(
            (
                "meaning",
                asyncio.sleep(0, None)
            )
        )

    # POS (stanza) – chỉ khi có câu
    if sentence:
        tasks.append(
            (
                "pos",
                get_pos_async(word, sentence, lang)
            )
        )
    else:
        tasks.append(
            (
                "pos",
                asyncio.sleep(0, None)
            )
        )

    # Audio
    tasks.append(
        (
            "audio",
            generate_audio(
                word,
                voice,
                filepath
            )
        )
    )

    # Chạy song song
    results = await asyncio.gather(
        *(task for _, task in tasks),
        return_exceptions=True
    )

    result_dict = {}

    for (name, _), res in zip(
        tasks,
        results
    ):

        result_dict[name] = (
            None
            if isinstance(res, Exception)
            else res
        )

    return {
        "word": word,
        "ipa": result_dict.get("ipa"),
        "meaning": result_dict.get("meaning"),
        "pos": result_dict.get("pos"),      
        "audio": f"http://localhost:8000/audio/{relative_path}"
    }