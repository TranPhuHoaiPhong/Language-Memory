import os
from fastapi import APIRouter, HTTPException
from models.request import IpaRequest
from services.ipa_service import generate_ipa_async
from services.tts_service import generate_audio
from services.translate_service import get_context_meaning
from utils.language import normalize_language
from utils.voice import get_voice
from utils.filename import sanitize_filename
from config import AUDIO_DIR

router = APIRouter()

@router.post("/ipa")
async def get_ipa(data: IpaRequest):
    word = data.word.strip()
    if not word:
        raise HTTPException(status_code=400, detail="Missing word")

    lang = normalize_language(data.language)
    voice = get_voice(lang)
    safe_word = sanitize_filename(word)

    lang_dir = os.path.join(AUDIO_DIR, lang)
    os.makedirs(lang_dir, exist_ok=True)

    filename = f"{safe_word}.mp3"
    filepath = os.path.join(lang_dir, filename)

    # Run tasks concurrently
    import asyncio
    tasks = {
        "ipa": generate_ipa_async(word) if lang == "en" else asyncio.sleep(0, None),
        "meaning": get_context_meaning(word, data.sentence, data.native, lang) if data.sentence else asyncio.sleep(0, None),
        "audio": generate_audio(word, voice, filepath),
    }

    results = await asyncio.gather(*tasks.values(), return_exceptions=True)

    result_dict = {}
    for (name, _), res in zip(tasks.items(), results):
        result_dict[name] = None if isinstance(res, Exception) else res

    audio_url = f"http://localhost:8000/audio/{lang}/{filename}"
    return {
        "word": word,
        "ipa": result_dict.get("ipa"),
        "meaning": result_dict.get("meaning"),
        "audio": audio_url
    }