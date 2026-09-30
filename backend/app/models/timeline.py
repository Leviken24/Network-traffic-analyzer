import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from app.database import Base

class Timeline(Base):
    __tablename__ = "timelines"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    job_id = Column(String, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, unique=True)
    state_count = Column(Integer, nullable=False)
    window_seconds = Column(Integer, nullable=False)
    capture_start = Column(DateTime, nullable=False)
    capture_end = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
