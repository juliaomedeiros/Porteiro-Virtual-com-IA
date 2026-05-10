import pytest
import uuid
from fastapi.testclient import TestClient
from sqlmodel import Session, create_engine, select
from src.main import app
from src.core.database import get_session
from src.models.condominio import Condominio
from src.models.morador import Morador
from src.models.area_comum import AreaComum
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

def test_crud_condominio(client: TestClient, session: Session):
    unique_id = uuid.uuid4().hex[:8]
    cnpj = f"123456780001{unique_id}"[:14]
    
    # Create
    response = client.post("/condominios/", json={"name": f"Condo {unique_id}", "cnpj": cnpj, "address": "Rua A, 123"})
    assert response.status_code == 201
    condo_id = response.json()["id"]
    
    # Read one
    response = client.get(f"/condominios/{condo_id}")
    assert response.status_code == 200
    assert response.json()["name"] == f"Condo {unique_id}"

    # Update
    response = client.patch(f"/condominios/{condo_id}", json={"name": f"Updated {unique_id}"})
    assert response.status_code == 200
    assert response.json()["name"] == f"Updated {unique_id}"

    # Delete
    response = client.delete(f"/condominios/{condo_id}")
    assert response.status_code == 200
    
    # Verify deleted
    response = client.get(f"/condominios/{condo_id}")
    assert response.status_code == 404

def test_crud_morador(client: TestClient, session: Session):
    unique_id = uuid.uuid4().hex[:8]
    cnpj = f"987654320001{unique_id}"[:14]
    phone = f"55119{unique_id}"[:13]
    
    # Setup Condo
    condo = Condominio(name="Condo for Morador", cnpj=cnpj)
    session.add(condo)
    session.commit()
    session.refresh(condo)

    # Create Morador
    payload = {
        "name": "Jane Doe",
        "phone": phone,
        "unit": "Apt 202",
        "condominio_id": str(condo.id)
    }
    response = client.post("/moradores/", json=payload)
    assert response.status_code == 201
    morador_id = response.json()["id"]

    # Read with filter
    response = client.get(f"/moradores/?condominio_id={condo.id}")
    assert response.status_code == 200
    assert len(response.json()) == 1
    
    # Update Morador
    response = client.patch(f"/moradores/{morador_id}", json={"name": "Jane Updated"})
    assert response.status_code == 200
    assert response.json()["name"] == "Jane Updated"

    # Delete
    client.delete(f"/moradores/{morador_id}")
    session.delete(condo)
    session.commit()

def test_crud_area_comum(client: TestClient, session: Session):
    unique_id = uuid.uuid4().hex[:8]
    cnpj = f"112233440001{unique_id}"[:14]

    # Setup Condo
    condo = Condominio(name="Condo for Area", cnpj=cnpj)
    session.add(condo)
    session.commit()
    session.refresh(condo)

    # Create Area
    payload = {
        "name": "Churrasqueira",
        "description": "Area de lazer",
        "max_capacity": 20,
        "condominio_id": str(condo.id)
    }
    response = client.post("/areas-comuns/", json=payload)
    assert response.status_code == 201
    area_id = response.json()["id"]

    # Read
    response = client.get(f"/areas-comuns/{area_id}")
    assert response.status_code == 200
    
    # Update
    response = client.patch(f"/areas-comuns/{area_id}", json={"max_capacity": 30})
    assert response.status_code == 200
    assert response.json()["max_capacity"] == 30

    # Delete
    client.delete(f"/areas-comuns/{area_id}")
    session.delete(condo)
    session.commit()
