import asyncio
from functools import lru_cache
import eng_to_ipa as ipa

@lru_cache(maxsize=2048)
def generate_ipa_sync(word: str) -> str | None:
    result = ipa.convert(word)
    return result if result.lower() != word.lower() else None

async def generate_ipa_async(word: str) -> str | None:
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, generate_ipa_sync, word)