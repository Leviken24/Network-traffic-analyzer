import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime
from sqlalchemy.types import JSON
from app.database import Base

class Job(Base):
    __tablename__ = "jobs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
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
