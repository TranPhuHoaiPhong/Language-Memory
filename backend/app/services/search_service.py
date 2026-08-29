import asyncio
import re
import os
from functools import lru_cache
from datetime import datetime, timedelta

import eng_to_ipa as ipa
import edge_tts
import stanza
from deep_translator import GoogleTranslator, MyMemoryTranslator

from app.utils.text import get_sentence


BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.abspath(__file__)
    )
)

AUDIO_DIR = os.path.join(
    BASE_DIR,
    "audio"
)

os.makedirs(
    AUDIO_DIR,
    exist_ok=True
)


# ============================================================
# VOICE MAP
# ============================================================

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


# ============================================================
# LANGUAGE
# ============================================================

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

    return aliases.get(
        lang,
        lang.split("-")[0]
    )


# ============================================================
# IPA
# ============================================================

@lru_cache(maxsize=2048)
def generate_ipa_sync(word: str):

    result = ipa.convert(word)

    if result.lower() != word.lower():
        return result

    return None


async def generate_ipa_async(word: str):

    loop = asyncio.get_running_loop()

    return await loop.run_in_executor(
        None,
        generate_ipa_sync,
        word
    )


# ============================================================
# MEANING CACHE
# ============================================================

meaning_cache = {}

CACHE_TTL = timedelta(
    minutes=15
)


# Các kiểu dấu đánh dấu để thử, theo thứ tự ưu tiên.
# Ưu tiên các ký tự HIẾM bị Google dịch/xóa, và không phải ký tự
# ngữ pháp phổ biến như dấu ngoặc đơn thường (dễ bị dịch lẫn vào câu).
MARKER_SETS = [
    ("⟦⟦", "⟧⟧"),
    ("【【", "】】"),
    ("(( ", " ))"),
    ("[[ ", " ]]"),
    ("( ", " )"),
]


def _extract_between_markers(translated: str, start: str, end: str):
    regex = re.escape(start.strip()) + r"\s*(.*?)\s*" + re.escape(end.strip())
    match = re.search(regex, translated)

    if match:
        result = match.group(1).strip()
        if result:
            return result

    return None


def _normalize_for_compare(text: str):
    """Chuẩn hoá để so sánh: bỏ dấu câu, khoảng trắng thừa, chữ hoa/thường."""
    return re.sub(r"[^\w]", "", text).lower()


def _is_untranslated(result: str, word: str):
    """
    True nếu kết quả trích ra giống hệt từ gốc (không đổi ký tự nào)
    -> nhiều khả năng đây là từ vay mượn / Google không dịch, không
    phải nghĩa thật -> cần thử fallback khác.
    """
    return _normalize_for_compare(result) == _normalize_for_compare(word)


def _translate_with_markers(translator, sentence: str, word: str):
    """
    Thử dịch câu với từ được đánh dấu bằng nhiều kiểu ký tự khác nhau.
    Trả về nghĩa nếu tách được VÀ khác với từ gốc, None nếu không có
    kiểu nào thành công (hoặc tất cả đều trả về y hệt từ gốc).
    """
    pattern = r"\b" + re.escape(word) + r"\b"

    best_unchanged = None  # lưu lại kết quả "y hệt từ gốc" phòng khi
                            # không còn lựa chọn nào khác tốt hơn

    for start, end in MARKER_SETS:

        marked = re.sub(
            pattern,
            f"{start}{word}{end}",
            sentence,
            count=1,
            flags=re.IGNORECASE
        )

        # Nếu re.sub không tìm thấy từ trong câu (không thay đổi gì) thì bỏ qua
        if marked == sentence:
            continue

        try:
            translated = translator.translate(marked)

            # print(f"\n[MARKER {start.strip()}{end.strip()}] Original:   {marked}")
            # print(f"[MARKER {start.strip()}{end.strip()}] Translated: {translated}")

            result = _extract_between_markers(translated, start, end)

            if not result:
                continue

            if _is_untranslated(result, word):
                # print(f"[MARKER UNCHANGED] '{result}' giống từ gốc -> thử tiếp")
                best_unchanged = best_unchanged or result
                continue

            # print(f"[MARKER OK] Meaning: {result}")
            return result, None

        except Exception as e:
            print(f"[MARKER FAILED] {start.strip()}{end.strip()}: {e}")

    return None, best_unchanged


def _translate_short_phrase(translator, sentence: str, word: str, window: int = 3):
    """
    Fallback 2: thay vì dịch cả câu dài (dễ đảo cấu trúc), chỉ lấy một
    cụm ngắn quanh từ (window từ trước + sau) rồi thử đánh dấu lại.
    Câu ngắn hơn => ít bị đảo trật tự => marker dễ giữ đúng vị trí hơn.
    Trả về (result, unchanged) giống _translate_with_markers.
    """
    tokens = sentence.split()

    lower_tokens = [t.strip(".,!?;:\"'()[]").lower() for t in tokens]
    target = word.lower()

    if target not in lower_tokens:
        return None, None

    idx = lower_tokens.index(target)

    start_idx = max(0, idx - window)
    end_idx = min(len(tokens), idx + window + 1)

    phrase = " ".join(tokens[start_idx:end_idx])

    return _translate_with_markers(translator, phrase, word)


