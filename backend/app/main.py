"""
SIH NetFlow — AI-Based Network Attack Forecasting
Phase 1+2: Ingestion, Preprocessing, Temporal World Model, Forecasting

Local mode: SQLite (no Docker/Redis/PostgreSQL required)
Docker mode: PostgreSQL + Redis (see docker-compose.yml)
"""

import os
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.database import init_db
from app.routers import upload, jobs, timelines, states
from app.routers import predict, benchmark
from app.config import settings

logging.basicConfig(level=logging.INFO, format="%(levelname)s │ %(name)s │ %(message)s")
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    await init_db()
    logger.info(f"Database initialised: {settings.DATABASE_URL}")
    logger.info(f"Upload directory: {settings.UPLOAD_DIR}")
    yield


app = FastAPI(
    title="SIH NetFlow — AI Network Attack Forecasting",
    description=(
        "Network traffic ingestion → flow extraction → temporal world model → "
        "K-step attack forecasting → MITRE ATT&CK stage mapping → explainability."
    ),
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Core pipeline routes
app.include_router(upload.router,    prefix="/api", tags=["upload"])
app.include_router(jobs.router,      prefix="/api", tags=["jobs"])
app.include_router(timelines.router, prefix="/api", tags=["timelines"])
app.include_router(states.router,    prefix="/api", tags=["states"])

# World model routes
app.include_router(predict.router,   prefix="/api", tags=["prediction"])
app.include_router(benchmark.router, prefix="/api", tags=["benchmark"])


@app.get("/health", tags=["health"])
async def health():
    return {
        "status": "ok",
        "service": "sih-netflow-backend",
        "version": "2.0.0",
        "mode": "local-sqlite" if "sqlite" in settings.DATABASE_URL else "postgresql",
        "features": [
            "flow-extraction", "feature-generation", "time-windowing",
            "temporal-world-model", "k-step-forecasting",
            "mitre-stage-mapping", "explainability", "benchmark",
        ],
    }
