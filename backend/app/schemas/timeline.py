from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime

class TimelineRead(BaseModel):
    id: UUID
    job_id: UUID
    state_count: int
    window_seconds: int
    capture_start: datetime
    capture_end: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
