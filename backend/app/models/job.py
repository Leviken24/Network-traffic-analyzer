import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import Column, String, Integer, DateTime
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base

class Job(Base):
    __tablename__ = "jobs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_size = Column(Integer, nullable=False)
    status = Column(String, nullable=False, default="PENDING")
    window_seconds = Column(Integer, nullable=False)
    error_message = Column(String, nullable=True)
    total_packets = Column(Integer, nullable=True)
    total_flows = Column(Integer, nullable=True)
    total_states = Column(Integer, nullable=True)
    capture_start = Column(DateTime, nullable=True)
    capture_end = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
