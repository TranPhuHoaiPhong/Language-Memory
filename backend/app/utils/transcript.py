import json
import re


def format_time(ms: int) -> str:

    h = ms // 3_600_000

    m = (ms % 3_600_000) // 60_000

    s = (ms % 60_000) // 1_000

    ms_part = ms % 1_000

    return (
        f"{h:02d}:"
        f"{m:02d}:"
        f"{s:02d}."
        f"{ms_part:03d}"
    )


def append_word(
    sentence: str,
    text: str
) -> str:

    if not sentence:
        return text.strip()

    if re.match(r"^\s", text):
        return sentence + text

    if re.match(
        r"^[,.;!?:\"')\]]",
        text
    ):
        return sentence + text

    return sentence + " " + text


def clean_text(text: str) -> str:

    text = re.sub(
        r">>",
        "",
        text
    )

    text = re.sub(
        r"\[[^\]]*\]",
        "",
        text,
        flags=re.IGNORECASE
    )

    text = re.sub(
        r"[♪♫♬]",
        "",
        text
    )

    return text.strip()


def is_end_sentence(text: str) -> bool:

    return bool(
        re.search(
            r'[.!?]["\')\]]*$',
            text.strip()
        )
    )


def save_sentence(
    result: list,
    start: int,
    text: str
):

    text = re.sub(
        r"\s+",
        " ",
        text
    ).strip()

    text = re.sub(
        r"[.,!?…]+$",
        "",
        text
    )

    if not text:
        return

    result.append(
        f"{format_time(start)} {text}"
    )


def convert_transcript_to_text(data) -> str:

    if isinstance(data, str):
        data = json.loads(data)

    result = []

    current = ""

    start_time = None

    buffer = []

    for event in data.get("events", []):

        segs = event.get("segs")

        if not segs:
            continue

        for seg in segs:

            if not seg.get("utf8"):
                continue

            text = clean_text(
                seg["utf8"]
            )

            if not text:
                continue

            time = (
                event.get("tStartMs", 0)
                +
                seg.get("tOffsetMs", 0)
            )

            if start_time is None:
                start_time = time

            current = append_word(
                current,
                text
            )

            if is_end_sentence(text):

                if buffer:

                    current = (
                        " ".join(buffer)
                        + " "
                        + current
                    )

                    buffer = []

                save_sentence(
                    result,
                    start_time,
                    current
                )

                current = ""

                start_time = None

    if current.strip():

        if buffer:

            current = (
                " ".join(buffer)
                + " "
                + current
            )

        save_sentence(
            result,
            start_time or 0,
            current
        )

    return "\n".join(result)