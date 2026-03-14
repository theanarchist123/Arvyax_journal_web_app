"""
ArvyaX Journal — FastAPI Application Entry Point
"""
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.config import get_settings
from app.database import create_tables
from app.routers.journal import router as journal_router

logging.basicConfig(level=logging.INFO, format="%(levelname)s — %(name)s — %(message)s")
logger = logging.getLogger(__name__)
settings = get_settings()

# ── Rate limiter ──────────────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address, default_limits=["60/minute"])


# ── Lifespan — create tables on startup ──────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🌿 ArvyaX Journal starting up…")
    await create_tables()
    logger.info("✅ Database tables ready")
    yield
    logger.info("🌙 ArvyaX Journal shutting down…")


# ── FastAPI app ───────────────────────────────────────────────────────────────
app = FastAPI(
    title="ArvyaX Journal API",
    description="AI-Assisted Nature Journal — Emotion Analysis & Insights",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# CORS — allow Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(journal_router)


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/health")
async def health():
    return {"status": "ok", "service": "ArvyaX Journal API"}


@app.get("/")
async def root():
    return {
        "name": "ArvyaX Journal API",
        "version": "1.0.0",
        "docs": "/docs",
        "endpoints": [
            "POST /api/journal",
            "GET  /api/journal/{userId}",
            "POST /api/journal/analyze",
            "POST /api/journal/analyze/stream",
            "GET  /api/journal/insights/{userId}",
        ],
    }
