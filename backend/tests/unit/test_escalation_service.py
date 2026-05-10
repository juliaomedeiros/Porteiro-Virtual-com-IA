import pytest
from uuid import uuid4
from sqlmodel import Session, create_engine
from src.services.escalation_service import escalation_service
from src.models.interacao import Interacao
from src.models.condominio import Condominio
from src.models.morador import Morador
import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:pass@localhost:5433/porteiro_db")
engine = create_engine(DATABASE_URL)

@pytest.fixture(name="setup_data")
def setup_data_fixture():
    with Session(engine) as session:
        condo = Condominio(name="Escalation Condo", cnpj=f"123456789012{uuid4().hex[:2]}")
        session.add(condo)
        session.commit()
        session.refresh(condo)
        
        morador = Morador(name="Resident", phone=f"55119{uuid4().hex[:8]}", unit="101", condominio_id=condo.id)
        session.add(morador)
        session.commit()
        session.refresh(morador)
        
        interacao = Interacao(
            user_message="Help me",
            ai_response="I cannot",
            morador_id=morador.id
        )
        session.add(interacao)
        session.commit()
        session.refresh(interacao)
        
        yield interacao
        
        # Cleanup
        session.delete(interacao)
        session.delete(morador)
        session.delete(condo)
        session.commit()

@pytest.mark.asyncio
async def test_escalate_interaction(setup_data):
    interacao = setup_data
    
    success = await escalation_service.escalate_interaction(interacao.id, reason="Test reason")
    
    assert success is True
    
    with Session(engine) as session:
        db_interacao = session.get(Interacao, interacao.id)
        assert db_interacao.is_escalated is True

@pytest.mark.asyncio
async def test_get_pending_escalations(setup_data):
    interacao = setup_data
    await escalation_service.escalate_interaction(interacao.id)
    
    escalations = await escalation_service.get_pending_escalations()
    assert any(e.id == interacao.id for e in escalations)
