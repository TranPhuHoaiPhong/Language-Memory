from typing import Any

from pydantic import BaseModel


class SaveRequest(BaseModel):

    data: Any