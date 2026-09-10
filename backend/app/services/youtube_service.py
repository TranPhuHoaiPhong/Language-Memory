import asyncio
import json
import subprocess
import requests
import re

from app.utils.translate import (
    translate_transcript
)

def _run_ytdlp(video_id: str):
    url = f"https://www.youtube.com/watch?v={video_id}"

    result = subprocess.run(
        [
            "yt-dlp",
            "--dump-single-json",
            "--skip-download",
            "--write-subs",
            "--write-auto-subs",
            url,
        ],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )

    if result.returncode != 0:
        raise RuntimeError(
            result.stderr or "yt-dlp failed"
        )

    try:
        return json.loads(result.stdout)

    except json.JSONDecodeError as error:
        raise RuntimeError(
            f"Invalid yt-dlp JSON: {error}"
        )

def convert_transcript_to_text(data):

    if isinstance(data, str):
        data = json.loads(data)

    # -----------------------------------------------------
    # Format time
    # -----------------------------------------------------

    def format_time(ms):

        h = ms // 3600000
        m = (ms % 3600000) // 60000
        s = (ms % 60000) // 1000
        ms_part = ms % 1000

        return (
            f"{h:02d}:"
            f"{m:02d}:"
            f"{s:02d}."
            f"{ms_part:03d}"
        )

    # -----------------------------------------------------
    # Append word
    # -----------------------------------------------------

    def append_word(sentence, text):

        if not sentence:
            return text.strip()

        # Giữ nguyên khoảng trắng đầu text
        if re.match(r"^\s", text):
            return sentence + text

        # Không thêm space trước punctuation
        if re.match(r'^[,.;!?:"\')\]]', text):
            return sentence + text

        return sentence + " " + text

    # -----------------------------------------------------
    # Clean text
    # -----------------------------------------------------

    def clean_text(text):

        text = text.replace(">>", "")

        text = re.sub(
            r"\[[^\]]*\]",
            "",
            text,
            flags=re.IGNORECASE
        )

        text = re.sub(
            r"[♪♫♬]",
            "",
            text
        )

        return text.strip()

    # -----------------------------------------------------
    # Word count
    # -----------------------------------------------------

    def word_count(text):
        return len(
            text.split()
        )

    # -----------------------------------------------------
    # Check sentence ending
    # -----------------------------------------------------

    def is_end_sentence(text):

        return bool(
            re.search(
                r'[.!?]["\')\]]*$',
                text.strip()
            )
        )

    # -----------------------------------------------------
    # Save sentence
    # -----------------------------------------------------

    def save_sentence(result, start, text):

        # Giống JS:
        # text.replace(/\s+/g," ")
        text = re.sub(
            r"\s+",
            " ",
            text
        ).strip()

        # Giống JS:
        # .replace(/[.,!?…]+$/g, "")
        text = re.sub(
            r"[.,!?…]+$",
            "",
            text
        )

        if not text:
            return

        result.append(
            f"{format_time(start)} {text}"
        )

    # =====================================================
    # PROCESS EVENTS
    # =====================================================

    result = []

    current = ""
    start_time = None
    buffer = []

    for event in data.get("events", []):

        if not event.get("segs"):
            continue

        for seg in event["segs"]:

            if not seg.get("utf8"):
                continue

            text = clean_text(
                seg["utf8"]
            )

            if not text:
                continue

            # event.tStartMs + seg.tOffsetMs
            time = (
                event.get("tStartMs", 0)
                +
                seg.get("tOffsetMs", 0)
            )

            if start_time is None:
                start_time = time

            current = append_word(
                current,
                text
            )

            # ---------------------------------------------
            # Sentence finished
            # ---------------------------------------------

            if is_end_sentence(text):

                if buffer:

                    current = (
                        " ".join(buffer)
                        + " "
                        + current
                    )

                    buffer = []

                save_sentence(
                    result,
                    start_time,
                    current
                )

                current = ""
                start_time = None

    # =====================================================
    # REMAINING TEXT
    # =====================================================

    if current.strip():

        if buffer:

            current = (
                " ".join(buffer)
                + " "
                + current
            )

        save_sentence(
            result,
            start_time or 0,
            current
        )

    return "\n".join(result)

async def process_id(
    video_id: str,
    target_language: str,
    native_language: str
):
    """
    Tìm transcript theo target_language,
    tải trực tiếp JSON3 và lưu thành file JSON.
    """

    # =====================================================
    # GET YOUTUBE INFO
    # =====================================================

    info = await asyncio.to_thread(
        _run_ytdlp,
        video_id
    )


    # =====================================================
    # NORMALIZE LANGUAGE
    # =====================================================

    requested_lang = (
        target_language
        .lower()
        .strip()
    )


    # =====================================================
    # FIND SUBTITLE
    # =====================================================

    # Ưu tiên phụ đề thủ công
    subtitle_groups = (
        info.get("subtitles") or {}
    )


    # Nếu không có phụ đề thủ công
    # thì dùng phụ đề tự động
    if not subtitle_groups:

        subtitle_groups = (
            info.get("automatic_captions") or {}
        )


    if not subtitle_groups:

        raise RuntimeError(
            "Transcript not found"
        )


    # =====================================================
    # FIND LANGUAGE
    # =====================================================

    keys = list(
        subtitle_groups.keys()
    )

    found_lang = None


    # -----------------------------------------------------
    # 1. EXACT MATCH
    # -----------------------------------------------------

    for key in keys:

        if key.lower() == requested_lang:

            found_lang = key

            break


    # -----------------------------------------------------
    # 2. BASE LANGUAGE MATCH
    # -----------------------------------------------------
    # en -> en-US
    # en -> en-GB
    # zh -> zh-Hans
    # ...

    if not found_lang:

        for key in keys:

            if key.lower().startswith(
                requested_lang + "-"
            ):

                found_lang = key

                break


    if not found_lang:

        raise RuntimeError(
            f"Transcript not found for language: "
            f"{target_language}"
        )


    # =====================================================
    # GET TRACKS
    # =====================================================

    tracks = subtitle_groups.get(
        found_lang
    )


    if not tracks:

        raise RuntimeError(
            "Transcript not found"
        )


    # =====================================================
    # FIND JSON3
    # =====================================================

    json_sub = next(
        (
            item
            for item in tracks
            if item.get("ext") == "json3"
        ),
        None
    )


    if not json_sub:

        raise RuntimeError(
            f"JSON3 subtitle not found for "
            f"language: {found_lang}"
        )


    # =====================================================
    # DOWNLOAD TRANSCRIPT
    # =====================================================

    subtitle_url = json_sub.get("url")


    if not subtitle_url:

        raise RuntimeError(
            "Transcript URL not found"
        )


    response = await asyncio.to_thread(
        requests.get,
        subtitle_url
    )


    response.raise_for_status()


    # =====================================================
    # PARSE JSON
    # =====================================================

    data = response.json()

    # =================================================
    # CONVERT
    # =================================================

    transcript_text = (
        convert_transcript_to_text(data)
    )

    # =================================================
    # TRANSLATE
    # =================================================

    subtitle = await translate_transcript(
        transcript_text,
        target_language,
        native_language
    )

    # =====================================================
    # RETURN RESULT
    # =====================================================

    return {
        "video_id": video_id,
        "language": found_lang,
        "target_language": target_language,
        "native_language": native_language,
        "subtitle": subtitle
    }