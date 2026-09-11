import json
import re
from bisect import bisect_left
from pathlib import Path

import brotli

from app.database.mongodb import subtitle_cache_collection


DATA_DIR = Path("data")
DATA_DIR.mkdir(exist_ok=True)


# =========================
# 1. Đọc & làm sạch caption
# =========================

def _clean_with_position_map(raw_text):
    """Tối ưu: ít lookup dict hơn, xử lý khoảng trắng gọn hơn."""
    text = raw_text.replace("\n", " ")
    n = len(text)
    out = []
    raw_to_clean = {}
    last_space = True
    i = 0

    while i < n:
        c = text[i]
        if c == '>':
            prev_ok = (i == 0) or text[i - 1].isspace()
            j = i
            while j < n and text[j] == '>':
                j += 1
            next_ok = (j >= n) or text[j].isspace()
            if prev_ok and next_ok:
                i = j
                continue
            out.append(c)
            raw_to_clean[i] = len(out) - 1
            last_space = False
            i += 1
        elif c.isspace():
            if not last_space and out:
                out.append(' ')
                raw_to_clean[i] = len(out) - 1
                last_space = True
            i += 1
        else:
            out.append(c)
            raw_to_clean[i] = len(out) - 1
            last_space = False
            i += 1

    while out and out[-1] == ' ':
        out.pop()
    clean_str = ''.join(out)
    clean_len = len(clean_str)
    raw_to_clean = {k: v for k, v in raw_to_clean.items() if v < clean_len}
    return clean_str, raw_to_clean


def _normalize_transcript(data):
    """
    Chuẩn hoá input transcript về dict {events: [...]}.
    Chấp nhận:
      - dict (đã parse)
      - JSON string (bytes/str)
      - list events
      - plain text  → trả về dict rỗng + key _plain_text
    """
    if data is None:
        return {"events": []}

    if isinstance(data, dict):
        # Đôi khi data bọc trong {"data": {...}} hoặc {"transcript": "..."}
        if "events" in data:
            return data
        for key in ("data", "transcript", "result", "subtitle"):
            inner = data.get(key)
            if isinstance(inner, dict):
                return inner
            if isinstance(inner, (str, bytes, bytearray)):
                return _normalize_transcript(inner)
        return data

    if isinstance(data, (bytes, bytearray)):
        try:
            data = data.decode("utf-8")
        except Exception:
            return {"events": []}

    if isinstance(data, list):
        return {"events": data}

    if isinstance(data, str):
        s = data.strip()
        if not s:
            return {"events": []}
        # Thử parse JSON
        if s[0] in "{[":
            try:
                parsed = json.loads(s)
            except json.JSONDecodeError:
                parsed = None
            if parsed is not None:
                return _normalize_transcript(parsed)
        # Không phải JSON → coi như plain text (không có timing)
        return {"events": [], "_plain_text": s}

    return {"events": []}


def extract_captions(data):
    data = _normalize_transcript(data)
    captions = {}
    events = data.get("events", [])
    for ev in events:
        if ev.get("aAppend") == 1:
            continue
        segs = ev.get("segs")
        if not segs:
            continue
        t_start = ev.get("tStartMs")
        if t_start is None:
            continue

        raw_parts = []
        raw_word_starts = []
        cursor = 0
        for seg in segs:
            utf8 = seg.get("utf8", "")
            if not utf8:
                continue
            leading = len(utf8) - len(utf8.lstrip())
            raw_word_starts.append((cursor + leading, t_start + seg.get("tOffsetMs", 0)))
            raw_parts.append(utf8)
            cursor += len(utf8)

        raw_text = "".join(raw_parts)
        clean_str, raw_to_clean = _clean_with_position_map(raw_text)
        if not clean_str:
            continue

        word_times = []
        for raw_pos, abs_ms in raw_word_starts:
            cp = None
            for rp in range(raw_pos, len(raw_text)):
                if rp in raw_to_clean:
                    cp = raw_to_clean[rp]
                    break
            if cp is not None and cp < len(clean_str):
                word_times.append((cp, abs_ms))

        word_times.sort(key=lambda x: x[0])
        captions[t_start] = {
            "start": t_start,
            "end": t_start + ev.get("dDurationMs", 0),
            "text": clean_str,
            "word_times": word_times,
        }
    return captions


