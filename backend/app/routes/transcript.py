from fastapi import APIRouter

from app.schemas.transcript import (
    TranscriptRequest
)

from app.services.transcript_service import (
    transcript_service
)


router = APIRouter()


@router.post("/transcript")
async def transcript(
    request: TranscriptRequest
):

    result = await transcript_service(
        request.transcript,
        request.language,
        request.lang,
        request.videoId
    )

    return {
        "data": result
    }