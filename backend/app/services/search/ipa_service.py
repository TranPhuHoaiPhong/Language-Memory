import asyncio
from functools import lru_cache

import eng_to_ipa as ipa


# ============================================================
# IPA
# ============================================================

@lru_cache(maxsize=2048)
def generate_ipa_sync(word: str):

    result = ipa.convert(word)

    if result.lower() != word.lower():
        return result

    return None


async def generate_ipa_async(word: str):

    loop = asyncio.get_running_loop()

    return await loop.run_in_executor(
        None,
        generate_ipa_sync,
        word
    )