"""
MathKnights FastAPI Backend — with SQLite + DeepSeek LLM integration.
Run: uvicorn app.main:app --reload --port 8000
"""

import os
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import init_db
from app.routers import chapters, challenges, missions, user, ocr


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title="MathKnights API",
    description="Backend for the MathKnights math-learning gamification app",
    version="0.2.0",
    lifespan=lifespan,
)

# CORS — allow Vite dev server and production origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:8080",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ─────────────────────────────────────────────────────────

app.include_router(chapters.router, prefix="/api/chapters", tags=["chapters"])
app.include_router(challenges.router, prefix="/api/challenge", tags=["challenge"])
app.include_router(missions.router, prefix="/api/missions", tags=["missions"])
app.include_router(user.router, prefix="/api/user", tags=["user"])
app.include_router(ocr.router, prefix="/api/ocr", tags=["ocr"])


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "mathknights-api"}
