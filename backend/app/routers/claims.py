from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime, timezone
from app.dependencies.auth import get_current_user
from app.core.supabase import supabase
from app.schemas.food import VerifyPickupRequest

router = APIRouter(tags=["claims"])

@router.post("/food-posts/{post_id}/claim")
def claim_food(post_id: str, current_user=Depends(get_current_user)):
    if current_user["role"] != "ngo":
        raise HTTPException(status_code=403, detail="Only NGOs can claim food")

    # Fetch food post
    food = (
        supabase
        .table("food_posts")
        .select("*")
        .eq("id", post_id)
        .single()
        .execute()
    ).data

    if not food:
        raise HTTPException(status_code=404, detail="Food post not found")

    if food["status"] != "POSTED":
        raise HTTPException(status_code=400, detail="Food already claimed or unavailable")

    expiry_dt = datetime.fromisoformat(str(food["expiry_time"]).replace("Z", "+00:00"))
    if expiry_dt.tzinfo is None:
        expiry_dt = expiry_dt.replace(tzinfo=timezone.utc)
    if expiry_dt <= datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Food has expired")

    # Create claim (DB-level lock via UNIQUE constraint)
    try:
        supabase.table("claims").insert({
            "food_post_id": post_id,
            "ngo_id": current_user["user_id"],
            "status": "CLAIMED",
            "claimed_at": datetime.utcnow().isoformat()
        }).execute()
    except Exception:
        raise HTTPException(
            status_code=409,
            detail="Food already claimed by another NGO"
        )

    # Update food status
    supabase.table("food_posts").update({
        "status": "CLAIMED"
    }).eq("id", post_id).execute()

    return {"message": "Food successfully claimed"}


@router.get("/claims/my")
def my_claims(current_user=Depends(get_current_user)):
    if current_user["role"] != "ngo":
        raise HTTPException(status_code=403, detail="Only NGOs can list claims")
    result = (
        supabase.table("claims")
        .select("*, food_posts(*)")
        .eq("ngo_id", current_user["user_id"])
        .order("claimed_at", desc=True)
        .execute()
    )
    return result.data


@router.post("/claims/{claim_id}/cancel")
def cancel_claim(claim_id: str, current_user=Depends(get_current_user)):
    if current_user["role"] != "ngo":
        raise HTTPException(status_code=403, detail="Only NGOs can cancel claims")

    claim = (
        supabase
        .table("claims")
        .select("*")
        .eq("id", claim_id)
        .single()
        .execute()
    ).data

    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    if claim["ngo_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Not your claim")

    if claim["status"] != "CLAIMED":
        raise HTTPException(status_code=400, detail="Cannot cancel after pickup")

    # Cancel claim
    supabase.table("claims").update({
        "status": "CANCELLED"
    }).eq("id", claim_id).execute()

    # Restore food post
    supabase.table("food_posts").update({
        "status": "POSTED"
    }).eq("id", claim["food_post_id"]).execute()

    return {"message": "Claim cancelled"}


@router.post("/claims/{claim_id}/pickup")
def pickup_food(claim_id: str, current_user=Depends(get_current_user)):
    if current_user["role"] != "ngo":
        raise HTTPException(status_code=403, detail="Only NGOs can pickup food")

    # Fetch claim
    claim = (
        supabase
        .table("claims")
        .select("*")
        .eq("id", claim_id)
        .single()
        .execute()
    ).data

    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    if claim["ngo_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Not your claim")

    if claim["status"] != "CLAIMED":
        raise HTTPException(status_code=400, detail="Invalid claim state")

    # 🔒 CHECK: pickup already initiated?
    existing_verification = (
        supabase
        .table("pickup_verification")
        .select("id, otp_code")
        .eq("claim_id", claim_id)
        .execute()
    ).data

    if existing_verification:
        # Idempotent response (safe retry)
        return {
            "message": "Pickup already initiated",
            "otp_for_demo": existing_verification[0]["otp_code"]
        }

    # Generate OTP (static for MVP)
    otp = "123456"

    # Insert verification row
    supabase.table("pickup_verification").insert({
        "claim_id": claim_id,
        "method": "OTP",
        "otp_code": otp,
        "verified": False
    }).execute()

    return {
        "message": "Pickup initiated",
        "otp_for_demo": otp
    }


@router.post("/claims/{claim_id}/verify")
def verify_pickup(claim_id: str, payload: VerifyPickupRequest, current_user=Depends(get_current_user)):
    if current_user["role"] != "ngo":
        raise HTTPException(status_code=403, detail="Only NGOs can verify pickup")

    otp_input = payload.otp
    if not otp_input:
        raise HTTPException(status_code=400, detail="OTP required")

    # Fetch latest OTP (order by id, not created_at)
    verification_rows = (
        supabase
        .table("pickup_verification")
        .select("*")
        .eq("claim_id", claim_id)
        .order("id", desc=True)
        .limit(1)
        .execute()
    ).data

    if not verification_rows:
        raise HTTPException(status_code=404, detail="Verification not found")

    verification = verification_rows[0]

    if verification["otp_code"] != otp_input:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    # Mark THIS OTP as verified (by id, not claim_id)
    supabase.table("pickup_verification").update({
        "verified": True,
        "verified_at": datetime.utcnow().isoformat()
    }).eq("id", verification["id"]).execute()

    # Fetch claim to get food_post_id
    claim = (
        supabase
        .table("claims")
        .select("food_post_id")
        .eq("id", claim_id)
        .single()
        .execute()
    ).data

    # Update claim
    supabase.table("claims").update({
        "status": "PICKED",
        "picked_at": datetime.utcnow().isoformat()
    }).eq("id", claim_id).execute()

    # Update food post using food_post_id (CORRECT)
    supabase.table("food_posts").update({
        "status": "PICKED"
    }).eq("id", claim["food_post_id"]).execute()

    return {"message": "Pickup verified, food picked"}
