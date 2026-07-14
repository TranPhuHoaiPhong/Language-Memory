from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
import eng_to_ipa as ipa
import edge_tts
import os

app = FastAPI()

# Thư mục lưu audio
AUDIO_DIR = "audio"
os.makedirs(AUDIO_DIR, exist_ok=True)

# Cho phép truy cập file audio
app.mount("/audio", StaticFiles(directory=AUDIO_DIR), name="audio")


@app.post("/ipa")
async def get_ipa(data: dict):

    word = data["word"].strip()

    # IPA
    ipa_text = ipa.convert(word)

    # Tên file theo từ để cache
    filename = f"{word.lower().replace(' ', '_')}.mp3"
    filepath = os.path.join(AUDIO_DIR, filename)

    # Nếu chưa có audio thì tạo
    if not os.path.exists(filepath):
        communicate = edge_tts.Communicate(
            text=word,
            voice="en-US-JennyNeural"
        )
        await communicate.save(filepath)

    return {
        "word": word,
        "ipa": ipa_text,
        "audio": f"http://localhost:8000/audio/{filename}"
    }