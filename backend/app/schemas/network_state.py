from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Dict, Any

class NetworkStateRead(BaseModel):
    id: UUID
    job_id: UUID
    window_index: int
    window_start: datetime
    window_end: datetime
    features: Dict[str, Any]
    flow_count: int
    packet_count: int
    byte_count: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
