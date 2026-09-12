from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime

class FlowRead(BaseModel):
    id: UUID
    job_id: UUID
    src_ip: str
    dst_ip: str
    src_port: int
    dst_port: int
    protocol: str
    start_time: datetime
    end_time: datetime
    duration_ms: float
    packet_count: int
    byte_count: int
    fwd_packets: int
    bwd_packets: int
    fwd_bytes: int
    bwd_bytes: int
    syn_count: int
    fin_count: int
    rst_count: int
    ack_count: int
    avg_iat_ms: float
    window_start: datetime

    model_config = ConfigDict(from_attributes=True)
