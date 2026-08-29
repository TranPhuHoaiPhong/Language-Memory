from pydantic import BaseModel


class SearchRequest(BaseModel):
    word: str
    language: str
    subtitle: str | None = None
    sourceLanguage: str | None = None