def _translate_word_alone(word: str, native: str, language: str):
    """
    Fallback: dịch riêng từ đó, không có ngữ cảnh câu, thử LẦN LƯỢT
    nhiều engine dịch khác nhau (Google -> MyMemory), vì mỗi engine
    xử lý từ vay mượn (loanword) khác nhau. Trả về kết quả ĐẦU TIÊN
    không giống hệt từ gốc; nếu tất cả đều giống, trả về kết quả
    của engine đầu tiên (dùng làm phương án cuối, còn hơn không có gì).
    """
    engines = [
        ("Google", lambda: GoogleTranslator(source=language, target=native)),
        ("MyMemory", lambda: MyMemoryTranslator(source=language, target=native)),
    ]

    fallback_unchanged = None

    for name, make_translator in engines:
        try:
            translator = make_translator()
            result = translator.translate(word)

            if not result:
                continue

            result = result.strip()

            # print(f"[WORD-ONLY {name}] {word} -> {result}")

            if not _is_untranslated(result, word):
                return result

            fallback_unchanged = fallback_unchanged or result

        except Exception as e:
            print(f"[WORD-ONLY {name} FAILED] {e}")

    return fallback_unchanged


def translate_context_sync(
    word: str,
    sentence: str,
    native: str,
    language: str
):
    if not word:
        return None

    if not sentence:
        sentence = ""

    translator = GoogleTranslator(
        source=language,
        target=native
    )

    overall_unchanged = None

    # ========================================================
    # LỚP 1: DỊCH CẢ CÂU + ĐÁNH DẤU TỪ
    # ========================================================

    if sentence:

        try:
            result, unchanged = _translate_with_markers(
                translator,
                sentence,
                word
            )

            if result:
                return result

            if unchanged:
                overall_unchanged = unchanged

        except Exception as e:

            print(
                f"[CONTEXT ERROR] {e}"
            )

    # ========================================================
    # LỚP 2: DỊCH CỤM NGẮN QUANH TỪ
    # ========================================================

    if sentence:

        try:
            result, unchanged = _translate_short_phrase(
                translator,
                sentence,
                word
            )

            if result:
                return result

            if unchanged:
                overall_unchanged = (
                    overall_unchanged
                    or unchanged
                )

        except Exception as e:

            print(
                f"[SHORT PHRASE ERROR] {e}"
            )

    # ========================================================
    # LỚP 3: DỊCH RIÊNG TỪ
    # ========================================================

    # print(
    #     f"[WORD FALLBACK] "
    #     f"Không lấy được nghĩa từ context."
    # )

    # print(
    #     f"[WORD FALLBACK] "
    #     f"Dịch riêng word = '{word}'"
    # )

    try:

        result = _translate_word_alone(
            word,
            native,
            language
        )

        # print(
        #     f"[WORD FALLBACK] "
        #     f"'{word}' -> '{result}'"
        # )

        # Có kết quả và không phải chính từ gốc
        if result and not _is_untranslated(
            result,
            word
        ):
            return result

        if result:
            overall_unchanged = (
                overall_unchanged
                or result
            )

    except Exception as e:

        print(
            f"[WORD FALLBACK ERROR] {e}"
        )

    # ========================================================
    # LỚP 4: LOANWORD
    # ========================================================

    if overall_unchanged:

        # print(
        #     f"[LOANWORD] "
        #     f"'{word}' được giữ nguyên."
        # )

        return overall_unchanged

    # print(
    #     f"[MEANING ERROR] "
    #     f"Không lấy được nghĩa của '{word}'."
    # )

    return None


async def get_context_meaning(
    word: str,
    sentence: str,
    native: str,
    language: str
):

    key = (
        word.lower(),
        sentence,
        native,
        language
    )

    now = datetime.now()

    if key in meaning_cache:

        value, timestamp = meaning_cache[key]

        if now - timestamp < CACHE_TTL:
            return value

        del meaning_cache[key]

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


# ============================================================
# STANZA
# ============================================================

stanza_pipelines = {}


def get_stanza_pipeline(lang: str):

    if lang not in stanza_pipelines:

        try:

            # print(
            #     f"[STANZA] Loading pipeline: {lang}"
            # )

            stanza.download(lang)

            pipeline = stanza.Pipeline(
                lang,
                processors="tokenize,pos",
                use_gpu=False,
                verbose=False
            )

            stanza_pipelines[lang] = pipeline

            # print(
            #     f"[STANZA] Pipeline loaded: {lang}"
            # )

        except Exception as e:

            print(
                f"[STANZA ERROR] {lang}: {e}"
            )

            stanza_pipelines[lang] = None

    return stanza_pipelines[lang]


