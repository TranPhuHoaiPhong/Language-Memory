import asyncio
import re
from datetime import datetime, timedelta

from deep_translator import GoogleTranslator, MyMemoryTranslator


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

            result = _extract_between_markers(translated, start, end)

            if not result:
                continue

            if _is_untranslated(result, word):
                best_unchanged = best_unchanged or result
                continue

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

    try:

        result = _translate_word_alone(
            word,
            native,
            language
        )

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
        return overall_unchanged

    return None


async def get_context_meaning(
    word: str,
    sentence: str,
    native: str,
    language: str
):

    # key = (
    #     word.lower(),
    #     sentence,
    #     native,
    #     language
    # )

    # now = datetime.now()

    # if key in meaning_cache:

    #     value, timestamp = meaning_cache[key]

    #     if now - timestamp < CACHE_TTL:
    #         return value

    #     del meaning_cache[key]

    # loop = asyncio.get_running_loop()

    # result = await loop.run_in_executor(
    #     None,
    #     translate_context_sync,
    #     word,
    #     sentence,
    #     native,
    #     language
    # )

    # meaning_cache[key] = (
    #     result,
    #     now
    # )

    # return result
    return ""