from fastapi import APIRouter, Depends, HTTPException
from app.dependencies.auth import get_current_user
from app.core.supabase import supabase

router = APIRouter(tags=["admin"])

@router.get("/admin/overview")
def admin_overview(current_user=Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")

    food_posts = supabase.table("food_posts").select("*").execute().data
    claims = supabase.table("claims").select("*").execute().data

    return {
        "food_posts": food_posts,
        "claims": claims
    }