def build_bilingual_entries(en_caps, vi_caps):
    all_times = sorted(set(en_caps) | set(vi_caps))
    entries = []
    for t in all_times:
        en = en_caps.get(t)
        vi = vi_caps.get(t)
        if not en and not vi:
            continue
        start = (en or vi)["start"]
        end = (en or vi)["end"]
        if en and vi:
            end = max(en["end"], vi["end"])
        entries.append({
            "start_ms": start,
            "end_ms": end,
            "en": en["text"] if en else "",
            "vi": vi["text"] if vi else "",
            "en_word_times": en["word_times"] if en else [],
            "vi_word_times": vi["word_times"] if vi else [],
        })
    return entries


# =========================
# 2. Boundary detection
# =========================

ABBREVIATIONS = {
    "mr", "mrs", "ms", "dr", "prof", "sr", "jr", "st", "vs", "etc",
    "inc", "ltd", "co", "corp", "no", "vol", "fig", "ch", "sec",
    "u.s", "u.k", "u.n", "a.m", "p.m", "ph.d",
}


def _is_abbrev_dot(text, dot_idx):
    if dot_idx <= 0:
        return False
    i = dot_idx - 1
    while i >= 0 and text[i].isalnum():
        i -= 1
    token = text[i + 1:dot_idx].lower()
    if not token:
        return False
    if token in ABBREVIATIONS:
        return True
    if len(token) == 1 and token.isalpha():
        if i < 0 or text[i].isspace() or text[i] == '.':
            return True
    return False


def find_boundaries(text):
    boundaries = []
    n = len(text)
    i = 0
    while i < n:
        c = text[i]
        if c in ".!?…":
            if c == '.':
                if 0 < i < n - 1 and text[i - 1].isdigit() and text[i + 1].isdigit():
                    i += 1
                    continue
                if i + 1 < n and text[i + 1] == '.':
                    i += 1
                    continue
                if _is_abbrev_dot(text, i):
                    i += 1
                    continue

            j = i + 1
            while j < n and (text[j].isspace() or text[j] in "\"')]}»”’"):
                j += 1
            if j < n and (text[j].isupper() or text[j].isdigit()):
                boundaries.append((j, c))
            i = j if j > i else i + 1
        else:
            i += 1
    return boundaries


# =========================
# 3. Timing helpers
# =========================

def ms_to_time_str(ms):
    ms = max(0, int(ms))
    h = ms // 3600000
    ms %= 3600000
    m = ms // 60000
    ms %= 60000
    s = ms // 1000
    ms %= 1000
    return f"{h:02d}:{m:02d}:{s:02d}.{ms:03d}"


def compute_split_time(start_ms, end_ms, text, split_pos):
    if not text:
        return start_ms
    ratio = min(1.0, max(0.0, split_pos / len(text)))
    return int(start_ms + ratio * (end_ms - start_ms))


def _build_pos_time_arrays(word_times):
    if not word_times:
        return [], []
    positions = [p for p, _ in word_times]
    times = [t for _, t in word_times]
    return positions, times


def time_at_position(word_times, pos, fallback_ms=None):
    if not word_times:
        return fallback_ms
    positions, times = _build_pos_time_arrays(word_times)
    idx = bisect_left(positions, pos)
    if idx < len(positions):
        return times[idx]
    return times[-1] if times else fallback_ms


def time_before(word_times, pos, fallback_ms=None):
    if not word_times:
        return fallback_ms
    positions, times = _build_pos_time_arrays(word_times)
    idx = bisect_left(positions, pos)
    if idx > 0:
        return times[idx - 1]
    return times[0] if times else fallback_ms


def lookup_time_at(word_times, pos, fallback_ms, max_fwd_chars=20, max_back_ms=800):
    if not word_times:
        return fallback_ms
    positions, times = _build_pos_time_arrays(word_times)
    idx = bisect_left(positions, pos)

    if idx < len(positions) and (positions[idx] - pos) <= max_fwd_chars:
        return times[idx]
    if idx > 0 and (fallback_ms - times[idx - 1]) <= max_back_ms:
        return times[idx - 1]
    return fallback_ms


# =========================
# 4. Boundary matching — DP
# =========================

