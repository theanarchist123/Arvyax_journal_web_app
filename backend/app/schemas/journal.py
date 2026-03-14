from __future__ import annotations
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


# ── Request schemas ───────────────────────────────────────────────────────────

class JournalCreateRequest(BaseModel):
    userId: str = Field(..., min_length=1, max_length=128)
    ambience: str = Field(..., pattern="^(forest|ocean|mountain)$")
    text: str = Field(..., min_length=1, max_length=5000)


class AnalyzeRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000)


# ── Response schemas ──────────────────────────────────────────────────────────

class EmotionAnalysis(BaseModel):
    emotion: str
    keywords: list[str]
    summary: str


class JournalEntryResponse(BaseModel):
    id: str
    userId: str
    ambience: str
    text: str
    emotion: Optional[str] = None
    keywords: Optional[list[str]] = None
    summary: Optional[str] = None
    createdAt: datetime

    model_config = {"from_attributes": True}

    @classmethod
    def from_orm_entry(cls, entry) -> "JournalEntryResponse":
        return cls(
            id=entry.id,
            userId=entry.user_id,
            ambience=entry.ambience,
            text=entry.text,
            emotion=entry.emotion,
            keywords=entry.keywords or [],
            summary=entry.summary,
            createdAt=entry.created_at,
        )


class InsightsResponse(BaseModel):
    totalEntries: int
    topEmotion: Optional[str] = None
    mostUsedAmbience: Optional[str] = None
    recentKeywords: list[str] = []
    emotionDistribution: dict[str, int] = {}
    ambienceDistribution: dict[str, int] = {}
