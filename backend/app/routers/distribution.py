from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime
from app.dependencies.auth import get_current_user
from app.core.supabase import supabase

router = APIRouter(tags=["distribution"])

@router.post("/claims/{claim_id}/distribute")
def distribute_food(
    claim_id: str,
    payload: dict,
    current_user=Depends(get_current_user)
):
    if current_user["role"] != "ngo":
        raise HTTPException(status_code=403, detail="Only NGOs can distribute food")

    claim = (
        supabase.table("claims")
        .select("*")
        .eq("id", claim_id)
        .single()
        .execute()
    ).data

    if not claim or claim["status"] != "PICKED":
        raise HTTPException(status_code=400, detail="Food not ready for distribution")

    people_served = payload.get("people_served")
    location = payload.get("location")

    if not people_served:
        raise HTTPException(status_code=400, detail="people_served required")

    # Update claim
    supabase.table("claims").update({
        "status": "DISTRIBUTED",
        "distributed_at": datetime.utcnow().isoformat(),
        "people_served": people_served,
        "distribution_location": location
    }).eq("id", claim_id).execute()

    # Close food post
    supabase.table("food_posts").update({
        "status": "CLOSED"
    }).eq("id", claim["food_post_id"]).execute()

    return {"message": "Food distributed successfully"}
