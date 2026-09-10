import os
import uuid
import aiofiles
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.config import settings
from app.models.job import Job
from app.schemas.job import JobRead
from app.tasks.process_capture import process_capture
from datetime import datetime

router = APIRouter()

@router.post("/upload", response_model=JobRead, status_code=202)
async def upload_file(
    file: UploadFile = File(...),
    window_seconds: int = Query(settings.DEFAULT_WINDOW_SECONDS, ge=1),
    db: AsyncSession = Depends(get_db)
):
    if not file.filename.lower().endswith((".pcap", ".pcapng", ".csv")):
        raise HTTPException(status_code=400, detail="Invalid file extension")

    file.file.seek(0, os.SEEK_END)
    file_size = file.file.tell()
    file.file.seek(0)
    
    if file_size > settings.MAX_UPLOAD_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large")

    job_id = uuid.uuid4()
    file_path = os.path.join(settings.UPLOAD_DIR, f"{job_id}_{file.filename}")
    
    async with aiofiles.open(file_path, 'wb') as out_file:
        content = await file.read()
        await out_file.write(content)

    job = Job(
        id=job_id,
        filename=file.filename,
        file_path=file_path,
        file_size=file_size,
        status="PENDING",
        window_seconds=window_seconds,
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)
    
    process_capture.delay(str(job.id), file_path, window_seconds)
    
    return job
