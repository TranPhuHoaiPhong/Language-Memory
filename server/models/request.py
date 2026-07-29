from pydantic import BaseModel

class IpaRequest(BaseModel):
    word: str
    language: str = "en"
    sentence: str = ""
    native: str = "vi"