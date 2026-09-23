from fastapi import APIRouter, Request

from app.services.search.search_service import search_service


router = APIRouter()


@router.post("/search")
async def search(request: Request):

    body = await request.json()

    word = body.get("word")
    language = body.get("language")
    subtitle = body.get("subtitle")
    source_language = body.get("sourceLanguage")


    result = await search_service(
        word,
        language,
        subtitle,
        source_language
    )

    return result