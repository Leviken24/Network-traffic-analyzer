from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

class JobCreate(BaseModel):
    pass

class JobRead(BaseModel):
    id: str
    filename: str
    file_path: str
    file_size: int
    status: str
    window_seconds: int
    error_message: Optional[str] = None
    total_packets: Optional[int] = None
    total_flows: Optional[int] = None
    total_states: Optional[int] = None
    capture_start: Optional[datetime] = None
    capture_end: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
