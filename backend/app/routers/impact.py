from fastapi import APIRouter
from app.core.supabase import supabase

router = APIRouter(tags=["impact"])

@router.get("/impact/summary")
def impact_summary():
    claims = (
        supabase.table("claims")
        .select("people_served")
        .eq("status", "DISTRIBUTED")
        .execute()
    ).data

    ngos = (
        supabase.table("users")
        .select("id")
        .eq("role", "ngo")
        .execute()
    ).data

    meals = sum([c["people_served"] or 0 for c in claims])

    return {
        "meals_served": meals,
        "active_ngos": len(ngos),
        "successful_distributions": len(claims)
    }
