from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid
from app.database import get_db
from app.models.network_state import NetworkState
from app.schemas.network_state import NetworkStateRead

router = APIRouter()

@router.get("/states/{state_id}", response_model=NetworkStateRead)
async def get_state(state_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(NetworkState).filter(NetworkState.id == state_id))
    state = result.scalar_one_or_none()
    if not state:
        raise HTTPException(status_code=404, detail="State not found")
    return state