def _match_by_ratio(en_bounds, vi_bounds, en_len, vi_len, max_ratio_diff=0.25):
    matches = []
    used_vi = set()
    last_vi_pos = -1
    for en_pos, en_p in en_bounds:
        en_ratio = en_pos / en_len if en_len else 0.0
        best_j = -1
        best_score = float('inf')
        for j, (vi_pos, vi_p) in enumerate(vi_bounds):
            if j in used_vi or vi_pos <= last_vi_pos:
                continue
            vi_ratio = vi_pos / vi_len if vi_len else 0.0
            diff = abs(en_ratio - vi_ratio)
            penalty = 0.0 if vi_p == en_p else 0.05
            score = diff + penalty
            if score < best_score:
                best_score = score
                best_j = j
        if best_j >= 0 and best_score < max_ratio_diff:
            vi_pos = vi_bounds[best_j][0]
            matches.append((en_pos, vi_pos))
            used_vi.add(best_j)
            last_vi_pos = vi_pos
    return matches


def _align_boundaries(en_bounds, vi_bounds, en_len, vi_len,
                      en_times, vi_times,
                      time_coeff=0.4,
                      ratio_coeff=1.0,
                      punct_penalty=0.1,
                      skip_cost=0.8):
    n = len(en_bounds)
    m = len(vi_bounds)
    if n == 0 or m == 0:
        return []

    en_pos_list = [b[0] for b in en_bounds]
    vi_pos_list = [b[0] for b in vi_bounds]
    en_t_list = [time_before(en_times, p) for p in en_pos_list]
    vi_t_list = [time_before(vi_times, p) for p in vi_pos_list]

    INF = float('inf')
    dp = [[INF] * (m + 1) for _ in range(n + 1)]
    action = [[None] * (m + 1) for _ in range(n + 1)]
    dp[0][0] = 0.0

    for i in range(n + 1):
        for j in range(m + 1):
            if i == 0 and j == 0:
                continue
            if i > 0:
                cost = dp[i - 1][j] + skip_cost
                if cost < dp[i][j]:
                    dp[i][j] = cost
                    action[i][j] = ('skip_en', i - 1, j)
            if j > 0:
                cost = dp[i][j - 1] + skip_cost
                if cost < dp[i][j]:
                    dp[i][j] = cost
                    action[i][j] = ('skip_vi', i, j - 1)
            if i > 0 and j > 0:
                en_pos, en_p = en_bounds[i - 1]
                vi_pos, vi_p = vi_bounds[j - 1]

                en_t = en_t_list[i - 1]
                vi_t = vi_t_list[j - 1]

                time_diff_s = 0.0
                if en_t is not None and vi_t is not None:
                    time_diff_s = abs(vi_t - en_t) / 1000.0

                ratio_diff = abs(
                    (en_pos / en_len if en_len else 0.0) -
                    (vi_pos / vi_len if vi_len else 0.0)
                )

                c = time_diff_s * time_coeff + ratio_diff * ratio_coeff
                if vi_p != en_p:
                    c += punct_penalty

                cost = dp[i - 1][j - 1] + c
                if cost < dp[i][j]:
                    dp[i][j] = cost
                    action[i][j] = ('match', i - 1, j - 1)

    matches = []
    i, j = n, m
    while i > 0 or j > 0:
        act = action[i][j]
        if act is None:
            break
        kind, pi, pj = act
        if kind == 'match':
            matches.append((en_bounds[pi][0], vi_bounds[pj][0]))
        i, j = pi, pj
    matches.reverse()
    return matches


def match_boundaries(en_bounds, vi_bounds, en_len, vi_len,
                     en_times=None, vi_times=None):
    if not en_bounds or not vi_bounds:
        return []

    if len(en_bounds) == len(vi_bounds):
        return [(en_bounds[k][0], vi_bounds[k][0]) for k in range(len(en_bounds))]

    if en_times and vi_times:
        result = _align_boundaries(
            en_bounds, vi_bounds, en_len, vi_len,
            en_times, vi_times,
        )
        if result:
            return result
    return _match_by_ratio(en_bounds, vi_bounds, en_len, vi_len, 0.25)


# =========================
# 5. Pipeline chính
# =========================

