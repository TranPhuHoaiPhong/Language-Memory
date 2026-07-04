from yt_dlp import YoutubeDL


video_id = "RfhJAi7XLYg"

url = f"https://www.youtube.com/watch?v={video_id}"


opts = {

    "skip_download": True,

    "writesubtitles": True,
    "writeautomaticsub": True,

    # lấy tiếng vi
    "subtitleslangs": ["vi"],

    "subtitlesformat": "vtt",

    # đọc cookie Chrome đang đăng nhập
    "cookiesfrombrowser": (
        "chrome",
        None,
        None,
        None
    ),

    "outtmpl": "%(id)s",

}


with YoutubeDL(opts) as ydl:
    info = ydl.extract_info(
        url,
        download=True
    )


print("DONE")