from fastapi import APIRouter, Request

from app.services.search_service import search_service


router = APIRouter()


@router.post("/search")
async def search(request: Request):

    body = await request.json()

    # print("\n========================================")
    # print("[PYTHON] SEARCH REQUEST")
    # print("RAW BODY:")
    # print(body)
    # print("========================================")

    word = body.get("word")
    language = body.get("language")
    subtitle = body.get("subtitle")
    source_language = body.get("sourceLanguage")

    # print("[PYTHON] word =", word)
    # print("[PYTHON] language =", language)
    # print("[PYTHON] subtitle =", subtitle)
    # print("[PYTHON] sourceLanguage =", source_language)

    result = await search_service(
        word,
        language,
        subtitle,
        source_language
    )

    return result