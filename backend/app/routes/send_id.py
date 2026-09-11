from fastapi import APIRouter

from app.schemas.send_id import SendIdRequest
from app.services.youtube_service import process_id

router = APIRouter()


@router.post("/send-id")
async def send_id(request: SendIdRequest):

    print(f"Received request: {request}")
    return await process_id(
        request.id,
        request.target_language,
        request.native_language
    )