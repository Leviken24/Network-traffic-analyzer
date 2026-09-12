from celery import shared_task
from app.celery_app import celery_app
from app.pipeline.pipeline import ProcessingPipeline
from app.config import settings
import uuid
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.job import Job
from app.models.flow import Flow
from app.models.network_state import NetworkState
from app.models.timeline import Timeline

@celery_app.task(bind=True, name="process_capture")
def process_capture(self, job_id: str, file_path: str, window_seconds: int = 60):
    engine = create_engine(settings.SYNC_DATABASE_URL)
    Session = sessionmaker(bind=engine)
    db = Session()
    
    try:
        job = db.query(Job).filter(Job.id == uuid.UUID(job_id)).first()
        job.status = "PROCESSING"
        job.updated_at = datetime.utcnow()
        db.commit()
        
        pipeline = ProcessingPipeline(window_seconds=window_seconds)
        result = pipeline.run(file_path)
        
        state_ids = []
        for pw in result.windows:
            ns = NetworkState(
                id=uuid.uuid4(),
                job_id=uuid.UUID(job_id),
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
            state_ids.append(str(ns.id))
        
        tl = Timeline(
            id=uuid.uuid4(),
            job_id=uuid.UUID(job_id),
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
        
    except Exception as e:
        db.rollback()
        job = db.query(Job).filter(Job.id == uuid.UUID(job_id)).first()
        if job:
            job.status = "FAILED"
            job.error_message = str(e)[:1000]
            job.updated_at = datetime.utcnow()
            db.commit()
        raise
    finally:
        db.close()
        engine.dispose()
    
    return {"job_id": job_id, "states": len(result.windows), "packets": result.total_packets}
