from fastapi.testclient import TestClient
from src.main import app
from src.core.config import settings

client = TestClient(app)

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Porteiro Virtual IA API"}

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}

def test_settings():
    assert settings.PROJECT_NAME == "Porteiro Virtual IA"
