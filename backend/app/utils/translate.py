import asyncio
import re
import random
from pathlib import Path

from deep_translator import GoogleTranslator


CONCURRENCY = 5           # số worker chạy song song
AMOUNT = 10               # số câu gộp vào 1 request dịch (tăng -> ít request hơn)
MAX_PARALLEL_REQUESTS = 5 # số request HTTP đồng thời tối đa
MAX_RETRIES = 5
BASE_DELAY = 1.0

# CONCURRENCY = 1            # Trước: 5 → chỉ 1 worker xử lý tuần tự
# AMOUNT = 3                 # Trước: 10 → gộp ít câu hơn mỗi request
# MAX_PARALLEL_REQUESTS = 1  # Trước: 5 → chỉ 1 request chạm Google cùng lúc
# MAX_RETRIES = 5            # Trước: 3 → tăng số lần thử lại
# BASE_DELAY = 2.0           # Trước: 1.0 → giãn cách giữa các lần retry

# Dấu phân cách dùng để nối nhiều câu lại thành 1 chuỗi trước khi dịch.
# Dùng chuỗi hiếm gặp, không có nghĩa, để Google Translate không dịch/xóa nó.
DELIMITER = "\n@@@\n"


def split_translated_batch(translated_text, expected_count):
    """
    Tách kết quả dịch gộp trở lại thành từng câu.
    Trả về None nếu số lượng không khớp (để fallback dịch từng câu).
    """
    if not translated_text:
        return None

    parts = re.split(r"\n?\s*@@@\s*\n?", translated_text)
    parts = [p.strip() for p in parts if p.strip() != ""]

    if len(parts) != expected_count:
        return None

    return parts


async def translate_batch_joined(
    texts,
    source_language,
    target_language,
    semaphore,
    retries=MAX_RETRIES
):
    """
    Dịch nhiều câu trong 1 request bằng cách nối chúng lại với DELIMITER.
    Nếu tách kết quả không khớp số lượng câu, tự động fallback dịch từng câu riêng.
    """
    joined_text = DELIMITER.join(texts)

    for attempt in range(retries):
        try:
            async with semaphore:
                await asyncio.sleep(random.uniform(0, 0.2))

                loop = asyncio.get_running_loop()

                def _translate():
                    translator = GoogleTranslator(
                        source=source_language,
                        target=target_language
                    )
                    return translator.translate(joined_text)

                result = await loop.run_in_executor(None, _translate)

                if not result:
                    raise ValueError("Empty translation result")

                parts = split_translated_batch(result, len(texts))

                if parts is not None:
                    return parts

                return await translate_each_individually(
                    texts, source_language, target_language, semaphore
                )

        except Exception as e:
            if attempt == retries - 1:
                return await translate_each_individually(
                    texts, source_language, target_language, semaphore
                )

            delay = (
                BASE_DELAY * (2 ** attempt)
                + random.uniform(0, 0.5)
            )

            await asyncio.sleep(delay)


async def translate_each_individually(
    texts,
    source_language,
    target_language,
    semaphore,
    retries=MAX_RETRIES
):
    """
    Fallback: dịch từng câu riêng lẻ (chậm hơn, chỉ dùng khi gộp batch lỗi).
    """
    async def translate_one(text):
        for attempt in range(retries):
            try:
                async with semaphore:
                    await asyncio.sleep(random.uniform(0, 0.2))
                    loop = asyncio.get_running_loop()

                    def _translate():
                        translator = GoogleTranslator(
                            source=source_language,
                            target=target_language
                        )
                        return translator.translate(text)

                    result = await loop.run_in_executor(None, _translate)

                    if result:
                        return result

                    raise ValueError("Empty translation result")

            except Exception as e:
                if attempt == retries - 1:
                    return text  # dùng lại bản gốc nếu vẫn lỗi

                delay = BASE_DELAY * (2 ** attempt) + random.uniform(0, 0.5)
                await asyncio.sleep(delay)

    tasks = [translate_one(t) for t in texts]
    return await asyncio.gather(*tasks)


def time_to_seconds(time):
    h, m, s = time.split(":")
    return int(h) * 3600 + int(m) * 60 + float(s)


async def translate_transcript(
    transcript_text,
    target_language,
    native_language
):
    source_language = target_language.lower().split("-")[0]   # ngôn ngữ phụ đề tìm được = nguồn
    target_language = native_language.lower().split("-")[0]    # ngôn ngữ người dùng muốn = đích

    lines = [
        line.strip()
        for line in transcript_text.split("\n")
        if line.strip()
    ]

    parsed = []
    pattern = re.compile(r"^(\d{2}:\d{2}:\d{2}\.\d{3})\s+(.+)$")

    for line in lines:
        match = pattern.match(line)
        if not match:
            continue
        parsed.append({
            "time": match.group(1),
            "english": match.group(2)
        })

    if not parsed:
        return []

    if source_language == target_language:
        result = []
        for index, item in enumerate(parsed):
            start = time_to_seconds(item["time"])
            end = (
                time_to_seconds(parsed[index + 1]["time"])
                if index < len(parsed) - 1 else start
            )
            result.append({
                "start": start,
                "end": end,
                "original": item["english"],
                "translated": item["english"]
            })
        return result

    translated_items = [None] * len(parsed)
    next_index = 0
    lock = asyncio.Lock()
    semaphore = asyncio.Semaphore(MAX_PARALLEL_REQUESTS)

    async def worker(worker_id):
        nonlocal next_index

        while True:
            async with lock:
                current = next_index
                next_index += AMOUNT

            if current >= len(parsed):
                return

            items = parsed[current:current + AMOUNT]
            texts = [item["english"] for item in items]

            translated = await translate_batch_joined(
                texts, source_language, target_language, semaphore
            )

            for idx, item in enumerate(items):
                translated_items[current + idx] = {
                    "time": item["time"],
                    "english": item["english"],
                    "translated": translated[idx]
                }

    workers = [
        worker(i + 1)
        for i in range(min(CONCURRENCY, len(parsed)))
    ]

    await asyncio.gather(*workers)

    result = []
    for index, item in enumerate(translated_items):
        start = time_to_seconds(item["time"])
        end = (
            time_to_seconds(translated_items[index + 1]["time"])
            if index < len(translated_items) - 1 else start
        )
        result.append({
            "start": start,
            "end": end,
            "original": item["english"],
            "translated": item["translated"]
        })

    return result