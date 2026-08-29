from pydantic import BaseModel


class SendIdRequest(BaseModel):

    id: str

    language: str