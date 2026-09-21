import os

import edge_tts


# ============================================================
# AUDIO
# ============================================================

async def generate_audio(
    word: str,
    voice: str,
    filepath: str
):

    directory = os.path.dirname(
        filepath
    )

    os.makedirs(
        directory,
        exist_ok=True
    )

    if not os.path.exists(filepath):

        await edge_tts.Communicate(
            text=word,
            voice=voice
        ).save(filepath)

    return filepath