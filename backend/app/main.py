from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.database import init_db
from app.routers import upload, jobs, timelines, states
import os
from app.config import settings

@asynccontextmanager
async def lifespan(app: FastAPI):
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    await init_db()
    yield

app = FastAPI(
    title="SIH NetFlow - Network Traffic Analyzer",
    description="Phase 1: Ingestion & Preprocessing Pipeline for AI-based Network Attack Forecasting",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware, 
    allow_origins=["*"], 
    allow_methods=["*"], 
    allow_headers=["*"]
)

app.include_router(upload.router, prefix="/api", tags=["upload"])
app.include_router(jobs.router, prefix="/api", tags=["jobs"])
app.include_router(timelines.router, prefix="/api", tags=["timelines"])
app.include_router(states.router, prefix="/api", tags=["states"])

@app.get("/health")
async def health():
    return {"status": "ok", "service": "sih-netflow-backend"}
