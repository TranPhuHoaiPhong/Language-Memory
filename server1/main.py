from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
import os
import httpx
from routers import ipa
from config import AUDIO_DIR
import app_state

app = FastAPI()

# Mount static audio directory
os.makedirs(AUDIO_DIR, exist_ok=True)
app.mount("/audio", StaticFiles(directory=AUDIO_DIR), name="audio")

# Include routers
app.include_router(ipa.router)

@app.on_event("startup")
async def startup_event():
    # Initialize HTTP client for translation service
    app_state.http_client = httpx.AsyncClient(
        timeout=httpx.Timeout(5.0, connect=3.0),
        limits=httpx.Limits(max_keepalive_connections=20, max_connections=50),
        http2=False
    )

@app.on_event("shutdown")
async def shutdown_event():
    if app_state.http_client:
        await app_state.http_client.aclose()