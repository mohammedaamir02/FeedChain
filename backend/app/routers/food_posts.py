from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime, timezone
from app.dependencies.auth import get_current_user
from app.core.supabase import supabase
from app.schemas.food import CreateFoodPostRequest

router = APIRouter(prefix="/food-posts", tags=["food-posts"])


# -------------------------
# POST /food-posts
# Donor creates food post
# -------------------------
@router.post("")
def create_food_post(payload: CreateFoodPostRequest, current_user=Depends(get_current_user)):
    if current_user["role"] != "donor":
        raise HTTPException(status_code=403, detail="Only donors can post food")

    try:
        expiry_dt = datetime.fromisoformat(payload.expiry_time.replace("Z", "+00:00"))
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid expiry_time format")
    if expiry_dt.tzinfo is None:
        expiry_dt = expiry_dt.replace(tzinfo=timezone.utc)
    now_utc = datetime.now(timezone.utc)
    if expiry_dt <= now_utc:
        raise HTTPException(status_code=400, detail="Expiry time must be in the future")

    data = {
        "donor_id": current_user["user_id"],
        "food_type": payload.food_type,
        "quantity": payload.quantity,
        "expiry_time": payload.expiry_time,
        "pickup_lat": payload.pickup_lat,
        "pickup_lng": payload.pickup_lng,
        "status": "POSTED",
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
# GET /food-posts/nearby (must be before /{post_id})
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
