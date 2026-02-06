from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime
from app.dependencies.auth import get_current_user
from app.core.supabase import supabase

router = APIRouter(prefix="/food-posts", tags=["food-posts"])

# -------------------------
# POST /food-posts
# Donor creates food post
# -------------------------
@router.post("")
def create_food_post(payload: dict, current_user=Depends(get_current_user)):
    if current_user["role"] != "donor":
        raise HTTPException(status_code=403, detail="Only donors can post food")

    expiry_time = payload.get("expiry_time")
    if not expiry_time:
        raise HTTPException(status_code=400, detail="expiry_time required")

    if datetime.fromisoformat(expiry_time) <= datetime.utcnow():
        raise HTTPException(status_code=400, detail="Expiry time must be in the future")

    data = {
        "donor_id": current_user["user_id"],
        "food_type": payload.get("food_type"),
        "quantity": payload.get("quantity"),
        "expiry_time": expiry_time,
        "pickup_lat": payload.get("pickup_lat"),
        "pickup_lng": payload.get("pickup_lng"),
        "status": "POSTED"
    }

    result = supabase.table("food_posts").insert(data).execute()
    return result.data[0]

# -------------------------
# GET /food-posts/my
# Donor sees own posts
# -------------------------
@router.get("/my")
def my_food_posts(current_user=Depends(get_current_user)):
    if current_user["role"] != "donor":
        raise HTTPException(status_code=403, detail="Only donors allowed")

    result = (
        supabase
        .table("food_posts")
        .select("*")
        .eq("donor_id", current_user["user_id"])
        .execute()
    )
    return result.data

# -------------------------
# GET /food-posts/{id}
# -------------------------
@router.get("/{post_id}")
def get_food_post(post_id: str, current_user=Depends(get_current_user)):
    result = (
        supabase
        .table("food_posts")
        .select("*")
        .eq("id", post_id)
        .single()
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Food post not found")

    return result.data

# -------------------------
# GET /food-posts/nearby
# NGO discovery
# -------------------------
@router.get("/nearby")
def nearby_food(lat: float, lng: float, current_user=Depends(get_current_user)):
    if current_user["role"] != "ngo":
        raise HTTPException(status_code=403, detail="Only NGOs allowed")

    now = datetime.utcnow().isoformat()

    result = (
        supabase
        .table("food_posts")
        .select("*")
        .eq("status", "POSTED")
        .gt("expiry_time", now)
        .execute()
    )

    return result.data
