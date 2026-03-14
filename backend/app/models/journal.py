from sqlalchemy import Column, String, Text, DateTime, func, JSON
from sqlalchemy.dialects.sqlite import JSON as SQLiteJSON
from app.database import Base
import uuid


def _new_id():
    return str(uuid.uuid4())


class JournalEntry(Base):
    __tablename__ = "journal_entries"

    id = Column(String(36), primary_key=True, default=_new_id)
    user_id = Column(String(128), nullable=False, index=True)
    ambience = Column(String(32), nullable=False)  # forest | ocean | mountain
    text = Column(Text, nullable=False)

    # LLM-populated fields
    emotion = Column(String(64), nullable=True)
    keywords = Column(JSON, nullable=True)      # stored as JSON array
    summary = Column(Text, nullable=True)
    text_hash = Column(String(64), nullable=True, index=True)  # for caching

    created_at = Column(DateTime(timezone=True), server_default=func.now())
