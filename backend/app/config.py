"""
Configuration for SIH NetFlow — supports both local (SQLite) and Docker (PostgreSQL) modes.
Local mode is the default and requires no external services.
"""
import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Database: defaults to SQLite for zero-dependency local demo
    DATABASE_URL: str = "sqlite+aiosqlite:///./sih_netflow.db"
    SYNC_DATABASE_URL: str = "sqlite:///./sih_netflow.db"

    # Redis/Celery — only used in Docker mode; set to empty string to disable
    REDIS_URL: str = ""

    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_MB: int = 500
    DEFAULT_WINDOW_SECONDS: int = 60

    # World-model settings
    SEQUENCE_LENGTH: int = 8       # how many past states to feed into the LSTM
    FORECAST_STEPS: int = 5        # how many future windows to predict
    MODEL_HIDDEN_SIZE: int = 64
    MODEL_LAYERS: int = 2

    class Config:
        env_file = ".env"

settings = Settings()

# Ensure upload directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
