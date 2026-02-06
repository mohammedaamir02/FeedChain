from fastapi import FastAPI
from app.routers import (
    auth,
    food_posts,
    claims,
    distribution,
    impact,
    admin
)

app = FastAPI(title="FeedChain Backend")

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
