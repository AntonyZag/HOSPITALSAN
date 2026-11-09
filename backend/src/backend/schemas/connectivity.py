from pydantic import BaseModel


class ConnectionStatus(BaseModel):
    success: bool
    message: str
