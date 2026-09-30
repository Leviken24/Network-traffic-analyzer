import os
import uuid
import asyncio
import aiofiles
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Query, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.config import settings
from app.models.job import Job
from app.models.network_state import NetworkState
from app.models.timeline import Timeline
from app.schemas.job import JobRead
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


def _run_pipeline(job_id: str, file_path: str, window_seconds: int):
    """Run the processing pipeline synchronously in a thread pool thread."""
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from app.pipeline.pipeline import ProcessingPipeline

    engine = create_engine(settings.SYNC_DATABASE_URL, connect_args={"check_same_thread": False})
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()

    try:
        job = db.query(Job).filter(Job.id == job_id).first()
        if not job:
            return
        job.status = "PROCESSING"
        job.updated_at = datetime.utcnow()
        db.commit()

        pipeline = ProcessingPipeline(window_seconds=window_seconds)
        result = pipeline.run(file_path)

        for pw in result.windows:
            ns = NetworkState(
                id=str(uuid.uuid4()),
                job_id=job_id,
                window_index=pw.window_index,
                window_start=pw.window_start,
                window_end=pw.window_end,
                features=pw.features,
                flow_count=pw.flow_count,
                packet_count=pw.packet_count,
                byte_count=pw.byte_count,
                created_at=datetime.utcnow(),
            )
            db.add(ns)

        tl = Timeline(
            id=str(uuid.uuid4()),
            job_id=job_id,
            state_count=len(result.windows),
            window_seconds=window_seconds,
            capture_start=result.capture_start,
            capture_end=result.capture_end,
            created_at=datetime.utcnow(),
        )
        db.add(tl)

        job.status = "DONE"
        job.total_packets = result.total_packets
        job.total_flows = result.total_flows
        job.total_states = len(result.windows)
        job.capture_start = result.capture_start
        job.capture_end = result.capture_end
        job.updated_at = datetime.utcnow()
        db.commit()
        logger.info(f"Job {job_id} completed: {len(result.windows)} states, {result.total_packets} packets")

    except Exception as e:
        logger.exception(f"Job {job_id} failed: {e}")
        db.rollback()
        job = db.query(Job).filter(Job.id == job_id).first()
        if job:
            job.status = "FAILED"
            job.error_message = str(e)[:2000]
            job.updated_at = datetime.utcnow()
            db.commit()
    finally:
        db.close()
        engine.dispose()


def _dispatch_pipeline(job_id: str, file_path: str, window_seconds: int):
    """Dispatch pipeline in a separate thread (called from BackgroundTasks)."""
    import concurrent.futures
    with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
        executor.submit(_run_pipeline, job_id, file_path, window_seconds)



@router.post("/upload", response_model=JobRead, status_code=202)
async def upload_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    window_seconds: int = Query(settings.DEFAULT_WINDOW_SECONDS, ge=1),
    db: AsyncSession = Depends(get_db)
):
    if not file.filename.lower().endswith((".pcap", ".pcapng", ".csv")):
        raise HTTPException(status_code=400, detail="Invalid file extension. Supported: .pcap, .pcapng, .csv")

    content = await file.read()
    file_size = len(content)

    if file_size > settings.MAX_UPLOAD_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"File too large. Maximum: {settings.MAX_UPLOAD_MB} MB")

    if file_size == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    job_id = str(uuid.uuid4())
    file_path = os.path.join(settings.UPLOAD_DIR, f"{job_id}_{file.filename}")

    async with aiofiles.open(file_path, 'wb') as out_file:
        await out_file.write(content)

    job = Job(
        id=job_id,
        filename=file.filename,
        file_path=file_path,
        file_size=file_size,
        status="PENDING",
        window_seconds=window_seconds,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)

    # Run pipeline in a background thread (non-blocking, no Celery/Redis needed)
    background_tasks.add_task(_dispatch_pipeline, job_id, file_path, window_seconds)

    return job
