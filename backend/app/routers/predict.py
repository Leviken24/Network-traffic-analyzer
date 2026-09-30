"""
Prediction router — exposes temporal world model inference endpoints.

GET /api/predict/{job_id}
    Runs the temporal world model over the job's NetworkState timeline
    and returns current risk, K-step forecast, MITRE stage, and feature attributions.

GET /api/predict/{job_id}?sequence_length=N&forecast_steps=K
    Customise the sequence window and forecast horizon.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.database import get_db
from app.models.job import Job
from app.models.network_state import NetworkState
from app.world_model import get_world_model, ATTACK_STAGES
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/predict/{job_id}")
async def predict_job(
    job_id: str,
    sequence_length: int = Query(8, ge=1, le=50, description="Number of recent states to use as context"),
    forecast_steps: int = Query(5, ge=1, le=20, description="Number of future windows to predict"),
    db: AsyncSession = Depends(get_db),
):
    """
    Run temporal world model inference over a job's timeline.
    Returns current risk, K-step forecast, attack stage, and contributing features.
    """
    # Verify job exists and is done
    res_job = await db.execute(select(Job).filter(Job.id == job_id))
    job = res_job.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.status not in ("DONE",):
        raise HTTPException(
            status_code=400,
            detail=f"Job is not yet complete (status: {job.status}). Wait for processing to finish."
        )

    # Fetch ordered network states
    res_states = await db.execute(
        select(NetworkState)
        .filter(NetworkState.job_id == job_id)
        .order_by(NetworkState.window_index)
    )
    states = res_states.scalars().all()

    if not states:
        raise HTTPException(status_code=404, detail="No network states found for this job.")

    # Use last `sequence_length` states as context
    context_states = states[-sequence_length:]
    features_list = [s.features for s in context_states]

    # Run world model
    model = get_world_model()
    model.forecast_steps = forecast_steps
    prediction = model.predict(features_list)

    # Add metadata
    prediction["job_id"] = job_id
    prediction["total_states"] = len(states)
    prediction["context_states"] = len(context_states)
    prediction["window_seconds"] = job.window_seconds
    prediction["attack_stages"] = ATTACK_STAGES

    # Add per-state risk timeline (for chart rendering)
    from app.world_model import _rule_based_risk_and_stage
    state_timeline = []
    for s in states:
        r, stage = _rule_based_risk_and_stage(s.features)
        state_timeline.append({
            "window_index": s.window_index,
            "window_start": s.window_start.isoformat() if s.window_start else None,
            "risk": round(r, 3),
            "stage": stage,
            "stage_label": ATTACK_STAGES[stage],
        })
    prediction["state_timeline"] = state_timeline

    return prediction


@router.get("/stages")
async def get_stages():
    """Return the MITRE ATT&CK-inspired stage definitions."""
    return {
        "stages": [
            {
                "index": i,
                "label": label,
                "color": ["#22c55e", "#eab308", "#f97316", "#ef4444", "#7c3aed"][i],
            }
            for i, label in enumerate(ATTACK_STAGES)
        ]
    }
