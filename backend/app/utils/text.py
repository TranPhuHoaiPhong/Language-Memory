import re


def get_sentence(
    word: str,
    subtitle: str | None
):

    if not subtitle:
        print("[GET SENTENCE] subtitle is empty")
        return ""

    if not isinstance(subtitle, str):
        print(
            "[GET SENTENCE] subtitle is not string:",
            type(subtitle)
        )
        return ""

    print("[GET SENTENCE] word =", word)
    print("[GET SENTENCE] subtitle =", subtitle)

    sentences = re.split(
        r"(?<=[.!?])\s+",
        subtitle
    )

    word_lower = word.lower()

    for sentence in sentences:

        if word_lower in sentence.lower():
            return sentence.strip()

    return subtitle.strip()