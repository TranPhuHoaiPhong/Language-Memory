from pydantic import BaseModel


class SendIdRequest(BaseModel):

    id: str
    target_language: str
    native_language: str 