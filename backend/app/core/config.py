import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from cwd, then backend/, then backend/app/ (later overrides)
load_dotenv()
_this_dir = Path(__file__).resolve().parent
_backend_root = _this_dir.parent.parent  # backend/
_app_dir = _this_dir.parent              # backend/app/
for env_dir in (_backend_root, _app_dir):
    env_file = env_dir / ".env"
    if env_file.is_file():
        load_dotenv(env_file, override=True)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-secret-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise RuntimeError(
        "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set. "
        "Add them to backend/.env or backend/app/.env (copy from .env.example)."
    )
