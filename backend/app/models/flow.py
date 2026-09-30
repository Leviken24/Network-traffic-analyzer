import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, Float, ForeignKey
from app.database import Base

class Flow(Base):
    __tablename__ = "flows"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    job_id = Column(String, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    src_ip = Column(String, nullable=False)
    dst_ip = Column(String, nullable=False)
    src_port = Column(Integer, nullable=False)
    dst_port = Column(Integer, nullable=False)
    protocol = Column(String, nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    duration_ms = Column(Float, nullable=False)
    packet_count = Column(Integer, nullable=False)
    byte_count = Column(Integer, nullable=False)
    fwd_packets = Column(Integer, nullable=False)
    bwd_packets = Column(Integer, nullable=False)
    fwd_bytes = Column(Integer, nullable=False)
    bwd_bytes = Column(Integer, nullable=False)
    syn_count = Column(Integer, nullable=False)
    fin_count = Column(Integer, nullable=False)
    rst_count = Column(Integer, nullable=False)
    ack_count = Column(Integer, nullable=False)
    avg_iat_ms = Column(Float, nullable=False)
    window_start = Column(DateTime, nullable=False)
