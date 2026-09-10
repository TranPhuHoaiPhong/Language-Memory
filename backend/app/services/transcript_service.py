import json
from pathlib import Path

import brotli

from app.database.mongodb import (
    subtitle_cache_collection
)

from app.utils.transcript import (
    convert_transcript_to_text
)

from app.utils.translate import (
    translate_transcript
)


DATA_DIR = Path("data")

DATA_DIR.mkdir(
    exist_ok=True
)


async def transcript_service(
    data,
    language: str,
    lang: str,
    video_id: str
):

    try:

        # =================================================
        # CACHE
        # =================================================

        cache = subtitle_cache_collection.find_one({
            "videoId": video_id,
            "sourceLanguage": lang,
            "language": language
        })

        if cache:

            compressed = cache["subtitle"]

            decompressed = brotli.decompress(
                compressed
            )

            return json.loads(
                decompressed.decode("utf-8")
            )

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
            language,
            lang
        )

        # =================================================
        # SAVE JSON DEBUG
        # =================================================

        subtitle_file = (
            DATA_DIR / "subtitle.json"
        )

        subtitle_file.write_text(
            json.dumps(
                subtitle,
                ensure_ascii=False,
                indent=2
            ),
            encoding="utf-8"
        )

        # =================================================
        # BROTLI COMPRESS
        # =================================================

        json_bytes = json.dumps(
            subtitle,
            ensure_ascii=False
        ).encode("utf-8")

        compressed = brotli.compress(
            json_bytes,
            quality=5
        )

        # =================================================
        # SAVE CACHE
        # =================================================

        subtitle_cache_collection.update_one(
            {
                "videoId": video_id,
                "sourceLanguage": lang,
                "language": language
            },
            {
                "$set": {
                    "subtitle": compressed
                }
            },
            upsert=True
        )

        return subtitle

    except Exception as error:

        print(
            "Transcript service error:",
            error
        )

        raise