from fastapi import APIRouter, Depends
from app.dependencies.auth import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])

@router.get("/me")
def me(current_user=Depends(get_current_user)):
    return current_user
