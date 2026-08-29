from pydantic import BaseModel


class TranscriptRequest(BaseModel):

    transcript: str

    language: str

    lang: str

    videoId: str