def get_pos_sync(
    word: str,
    sentence: str,
    lang: str
):

    if not sentence or not lang:
        return None

    pipeline = get_stanza_pipeline(
        lang
    )

    if pipeline is None:
        return None

    try:

        doc = pipeline(sentence)

        tokens = []

        for sent in doc.sentences:

            for token in sent.tokens:

                tokens.append(
                    token.text
                )

        # print(
        #     "[STANZA] tokens:",
        #     tokens
        # )

        for sent in doc.sentences:

            for token in sent.tokens:

                if token.text.lower() == word.lower():

                    return token.words[0].upos

                for w in token.words:

                    if w.text.lower() == word.lower():

                        return w.upos

        # print(
        #     f"[STANZA] "
        #     f"Cannot find '{word}'"
        # )

        return None

    except Exception as e:

        print(
            f"[STANZA ERROR] {e}"
        )

        return None


async def get_pos_async(
    word: str,
    sentence: str,
    lang: str
):

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


# ============================================================
# AUDIO
# ============================================================

async def generate_audio(
    word: str,
    voice: str,
    filepath: str
):

    directory = os.path.dirname(
        filepath
    )

    os.makedirs(
        directory,
        exist_ok=True
    )

    if not os.path.exists(filepath):

        await edge_tts.Communicate(
            text=word,
            voice=voice
        ).save(filepath)

    return filepath


# ============================================================
# SEARCH SERVICE
# ============================================================

async def search_service(
    word: str,
    language: str,
    subtitle,
    source_language: str | None
):

    # print("\n========================================")
    # print("[SEARCH SERVICE]")
    # print("word =", word)
    # print("language =", language)
    # print("subtitle =", subtitle)
    # print("source_language =", source_language)
    # print("========================================")

    if not word:
        return None

    word = word.strip()

    # ========================================================
    # SOURCE LANGUAGE
    # ========================================================

    lang = normalize_language(
        source_language
    )

    native = normalize_language(
        language
    )

    # print(
    #     "[SEARCH SERVICE] source language =",
    #     lang
    # )

    # print(
    #     "[SEARCH SERVICE] native language =",
    #     native
    # )

    # ========================================================
    # LẤY ORIGINAL TỪ SUBTITLE OBJECT
    # ========================================================

    sentence = ""

    if isinstance(subtitle, dict):

        sentence = subtitle.get(
            "original",
            ""
        )

        # print(
        #     "[SEARCH SERVICE] "
        #     "subtitle object detected"
        # )

    elif isinstance(subtitle, str):

        sentence = get_sentence(
            word,
            subtitle
        )

    else:

        sentence = ""

    sentence = (
        sentence.strip()
        if isinstance(sentence, str)
        else ""
    )

    # print(
    #     "[SEARCH SERVICE] sentence =",
    #     sentence
    # )

    # ========================================================
    # VOICE
    # ========================================================

    voice = VOICE_MAP.get(
        lang,
        VOICE_MAP["en"]
    )

    # ========================================================
    # AUDIO PATH
    # ========================================================

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

    # ========================================================
    # TASKS
    # ========================================================

    tasks = []

    # ------------------------
    # IPA
    # ------------------------

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
                asyncio.sleep(
                    0,
                    result=None
                )
            )
        )

    # ------------------------
    # MEANING (luôn chạy, kể cả khi không có sentence,
    # vì get_context_meaning giờ có fallback dịch từ đơn lẻ)
    # ------------------------

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

    # ------------------------
    # POS
    # ------------------------

    if sentence:

        tasks.append(
            (
                "pos",
                get_pos_async(
                    word,
                    sentence,
                    lang
                )
            )
        )

    else:

        tasks.append(
            (
                "pos",
                asyncio.sleep(
                    0,
                    result=None
                )
            )
        )

    # ------------------------
    # AUDIO
    # ------------------------

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

    # ========================================================
    # RUN PARALLEL
    # ========================================================

    # print(
    #     "[SEARCH SERVICE] "
    #     "Running IPA / meaning / POS / audio..."
    # )

    results = await asyncio.gather(
        *(task for _, task in tasks),
        return_exceptions=True
    )

    result_dict = {}

    for (name, _), res in zip(
        tasks,
        results
    ):

        if isinstance(
            res,
            Exception
        ):

            # print(
            #     f"[SEARCH SERVICE ERROR] "
            #     f"{name}: {res}"
            # )

            result_dict[name] = None

        else:

            result_dict[name] = res

    # ========================================================
    # RESULT
    # ========================================================

    result = {
        "success": True,
        "data": {
            "word": word,
            "ipa": result_dict.get("ipa"),
            "pos": result_dict.get("pos"),
            "meaning": result_dict.get("meaning"),
            "audio": (
                f"http://localhost:3000/audio/"
                f"{relative_path}"
            )
        }
    }

    # print("\n========================================")
    # print("[SEARCH SERVICE] RESULT")
    # print(result)
    # print("========================================\n")

    return result