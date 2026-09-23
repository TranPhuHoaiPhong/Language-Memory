from ollama import chat
import json
import re
import asyncio


def explain_word(
    payload: dict,
    level: str = "B1",
    model: str = "qwen3:1.7b",
):
    # ============================================================
    # GET DATA
    # ============================================================
    word = payload["word"]
    language = payload.get("language", "vi")
    source_language = payload.get("sourceLanguage", "en")
    subtitle = payload["subtitle"]

    if isinstance(subtitle, str):
        start = None
        end = None
        original = subtitle
        translated = ""
    else:
        start = subtitle.get("start")
        end = subtitle.get("end")
        original = subtitle["original"]
        translated = subtitle.get("translated", "")

    # ============================================================
    # TRANSLATED BLOCK
    # ============================================================
    translated_block = (
        f'Tiếng Việt của câu:\n"{translated}"\n'
        if translated
        else ""
    )

    # ============================================================
    # PROMPT
    # ============================================================
    prompt = f"""
Bạn là giáo viên tiếng Anh cho người học trình độ {level}.

Hãy giải thích từ hoặc cụm từ tiếng Anh "{word}" dựa HOÀN TOÀN vào câu sau:

"{original}"

{translated_block}

YÊU CẦU:

1. "context_meaning"
- Chỉ cho biết nghĩa của "{word}" trong chính câu này.
- Viết bằng tiếng Việt.
- Ngắn gọn, khoảng 2-8 từ.
- Không viết định nghĩa kiểu từ điển.
- Không thêm thông tin không cần thiết.
- Không giải thích lịch sử, nguồn gốc hoặc nghĩa khác của từ.

2. "reason"
- Giải thích ngắn gọn tại sao "{word}" được dùng trong câu này.
- Cho biết từ loại nếu phù hợp: danh từ, động từ, tính từ, trạng từ...
- Giải thích vai trò của nó trong cấu trúc câu nếu có điểm ngữ pháp đáng chú ý.
- Nếu nó nằm trong một cụm từ/cấu trúc, hãy giải thích vai trò của nó trong cụm đó.
- Chỉ giải thích ngữ pháp thực sự liên quan đến "{word}".
- Không lặp lại nguyên văn "context_meaning".
- Không viết ví dụ.

QUAN TRỌNG:
- Chỉ trả lời bằng tiếng Việt.
- Không đưa ví dụ.
- Không đưa từ đồng nghĩa.
- Không đưa từ trái nghĩa.
- Không đưa collocation.
- Không đưa word family.
- Không đưa IPA.
- Không đưa phát âm.
- Không đưa thông tin ngoài hai trường được yêu cầu.
- Không giải thích chung chung như từ điển.
- Phải dựa vào câu cụ thể.

TRẢ VỀ DUY NHẤT JSON HỢP LỆ.

Định dạng bắt buộc:

{{
  "word": "{word}",
  "context_meaning": "nghĩa ngắn gọn của từ trong câu",
  "reason": "giải thích ngắn gọn về từ loại, vai trò hoặc ngữ pháp liên quan"
}}

Không được trả về Markdown.
Không được sử dụng ```json.
Không được thêm bất kỳ text nào trước hoặc sau JSON.
"""

    # ============================================================
    # CALL OLLAMA
    # ============================================================
    print(f"\n=== Đang tạo giải thích cho từ: {word} ===\n")

    response = chat(
        model=model,
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ],
        think=False,
        stream=True,
        options={
            "temperature": 0.1,
            "num_predict": 300,
        },
    )

    full_content = ""

    for chunk in response:
        content = chunk["message"]["content"]
        print(content, end="", flush=True)
        full_content += content

    print("\n")

    # ============================================================
    # CLEAN RESPONSE
    # ============================================================
    cleaned = full_content.strip()

    # Remove Markdown code fence nếu model vẫn trả về
    cleaned = re.sub(
        r"^```(?:json)?\s*",
        "",
        cleaned,
        flags=re.IGNORECASE
    )
    cleaned = re.sub(
        r"\s*```$",
        "",
        cleaned
    )
    cleaned = cleaned.strip()

    # ============================================================
    # PARSE & RETURN
    # ============================================================
    try:
        result = json.loads(cleaned)
    except json.JSONDecodeError:
        # fallback an toàn nếu model trả về không đúng format
        result = {
            "word": word,
            "context_meaning": "không xác định",
            "reason": "không phân tích được"
        }

    return result


async def get_context_meaning(
    word: str,
    sentence: str,
    native: str,
    language: str
):
    payload = {
        "word": word,
        "language": native,
        "subtitle": sentence,
        "sourceLanguage": language
    }

    result = await asyncio.to_thread(
        explain_word,
        payload=payload,
        level="B1",
        model="qwen3:1.7b"
    )
    return result