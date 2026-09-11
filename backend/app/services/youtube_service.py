from yt_dlp import YoutubeDL


def get_subtitle_links(
    video_id: str,
    target_language: str,
    native_language: str
):
    url = f"https://www.youtube.com/watch?v={video_id}"

    ydl_opts = {
        "skip_download": True,
    }

    with YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=False)

    result = {
        "target_link": None,
        "native_link": None
    }

    # =========================
    # TARGET LANGUAGE
    # =========================

    formats = info.get("subtitles", {}).get(target_language, [])

    for item in formats:
        if item.get("ext") == "json3":
            result["target_link"] = item["url"]
            break

    # Nếu không có subtitle thủ công
    if result["target_link"] is None:
        formats = info.get("automatic_captions", {}).get(
            target_language, []
        )

        for item in formats:
            if item.get("ext") == "json3":
                result["target_link"] = item["url"]
                break

    # =========================
    # NATIVE LANGUAGE
    # =========================

    formats = info.get("subtitles", {}).get(native_language, [])

    for item in formats:
        if item.get("ext") == "json3":
            result["native_link"] = item["url"]
            break

    # Nếu không có subtitle thủ công
    if result["native_link"] is None:
        formats = info.get("automatic_captions", {}).get(
            native_language, []
        )

        for item in formats:
            if item.get("ext") == "json3":
                result["native_link"] = item["url"]
                break

    return result


# =========================
# PROCESS ID
# =========================

async def process_id(
    video_id: str,
    target_language: str,
    native_language: str
):
    links = get_subtitle_links(
        video_id,
        target_language,
        native_language
    )

    return {
        "target_link": links["target_link"],
        "native_link": links["native_link"]
    }