def _final_cleanup(text):
    if not text:
        return text

    text = re.sub(r'\[[^\]]*\]', '', text)
    text = re.sub(r'\([^)]*\)', '', text)
    text = text.replace('"', '')
    text = re.sub(r'\s+([.,!?;:])', r'\1', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text


def split_entries(entries):
    if not entries:
        return []

    en_parts = []
    vi_parts = []
    en_times = []
    vi_times = []
    en_len_so_far = 0
    vi_len_so_far = 0

    for entry in entries:
        if entry["en"]:
            if en_parts:
                en_parts.append(" ")
                en_len_so_far += 1
            en_parts.append(entry["en"])
            for pos, t in entry["en_word_times"]:
                en_times.append((en_len_so_far + pos, t))
            en_len_so_far += len(entry["en"])

        if entry["vi"]:
            if vi_parts:
                vi_parts.append(" ")
                vi_len_so_far += 1
            vi_parts.append(entry["vi"])
            for pos, t in entry["vi_word_times"]:
                vi_times.append((vi_len_so_far + pos, t))
            vi_len_so_far += len(entry["vi"])

    full_en = "".join(en_parts)
    full_vi = "".join(vi_parts)

    en_bounds = find_boundaries(full_en)
    vi_bounds = find_boundaries(full_vi)

    matches = match_boundaries(
        en_bounds, vi_bounds,
        len(full_en), len(full_vi),
        en_times=en_times, vi_times=vi_times,
    )

    output = []
    prev_en = prev_vi = 0
    seg_start = entries[0]["start_ms"]
    seg_end = entries[-1]["end_ms"]

    def emit(en_txt, vi_txt, s_ms, e_ms):
        en_txt = _final_cleanup(en_txt)
        vi_txt = _final_cleanup(vi_txt)
        if en_txt or vi_txt:
            output.append({
                "start": round(s_ms / 1000.0, 3),
                "end":   round(e_ms / 1000.0, 3),
                "original": en_txt,
                "translated": vi_txt,
            })

    for en_pos, vi_pos in matches:
        en_sent = full_en[prev_en:en_pos].strip()
        vi_sent = full_vi[prev_vi:vi_pos].strip()
        if not en_sent or not vi_sent:
            prev_en, prev_vi = en_pos, vi_pos
            continue

        fallback = compute_split_time(seg_start, seg_end, full_en, en_pos)
        split_ms = lookup_time_at(en_times, en_pos, fallback)
        if split_ms <= seg_start or split_ms > seg_end:
            split_ms = fallback

        emit(en_sent, vi_sent, seg_start, split_ms)
        prev_en, prev_vi = en_pos, vi_pos
        seg_start = split_ms

    emit(full_en[prev_en:], full_vi[prev_vi:], seg_start, seg_end)
    return output


# =========================
# 6. SERVICE
# =========================

async def transcript_service(
    videoId,
    target_language,
    native_language,
    target_transcript,
    native_transcript,
    no_translation=False,
):
    try:
        print("Transcript service called with:", videoId)

        # =================================================
        # CACHE
        # =================================================
        # cache = subtitle_cache_collection.find_one({
        #     "videoId": videoId,
        #     "sourceLanguage": target_language,
        #     "language": native_language,
        # })

        # if cache:
        #     compressed = cache["subtitle"]
        #     subtitles = json.loads(
        #         brotli.decompress(compressed).decode("utf-8")
        #     )
        #     return {
        #         "subtitles": subtitles,
        #         "sourceLanguage": target_language,
        #         "nativeLanguage": native_language,
        #         "noTranslation": no_translation or False,
        #     }

        # =================================================
        # NORMALIZE INPUT (str → dict)
        # =================================================
        target_data = _normalize_transcript(target_transcript)
        native_data = _normalize_transcript(native_transcript)

        # =================================================
        # PIPELINE: extract → align → split
        # =================================================
        target_caps = extract_captions(target_data)
        native_caps = extract_captions(native_data)

        entries = build_bilingual_entries(target_caps, native_caps)
        subtitles = split_entries(entries)

        # =================================================
        # BROTLI COMPRESS + SAVE CACHE
        # =================================================
        # json_bytes = json.dumps(
        #     subtitles, ensure_ascii=False
        # ).encode("utf-8")

        # compressed = brotli.compress(json_bytes, quality=5)

        # subtitle_cache_collection.update_one(
        #     {
        #         "videoId": videoId,
        #         "sourceLanguage": target_language,
        #         "language": native_language,
        #     },
        #     {"$set": {"subtitle": compressed}},
        #     upsert=True,
        # )

        result = {
            "subtitles": subtitles,
            "sourceLanguage": target_language,
            "nativeLanguage": native_language,
            "noTranslation": no_translation or False,
        }

        # with open("data/transcript.json", "w", encoding="utf-8") as f:
        #     json.dump(result, f, ensure_ascii=False, indent=2)

        return result

    except Exception as error:
        print("Transcript service error:", error)
        raise