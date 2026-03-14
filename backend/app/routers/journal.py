"""
Journal API Router — all required endpoints:
  POST   /api/journal
  GET    /api/journal/:userId
  POST   /api/journal/analyze
  GET    /api/journal/insights/:userId
  GET    /api/journal/analyze/stream  (bonus: SSE streaming)
"""
from __future__ import annotations
import logging
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.journal import JournalEntry
from app.schemas.journal import (
    JournalCreateRequest,
    JournalEntryResponse,
    AnalyzeRequest,
    EmotionAnalysis,
    InsightsResponse,
)
from app.services.llm import analyze_emotion, analyze_emotion_stream, get_text_hash
from app.services.insights import get_insights

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/journal", tags=["journal"])


# ── POST /api/journal ─────────────────────────────────────────────────────────

@router.post("", response_model=JournalEntryResponse, status_code=201)
async def create_journal_entry(
    body: JournalCreateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Store a new journal entry and auto-analyze emotion via LLM."""
    text_hash = get_text_hash(body.text)

    # Check cache: same text analyzed before?
    cached = await db.execute(
        select(JournalEntry).where(JournalEntry.text_hash == text_hash)
    )
    cached_entry = cached.scalars().first()

    emotion, keywords, summary = None, None, None
    if cached_entry and cached_entry.emotion:
        # Cache HIT — reuse LLM result, save API cost
        emotion = cached_entry.emotion
        keywords = cached_entry.keywords
        summary = cached_entry.summary
        logger.info(f"Cache hit for text_hash={text_hash[:12]}…")
    else:
        # Cache MISS — call LLM
        try:
            analysis = await analyze_emotion(body.text)
            emotion = analysis["emotion"]
            keywords = analysis["keywords"]
            summary = analysis["summary"]
        except RuntimeError as exc:
            logger.error(f"LLM failed during entry creation: {exc}")
            # Store entry without analysis — user can retry via /analyze

    entry = JournalEntry(
        user_id=body.userId,
        ambience=body.ambience,
        text=body.text,
        emotion=emotion,
        keywords=keywords,
        summary=summary,
        text_hash=text_hash,
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return JournalEntryResponse.from_orm_entry(entry)


# ── GET /api/journal/:userId ──────────────────────────────────────────────────

@router.get("/{user_id}", response_model=list[JournalEntryResponse])
async def get_journal_entries(
    user_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Return all journal entries for a user, newest first."""
    result = await db.execute(
        select(JournalEntry)
        .where(JournalEntry.user_id == user_id)
        .order_by(JournalEntry.created_at.desc())
    )
    entries = result.scalars().all()
    return [JournalEntryResponse.from_orm_entry(e) for e in entries]


# ── POST /api/journal/analyze ─────────────────────────────────────────────────

@router.post("/analyze", response_model=EmotionAnalysis)
async def analyze_journal_text(
    body: AnalyzeRequest,
    db: AsyncSession = Depends(get_db),
):
    """Analyze emotion of arbitrary text via LLM. Uses DB cache on hash."""
    text_hash = get_text_hash(body.text)

    # Check DB cache
    cached = await db.execute(
        select(JournalEntry).where(
            JournalEntry.text_hash == text_hash,
            JournalEntry.emotion.isnot(None),
        )
    )
    cached_entry = cached.scalars().first()
    if cached_entry:
        return EmotionAnalysis(
            emotion=cached_entry.emotion,
            keywords=cached_entry.keywords or [],
            summary=cached_entry.summary or "",
        )

    try:
        analysis = await analyze_emotion(body.text)
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    return EmotionAnalysis(**analysis)


# ── GET /api/journal/insights/:userId ────────────────────────────────────────

@router.get("/insights/{user_id}", response_model=InsightsResponse)
async def get_insights_endpoint(
    user_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Return aggregated insights for a user's journal history."""
    return await get_insights(user_id, db)


# ── GET /api/journal/analyze/stream (Bonus — SSE) ────────────────────────────

@router.post("/analyze/stream")
async def analyze_stream(body: AnalyzeRequest):
    """
    Streaming LLM response via Server-Sent Events.
    Frontend can connect and receive word-by-word typewriter effect.
    """
    async def event_generator():
        try:
            async for chunk in analyze_emotion_stream(body.text):
                # SSE format: "data: <chunk>\n\n"
                yield f"data: {chunk}\n\n"
        except Exception as exc:
            yield f"data: [ERROR] {exc}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
