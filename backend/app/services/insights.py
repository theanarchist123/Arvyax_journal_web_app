"""Insights aggregation service — computes analytics from stored journal entries."""
from __future__ import annotations
from collections import Counter
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.journal import JournalEntry
from app.schemas.journal import InsightsResponse


async def get_insights(user_id: str, db: AsyncSession) -> InsightsResponse:
    result = await db.execute(
        select(JournalEntry)
        .where(JournalEntry.user_id == user_id)
        .order_by(JournalEntry.created_at.desc())
    )
    entries = result.scalars().all()

    if not entries:
        return InsightsResponse(totalEntries=0)

    emotions = [e.emotion for e in entries if e.emotion]
    ambiences = [e.ambience for e in entries]
    all_keywords: list[str] = []
    for e in entries[:10]:  # recent 10 for keywords
        if e.keywords:
            all_keywords.extend(e.keywords)

    emotion_counter = Counter(emotions)
    ambience_counter = Counter(ambiences)
    keyword_counter = Counter(all_keywords)

    return InsightsResponse(
        totalEntries=len(entries),
        topEmotion=emotion_counter.most_common(1)[0][0] if emotions else None,
        mostUsedAmbience=ambience_counter.most_common(1)[0][0] if ambiences else None,
        recentKeywords=[kw for kw, _ in keyword_counter.most_common(8)],
        emotionDistribution=dict(emotion_counter),
        ambienceDistribution=dict(ambience_counter),
    )
