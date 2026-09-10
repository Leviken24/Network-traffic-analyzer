import pytest
from httpx import AsyncClient
from app.main import app
import uuid

@pytest.mark.asyncio
async def test_health():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

@pytest.mark.asyncio
async def test_upload_invalid_extension():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        files = {'file': ('test.txt', b"some content", 'text/plain')}
        response = await ac.post("/api/upload", files=files)
    assert response.status_code == 400
    assert "extension" in response.json()["detail"].lower()

@pytest.mark.asyncio
async def test_get_job_not_found():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        random_id = str(uuid.uuid4())
        response = await ac.get(f"/api/jobs/{random_id}")
    assert response.status_code == 404
