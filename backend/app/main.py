from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import (
    auth,
    food_posts,
    claims,
    distribution,
    impact,
    admin
)

app = FastAPI(title="FeedChain Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Core routers
app.include_router(auth.router)
app.include_router(food_posts.router)
app.include_router(claims.router)

# Block 4 routers
app.include_router(distribution.router)
app.include_router(impact.router)
app.include_router(admin.router)

@app.get("/health")
def health():
    return {"status": "ok"}
