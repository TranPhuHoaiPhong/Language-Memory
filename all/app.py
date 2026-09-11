from yt_dlp import YoutubeDL

video_id = "lFLgKw83d4I"
url = f"https://www.youtube.com/watch?v={video_id}"

ydl_opts = {
    "skip_download": True,
    "writesubtitles": True,
    "writeautomaticsub": True,
}

with YoutubeDL(ydl_opts) as ydl:
    info = ydl.extract_info(url, download=False)

# Phụ đề Việt do chủ video cung cấp
vi_sub = info.get("subtitles", {}).get("vi")

# Phụ đề Việt tự động
vi_auto = info.get("automatic_captions", {}).get("vi")

print("=== Vietnamese subtitle ===")
print(vi_sub)

print("\n=== Vietnamese automatic caption ===")
print(vi_auto)