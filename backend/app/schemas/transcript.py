from pydantic import BaseModel


class TranscriptRequest(BaseModel):

    target_transcript: str
    native_transcript: str
    target_language: str
    native_language: str
    videoId: str