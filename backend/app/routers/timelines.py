from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.timeline import Timeline
from app.models.network_state import NetworkState
from app.models.job import Job
from app.schemas.timeline import TimelineRead
from app.schemas.network_state import NetworkStateRead

router = APIRouter()

@router.get("/timelines/{job_id}")
async def get_timeline(job_id: str, db: AsyncSession = Depends(get_db)):
    res_tl = await db.execute(select(Timeline).filter(Timeline.job_id == job_id))
    timeline = res_tl.scalar_one_or_none()

    if not timeline:
        raise HTTPException(status_code=404, detail="Timeline not found for this job. Job may still be processing.")

    res_states = await db.execute(
        select(NetworkState)
        .filter(NetworkState.job_id == job_id)
        .order_by(NetworkState.window_index)
    )
    states = res_states.scalars().all()

    res_job = await db.execute(select(Job).filter(Job.id == job_id))
    job = res_job.scalar_one_or_none()

    timeline_data = TimelineRead.model_validate(timeline).model_dump()
    timeline_data["total_packets"] = job.total_packets if job else None
    timeline_data["total_flows"] = job.total_flows if job else None
    timeline_data["filename"] = job.filename if job else None

    return {
        "timeline": timeline_data,
        "states": [NetworkStateRead.model_validate(s) for s in states],
    }
