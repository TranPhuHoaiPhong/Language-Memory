from fastapi import APIRouter

from app.schemas.transcript import TranscriptRequest
from app.services.transcript_service import transcript_service


router = APIRouter()


@router.post("/transcript")
async def transcript(request: TranscriptRequest):
    result = await transcript_service(
        request.videoId,
        request.target_language,
        request.native_language,
        request.target_transcript,
        request.native_transcript,
    )
    
    return result