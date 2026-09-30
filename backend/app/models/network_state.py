import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Index
from sqlalchemy.types import JSON
from app.database import Base

class NetworkState(Base):
    __tablename__ = "network_states"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    job_id = Column(String, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    window_index = Column(Integer, nullable=False)
    window_start = Column(DateTime, nullable=False)
    window_end = Column(DateTime, nullable=False)
    features = Column(JSON, nullable=False)
    flow_count = Column(Integer, nullable=False)
    packet_count = Column(Integer, nullable=False)
    byte_count = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index("ix_network_states_job_id_window_index", "job_id", "window_index"),
    )
