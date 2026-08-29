import asyncio
import json
import subprocess
from urllib.parse import (
    urlparse,
    parse_qs,
    urlencode,
    urlunparse,
)


def _run_ytdlp(video_id: str):

    url = (
        f"https://www.youtube.com/watch?v={video_id}"
    )

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
            result.stderr
            or "yt-dlp failed"
        )

    try:
        return json.loads(result.stdout)

    except json.JSONDecodeError as error:

        raise RuntimeError(
            f"Invalid yt-dlp JSON: {error}"
        )


async def process_id(
    video_id: str,
    language: str
):

    # Chạy subprocess blocking bên ngoài event loop
    info = await asyncio.to_thread(
        _run_ytdlp,
        video_id
    )

    # =====================================================
    # LẤY SUBTITLE
    # =====================================================

    subtitle_groups = (
        info.get("automatic_captions")
        or {}
    )

    if not subtitle_groups:

        subtitle_groups = (
            info.get("subtitles")
            or {}
        )

    if not subtitle_groups:

        raise RuntimeError(
            "Transcript not found"
        )

    keys = list(
        subtitle_groups.keys()
    )

    # =====================================================
    # CHỌN LANGUAGE
    # =====================================================

    preferred = info.get("language")

    first_lang = None

    if preferred:

        preferred = preferred.lower()

        # Exact match
        for key in keys:

            if key.lower() == preferred:

                first_lang = key

                break

        # Base language
        if not first_lang:

            base = preferred.split("-")[0]

            for key in keys:

                if key.lower() == base:

                    first_lang = key

                    break

        # base-*
        if not first_lang:

            base = preferred.split("-")[0]

            for key in keys:

                if key.lower().startswith(
                    base + "-"
                ):

                    first_lang = key

                    break

    # Fallback
    if not first_lang:

        first_lang = keys[0]

    tracks = subtitle_groups.get(
        first_lang
    )

    if not tracks:

        raise RuntimeError(
            "Transcript not found"
        )

    # =====================================================
    # CHỌN TRACK
    # =====================================================

    track = next(
        (
            item
            for item in tracks
            if item.get("ext") == "json3"
        ),
        None
    )

    if not track:

        track = next(
            (
                item
                for item in tracks
                if item.get("ext") == "vtt"
            ),
            None
        )

    if not track:

        track = tracks[0]

    subtitle_url = track.get("url")

    if not subtitle_url:

        raise RuntimeError(
            "Transcript URL not found"
        )

    # =====================================================
    # URL
    # =====================================================

    parsed = urlparse(
        subtitle_url
    )

    params = parse_qs(
        parsed.query
    )

    # Force json3
    params["fmt"] = ["json3"]

    lang = params.get(
        "lang",
        [first_lang]
    )[0]

    # =====================================================
    # SOURCE = TARGET
    # =====================================================

    if lang.lower() == language.lower():

        return {
            "dta": lang,
            "lang": lang,
        }

    # =====================================================
    # REMOVE tlang
    # =====================================================

    params.pop(
        "tlang",
        None
    )

    new_query = urlencode(
        params,
        doseq=True
    )

    final_url = urlunparse(
        parsed._replace(
            query=new_query
        )
    )

    return {
        "dta": final_url,
        "lang": lang,
    }