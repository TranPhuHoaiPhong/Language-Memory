import os
import edge_tts

async def generate_audio(word: str, voice: str, filepath: str) -> str:
    if not os.path.exists(filepath):
        await edge_tts.Communicate(text=word, voice=voice).save(filepath)
    return filepath