from pydantic import BaseModel, Field


class AuthorizationConfig(BaseModel):
    code: str = Field(..., description="Authorization code")
