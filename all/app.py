from yt_dlp import YoutubeDL

video_id = "lFLgKw83d4I"

url = f"https://www.youtube.com/watch?v={video_id}"

ydl_opts = {
    "skip_download": True,
    "writesubtitles": True,
    "writeautomaticsub": True
}

with YoutubeDL(ydl_opts) as ydl:
    info = ydl.extract_info(url, download=False)

print(info["subtitles"])
print(info["automatic_captions"])