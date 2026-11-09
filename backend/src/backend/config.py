from os import environ
from pathlib import Path

from dotenv import dotenv_values

settings = {**dotenv_values(Path(__file__).resolve().parents[2] / ".env"), **environ}
cors_origins = (settings.get("CORS_ORIGINS") or "").split(",")
CORS_ORIGINS = [origin.strip() for origin in cors_origins if origin.strip()]
