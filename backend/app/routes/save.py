from fastapi import APIRouter

from app.schemas.save import SaveRequest

from app.services.vocabulary_service import (
    save_vocabulary
)


router = APIRouter()


@router.post("/save")
async def save(
    request: SaveRequest
):

    return await save_vocabulary(
        request.data
    )