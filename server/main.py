from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
import eng_to_ipa as ipa
import edge_tts
import subprocess
import os

app = FastAPI()

ESPEAK_PATH = r"C:\Program Files\eSpeak NG\espeak-ng.exe"

AUDIO_DIR = "audio"
os.makedirs(AUDIO_DIR, exist_ok=True)

app.mount("/audio", StaticFiles(directory=AUDIO_DIR), name="audio")


VOICE_MAP = {
    # English
    "en": "en-US-JennyNeural",

    # French
    "fr": "fr-FR-DeniseNeural",

    # Spanish
    "es": "es-ES-ElviraNeural",

    # German
    "de": "de-DE-KatjaNeural",

    # Italian
    "it": "it-IT-ElsaNeural",

    # Portuguese
    "pt": "pt-BR-FranciscaNeural",

    # Russian
    "ru": "ru-RU-SvetlanaNeural",

    # Japanese
    "ja": "ja-JP-NanamiNeural",

    # Korean
    "ko": "ko-KR-SunHiNeural",

    # Chinese (Simplified)
    "zh": "zh-CN-XiaoxiaoNeural",

    # Vietnamese
    "vi": "vi-VN-HoaiMyNeural",

    # Thai
    "th": "th-TH-PremwadeeNeural",

    # Indonesian
    "id": "id-ID-GadisNeural",

    # Malay
    "ms": "ms-MY-YasminNeural",

    # Dutch
    "nl": "nl-NL-ColetteNeural",

    # Polish
    "pl": "pl-PL-ZofiaNeural",

    # Turkish
    "tr": "tr-TR-EmelNeural",

    # Arabic
    "ar": "ar-SA-ZariyahNeural",

    # Hindi
    "hi": "hi-IN-SwaraNeural",

    # Swedish
    "sv": "sv-SE-SofieNeural",

    # Danish
    "da": "da-DK-ChristelNeural",

    # Norwegian
    "no": "nb-NO-PernilleNeural",

    # Finnish
    "fi": "fi-FI-NooraNeural",

    # Czech
    "cs": "cs-CZ-VlastaNeural",

    # Hungarian
    "hu": "hu-HU-NoemiNeural",

    # Romanian
    "ro": "ro-RO-AlinaNeural",

    # Greek
    "el": "el-GR-AthinaNeural",

    # Ukrainian
    "uk": "uk-UA-PolinaNeural"
}


def generate_ipa(word: str, language: str):
    # Tiếng Anh dùng eng_to_ipa
    if language == "en":
        result = ipa.convert(word)
        return result if result.lower() != word.lower() else None

    # Các ngôn ngữ khác dùng eSpeak
    try:
        result = subprocess.run(
            [
                ESPEAK_PATH,
                "-q",
                "-v",
                language,
                "--ipa",
                word,
            ],
            capture_output=True,
            text=True,
            encoding="utf-8",
        )

        ipa_text = result.stdout.strip()
        return ipa_text or None

    except Exception:
        return None


@app.post("/ipa")
async def get_ipa(data: dict):
    word = data["word"].strip()
    language = data.get("language", "en")

    filename = f"{language}_{word.lower().replace(' ', '_')}.mp3"
    filepath = os.path.join(AUDIO_DIR, filename)

    if not os.path.exists(filepath):
        await edge_tts.Communicate(
            text=word,
            voice=VOICE_MAP.get(language, "en-US-JennyNeural"),
        ).save(filepath)

    return {
        "word": word,
        "language": language,
        "ipa": generate_ipa(word, language),
        "audio": f"http://localhost:8000/audio/{filename}",
    }