from pydantic import BaseModel, Field
from typing import Optional


class CreateFoodPostRequest(BaseModel):
    food_type: str = Field(..., min_length=1, max_length=200)
    quantity: str = Field(..., min_length=1, max_length=100)
    expiry_time: str  # ISO datetime
    pickup_lat: Optional[float] = None
    pickup_lng: Optional[float] = None


class DistributeRequest(BaseModel):
    people_served: int = Field(..., ge=1, le=100000)
    location: Optional[str] = Field(None, max_length=500)


class VerifyPickupRequest(BaseModel):
    otp: str = Field(..., min_length=1, max_length=10)
