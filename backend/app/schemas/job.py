from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Optional

class JobCreate(BaseModel):
    pass

class JobRead(BaseModel):
    id: UUID
    filename: str
    file_path: str
    file_size: int
    status: str
    window_seconds: int
    error_message: Optional[str]
    total_packets: Optional[int]
    total_flows: Optional[int]
    total_states: Optional[int]
    capture_start: Optional[datetime]
    capture_end: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
