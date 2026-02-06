from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    """Demo: pass only role. Real login: pass email + password."""
    role: str | None = Field(None, pattern="^(donor|ngo|admin)$")
    email: str | None = None
    password: str | None = None


class RegisterRequest(BaseModel):
    email: str = Field(..., min_length=1, max_length=255)
    password: str = Field(..., min_length=6, max_length=100)
    role: str = Field(..., pattern="^(donor|ngo|admin)$")


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    role: str


class RegisterResponse(BaseModel):
    message: str
    user_id: str
    email: str
    role: str
