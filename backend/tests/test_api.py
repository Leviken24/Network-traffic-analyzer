import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
import uuid

@pytest.mark.asyncio
async def test_health():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "features" in data
    assert "temporal-world-model" in data["features"]

@pytest.mark.asyncio
async def test_stages():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/stages")
    assert response.status_code == 200
    stages = response.json().get("stages", [])
    assert len(stages) == 5
    assert stages[0]["label"] == "Normal Traffic"

@pytest.mark.asyncio
async def test_upload_invalid_extension():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        files = {'file': ('test.txt', b"some content", 'text/plain')}
        response = await ac.post("/api/upload", files=files)
    assert response.status_code == 400
    assert "extension" in response.json()["detail"].lower()

@pytest.mark.asyncio
async def test_get_job_not_found():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        random_id = str(uuid.uuid4())
        response = await ac.get(f"/api/jobs/{random_id}")
    assert response.status_code == 404

@pytest.mark.asyncio
async def test_predict_job_not_found():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        random_id = str(uuid.uuid4())
        response = await ac.get(f"/api/predict/{random_id}")
    assert response.status_code == 404

@pytest.mark.asyncio
async def test_benchmark_job_not_found():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        random_id = str(uuid.uuid4())
        response = await ac.post(f"/api/benchmark/{random_id}")
    assert response.status_code == 404
