from youtube_transcript_api import YouTubeTranscriptApi
import pysbd
import torch
import time

start = time.time()

from transformers import (
    MarianMTModel,
    MarianTokenizer
)

# ==========================
# CONFIG
# ==========================

MODEL_NAME = "Helsinki-NLP/opus-mt-en-vi"
VIDEO_ID = "RfhJAi7XLYg"
BATCH_SIZE = FIRST_BATCH = 10

# ==========================
# LOAD MODEL
# ==========================

print("Loading MarianMT...")

tokenizer = MarianTokenizer.from_pretrained(
    MODEL_NAME
)

model = MarianMTModel.from_pretrained(
    MODEL_NAME
)

model.eval()

torch.set_num_threads(8)

print("Model loaded!")

# ==========================
# UTILS
# ==========================

def format_time(seconds):
    m = int(seconds // 60)
    s = int(seconds % 60)
    return f"00:{m:02}:{s:02}"


def translate_batch(texts):

    inputs = tokenizer(
        texts,
        return_tensors="pt",
        padding=True,
        truncation=True
    )

    with torch.inference_mode():

        outputs = model.generate(
            **inputs,
            max_new_tokens=256
        )

    return [
        tokenizer.decode(
            output,
            skip_special_tokens=True
        )
        for output in outputs
    ]


# ==========================
# STREAM TRANSLATE
# ==========================

def subtitle_stream(video_id):

    api = YouTubeTranscriptApi()

    transcript = api.fetch(video_id)

    segmenter = pysbd.Segmenter(
        language="en",
        clean=False
    )

    buffer_text = []
    current_time = None

    sentence_buffer = []

    for item in transcript:

        text = item.text.strip()

        if not buffer_text:
            current_time = item.start

        buffer_text.append(text)

        if text.endswith((".", "?", "!")):

            merged_text = " ".join(
                buffer_text
            )

            segmented = segmenter.segment(
                merged_text
            )

            for sentence in segmented:

                sentence_buffer.append({
                    "time": current_time,
                    "text": sentence
                })

            buffer_text = []
            current_time = None

        # Đủ batch thì dịch ngay
        if len(sentence_buffer) >= BATCH_SIZE:

            texts = [
                x["text"]
                for x in sentence_buffer
            ]

            translations = translate_batch(
                texts
            )

            result = []

            for item, vi in zip(
                sentence_buffer,
                translations
            ):

                result.append({
                    "time": item["time"],
                    "en": item["text"],
                    "vi": vi
                })

            yield result

            sentence_buffer = []

    # xử lý phần còn lại
    if buffer_text:

        sentence_buffer.append({
            "time": current_time,
            "text": " ".join(buffer_text)
        })

    if sentence_buffer:

        texts = [
            x["text"]
            for x in sentence_buffer
        ]

        translations = translate_batch(
            texts
        )

        result = []

        for item, vi in zip(
            sentence_buffer,
            translations
        ):

            result.append({
                "time": item["time"],
                "en": item["text"],
                "vi": vi
            })

        yield result


# ==========================
# DEMO
# ==========================

for batch in subtitle_stream(VIDEO_ID):

    print(
        f"\n===== BATCH ({len(batch)}) =====\n"
    )

    for item in batch:

        print(
            format_time(item["time"])
        )

        print(
            "EN:",
            item["en"]
        )

        print(
            "VI:",
            item["vi"]
        )

        print("-" * 50)

        print(time.time() - start)