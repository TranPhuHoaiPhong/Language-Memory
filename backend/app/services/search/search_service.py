import asyncio
import os
import re

from app.config import AUDIO_DIR
from app.utils.text import get_sentence

from app.services.search.voice_map import VOICE_MAP
from app.services.search.language_service import normalize_language
from app.services.search.ipa_service import generate_ipa_async
from app.services.search.translation_service import get_context_meaning
from app.services.search.pos_service import get_pos_async
from app.services.search.audio_service import generate_audio


from dotenv import load_dotenv

load_dotenv()

AUDIO_BASE_URL = os.getenv("AUDIO_BASE_URL")


# ============================================================
# SEARCH SERVICE
# ============================================================

async def search_service(
    word: str,
    language: str,
    subtitle,
    source_language: str | None
):

    if not word:
        return None

    word = word.strip()

    # ========================================================
    # SOURCE / NATIVE LANGUAGE
    # ========================================================

    lang = normalize_language(
        source_language
    )

    native = normalize_language(
        language
    )

    # ========================================================
    # LẤY CÂU GỐC TỪ SUBTITLE
    # ========================================================

    sentence = ""

    if isinstance(subtitle, dict):

        sentence = subtitle.get(
            "original",
            ""
        )

    elif isinstance(subtitle, str):

        sentence = get_sentence(
            word,
            subtitle
        )

    sentence = (
        sentence.strip()
        if isinstance(sentence, str)
        else ""
    )

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
    # vì get_context_meaning có fallback dịch từ đơn lẻ)
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

            print(
                f"[SEARCH SERVICE ERROR] "
                f"{name}: {res}"
            )

            result_dict[name] = None

        else:

            result_dict[name] = res

    # ========================================================
    # AUDIO URL
    # ========================================================
    # Chỉ trả về URL nếu file audio thực sự tồn tại trên đĩa
    # (tránh trả về link 404 khi generate_audio lỗi/timeout).

    audio_ready = (
        result_dict.get("audio") is not None
        and os.path.exists(filepath)
    )

    audio_url = (
        f"{AUDIO_BASE_URL}/{relative_path}"
        if audio_ready
        else None
    )

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
            "audio": audio_url
        }
    }

    return result