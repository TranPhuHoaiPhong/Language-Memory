import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.routes.search import router as search_router
from app.routes.save import router as save_router
from app.routes.send_id import router as send_id_router
from app.routes.transcript import router as transcript_router


app = FastAPI(
    title="LINGO MEMORY API",
    version="1.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


# ============================================================
# AUDIO
# ============================================================

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

AUDIO_DIR = os.path.join(
    BASE_DIR,
    "audio"
)

os.makedirs(
    AUDIO_DIR,
    exist_ok=True
)

print("[AUDIO DIR]", AUDIO_DIR)


app.mount(
    "/audio",
    StaticFiles(directory=AUDIO_DIR),
    name="audio"
)


# ============================================================
# ROUTES
# ============================================================

app.include_router(
    search_router,
    prefix="/api"
)

app.include_router(
    save_router,
    prefix="/api"
)

app.include_router(
    send_id_router,
    prefix="/api"
)

app.include_router(
    transcript_router,
    prefix="/api"
)


@app.get("/")
async def root():
    return {
        "success": True,
        "message": "LINGO MEMORY API is running"
    }