import asyncio

import stanza


# ============================================================
# STANZA
# ============================================================

stanza_pipelines = {}


def get_stanza_pipeline(lang: str):

    if lang not in stanza_pipelines:

        try:

            stanza.download(lang)

            pipeline = stanza.Pipeline(
                lang,
                processors="tokenize,pos",
                use_gpu=False,
                verbose=False
            )

            stanza_pipelines[lang] = pipeline

        except Exception as e:

            print(
                f"[STANZA ERROR] {lang}: {e}"
            )

            stanza_pipelines[lang] = None

    return stanza_pipelines[lang]


def get_pos_sync(
    word: str,
    sentence: str,
    lang: str
):

    if not sentence or not lang:
        return None

    pipeline = get_stanza_pipeline(
        lang
    )

    if pipeline is None:
        return None

    try:

        doc = pipeline(sentence)

        for sent in doc.sentences:

            for token in sent.tokens:

                if token.text.lower() == word.lower():

                    return token.words[0].upos

                for w in token.words:

                    if w.text.lower() == word.lower():

                        return w.upos

        return None

    except Exception as e:

        print(
            f"[STANZA ERROR] {e}"
        )

        return None


async def get_pos_async(
    word: str,
    sentence: str,
    lang: str
):

    if not sentence:
        return None

    loop = asyncio.get_running_loop()

    return await loop.run_in_executor(
        None,
        get_pos_sync,
        word,
        sentence,
        lang
    )