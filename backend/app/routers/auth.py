from fastapi import APIRouter, Depends, HTTPException
from app.dependencies.auth import get_current_user
from app.core.security import create_access_token, hash_password, verify_password
from app.core.supabase import supabase
from app.schemas.auth import (
    LoginRequest,
    RegisterRequest,
    RegisterResponse,
    TokenResponse,
)
import uuid

router = APIRouter(prefix="/auth", tags=["auth"])


def _ensure_user_in_db(user_id: str, role: str, email: str | None = None):
    row = {"id": user_id, "role": role}
    if email:
        row["email"] = email
    try:
        supabase.table("users").upsert(row, on_conflict="id").execute()
    except Exception:
        try:
            supabase.table("users").upsert(
                {"id": user_id, "role": role},
                on_conflict="id",
            ).execute()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Could not register user: {e!s}")


@router.post("/register", response_model=RegisterResponse)
def register(payload: RegisterRequest):
    """Create a new user with email and password. Remember your password – it is not stored in plain text."""
    user_id = str(uuid.uuid4())
    password_hash = hash_password(payload.password)
    try:
        supabase.table("users").insert({
            "id": user_id,
            "email": payload.email.strip().lower(),
            "role": payload.role,
            "password_hash": password_hash,
        }).execute()
    except Exception as e:
        err = str(e).lower()
        if "unique" in err or "duplicate" in err or "23505" in err:
            raise HTTPException(status_code=400, detail="Email already registered")
        raise HTTPException(status_code=500, detail=f"Could not create user: {e!s}")
    return RegisterResponse(
        message="User created. You can now sign in with this email and password.",
        user_id=user_id,
        email=payload.email.strip().lower(),
        role=payload.role,
    )


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest):
    """Sign in with email + password, or demo login with role only."""
    if payload.email and payload.password is not None:
        # Real login: look up user by email and verify password
        result = (
            supabase.table("users")
            .select("id, role, password_hash")
            .eq("email", payload.email.strip().lower())
            .limit(1)
            .execute()
        )
        if not result.data or len(result.data) == 0:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        row = result.data[0]
        stored_hash = row.get("password_hash")
        if not stored_hash or not verify_password(payload.password, stored_hash):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        user_id = row["id"]
        role = row["role"]
        token = create_access_token({"sub": user_id, "role": role})
        return TokenResponse(access_token=token, user_id=user_id, role=role)

    # Demo login: role only, create ephemeral user in DB
    if not payload.role:
        raise HTTPException(
            status_code=400,
            detail="Provide either email+password or role (for demo)",
        )
    user_id = str(uuid.uuid4())
    _ensure_user_in_db(user_id, payload.role, email=f"demo-{user_id}@feedchain.local")
    token = create_access_token({"sub": user_id, "role": payload.role})
    return TokenResponse(
        access_token=token,
        user_id=user_id,
        role=payload.role,
    )


@router.get("/me")
def me(current_user=Depends(get_current_user)):
    return current_user
