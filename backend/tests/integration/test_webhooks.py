import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from src.main import app
from src.core.database import get_session
from src.models.condominio import Condominio
from src.models.morador import Morador
import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:pass@localhost:5433/porteiro_db")
engine = create_engine(DATABASE_URL)

@pytest.fixture(name="session")
def session_fixture():
    with Session(engine) as session:
        yield session

@pytest.fixture(name="client")
def client_fixture(session: Session):
    def get_session_override():
        return session
    
    app.dependency_overrides[get_session] = get_session_override
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()

def test_whatsapp_webhook_resident_found(client: TestClient, session: Session):
    # Setup: Create condominio and resident
    condo = Condominio(name="Test Condo", cnpj="12345678000199")
    session.add(condo)
    session.commit()
    session.refresh(condo)
    
    resident = Morador(
        name="John Doe", 
        phone="5511999999999", 
        unit="Apt 101", 
        condominio_id=condo.id
    )
    session.add(resident)
    session.commit()
    
    payload = {
        "event": "messages.upsert",
        "instance": "porteiro-virtual",
        "data": {
            "key": {
                "remoteJid": "5511999999999@s.whatsapp.net",
                "fromMe": False,
                "id": "ABC123XYZ"
            },
            "message": {
                "conversation": "Hello AI"
            },
            "messageType": "conversation"
        }
    }
    
    response = client.post("/webhooks/whatsapp", json=payload)
    
    assert response.status_code == 200
    assert response.json()["status"] == "received"
    assert response.json()["resident_name"] == "John Doe"
    
    # Cleanup
    session.delete(resident)
    session.delete(condo)
    session.commit()

def test_whatsapp_webhook_resident_not_found(client: TestClient):
    payload = {
        "event": "messages.upsert",
        "instance": "porteiro-virtual",
        "data": {
            "key": {
                "remoteJid": "5511888888888@s.whatsapp.net",
                "fromMe": False,
                "id": "ABC123XYZ"
            },
            "message": {
                "conversation": "Hello AI"
            }
        }
    }
    
    response = client.post("/webhooks/whatsapp", json=payload)
    
    assert response.status_code == 200
    assert response.json()["status"] == "ignored"
    assert response.json()["reason"] == "resident_not_found"
