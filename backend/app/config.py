from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://sih:sih@db:5432/sih_netflow"
    SYNC_DATABASE_URL: str = "postgresql+psycopg2://sih:sih@db:5432/sih_netflow" 
    REDIS_URL: str = "redis://redis:6379/0"
    UPLOAD_DIR: str = "/tmp/uploads"
    MAX_UPLOAD_MB: int = 500
    DEFAULT_WINDOW_SECONDS: int = 60

    class Config:
        env_file = ".env"

settings = Settings()
