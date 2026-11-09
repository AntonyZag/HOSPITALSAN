from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.apis.connectivity import router
from backend.config import CORS_ORIGINS

app = FastAPI(title="Hospital San Gabriel")
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=["GET"],
)
app.include_router(router)
