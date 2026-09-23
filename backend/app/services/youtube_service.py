import urllib.parse
from yt_dlp import YoutubeDL


def get_timedtext_url(
    video_id: str,
    target_language: str,
    native_language: str,
    kind: str = "asr",
    fmt: str = "json3",
):
    """
    Lấy URL timedtext mới từ YouTube thông qua yt-dlp.

    target_link:
        Phụ đề ngôn ngữ đang học.

    native_link:
        Phụ đề dịch sang ngôn ngữ mẹ đẻ thông qua tlang.
    """

    # ==========================================
    # 1. Lấy thông tin video từ yt-dlp
    # ==========================================

    watch_url = f"https://www.youtube.com/watch?v={video_id}"

    with YoutubeDL({
        "skip_download": True,
        "quiet": True,
    }) as ydl:
        info = ydl.extract_info(
            watch_url,
            download=False
        )

    # ==========================================
    # 2. Lấy subtitle track của target language
    # ==========================================

    if kind == "asr":
        tracks = (
            info
            .get("automatic_captions", {})
            .get(target_language, [])
        )
    else:
        tracks = (
            info
            .get("subtitles", {})
            .get(target_language, [])
        )

    if not tracks:
        raise RuntimeError(
            f"Không tìm thấy phụ đề "
            f"{target_language}/{kind}"
        )

    # ==========================================
    # 3. Ưu tiên json3
    # ==========================================

    target_url = next(
        (
            track["url"]
            for track in tracks
            if track.get("ext") == fmt
        ),
        tracks[0]["url"]
    )

    # ==========================================
    # 4. Lấy token từ URL yt-dlp
    # ==========================================

    parsed = urllib.parse.urlparse(target_url)

    params = dict(
        urllib.parse.parse_qsl(
            parsed.query,
            keep_blank_values=True
        )
    )

    # ==========================================
    # 5. Build lại timedtext URL
    # ==========================================

    final_params = {
        "v": video_id,

        "ei": params.get("ei", ""),

        "caps": params.get(
            "caps",
            "asr"
        ),

        "opi": params.get(
            "opi",
            "112496729"
        ),

        "xoaf": params.get(
            "xoaf",
            "5"
        ),

        "xowf": params.get(
            "xowf",
            "1"
        ),

        "xospf": params.get(
            "xospf",
            "1"
        ),

        "hl": params.get(
            "hl",
            target_language
        ),

        "ip": params.get(
            "ip",
            "0.0.0.0"
        ),

        "ipbits": params.get(
            "ipbits",
            "0"
        ),

        "expire": params.get(
            "expire",
            "0"
        ),

        "sparams": "ip,ipbits,expire,v,ei,caps,opi,xoaf",

        "signature": params.get(
            "signature",
            ""
        ),

        "key": params.get(
            "key",
            "yt8"
        ),

        "kind": kind,

        "lang": target_language,

        "fmt": fmt,
    }

    target_link = (
        "https://www.youtube.com/api/timedtext?"
        + urllib.parse.urlencode(final_params)
    )

    # ==========================================
    # 6. Tạo native subtitle
    # ==========================================

    native_link = (
        target_link
        + "&tlang="
        + urllib.parse.quote(
            native_language,
            safe=""
        )
    )

    # ==========================================
    # 7. Return
    # ==========================================

    return {
        "target_link": target_link,
        "native_link": native_link,
    }


# =========================
# PROCESS ID
# =========================

async def process_id(
    video_id: str,
    target_language: str,
    native_language: str,
):
    links = get_timedtext_url(
        video_id=video_id,
        target_language=target_language,
        native_language=native_language,
        kind="asr",
        fmt="json3",
    )

    print(
        f"target_link: {links['target_link']}"
    )

    print(
        f"native_link: {links['native_link']}"
    )

    return {
        "target_link": links["target_link"],
        "native_link": links["native_link"],
    }