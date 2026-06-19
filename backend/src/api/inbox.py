from uuid import UUID
from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select
from ..core.database import get_session
from ..models.morador import Morador
from ..models.interacao import Interacao
from ..services.evolution_api import evolution_api_client
from ..core.config import settings
from ..services.memory_service import memory_service

router = APIRouter(prefix="/inbox", tags=["inbox"])

class ReplyRequest(BaseModel):
    morador_id: UUID
    message: str

@router.get("/")
def get_inbox_items(condominio_id: UUID, session: Session = Depends(get_session)) -> Any:
    """
    Returns residents and their last 5 interactions, 
    prioritizing those with status_bot == 'PAUSADO' (transbordo).
    """
    # Custom sort: PAUSADO first
    statement = select(Morador).where(Morador.condominio_id == condominio_id)
    moradores = session.exec(statement).all()
    
    # Sort in python to ensure PAUSADO comes first, then by updated_at
    moradores.sort(key=lambda m: (m.status_bot != 'PAUSADO', m.updated_at.timestamp() * -1 if m.updated_at else 0))

    inbox = []
    for m in moradores:
        # Get 5 last interactions
        int_stmt = select(Interacao).where(Interacao.morador_id == m.id).order_by(Interacao.created_at.desc()).limit(5)
        interacoes = session.exec(int_stmt).all()
        
        # We want to return them chronologically oldest to newest for the chat UI
        interacoes.reverse()
        
        # Only add to inbox if there's any interaction or if status_bot is PAUSADO
        if interacoes or m.status_bot == 'PAUSADO':
            inbox.append({
                "morador": m,
                "interacoes": interacoes
            })
            
    return inbox

@router.post("/reply")
async def reply_to_resident(
    req: ReplyRequest,
    session: Session = Depends(get_session)
):
    resident = session.get(Morador, req.morador_id)
    if not resident:
        raise HTTPException(status_code=404, detail="Resident not found")

    # Save interaction so it stays in memory
    await memory_service.add_interaction(
        session,
        resident.id,
        "[INTERVENÇÃO HUMANA PELO PAINEL]", # Representing the trigger
        req.message, # The human reply
        token_usage=0,
        latency_ms=0
    )

    # Change status back to ATIVO
    resident.status_bot = "ATIVO"
    session.add(resident)
    session.commit()

    # Send to WhatsApp
    instance = settings.EVOLUTION_INSTANCE_NAME
    try:
        await evolution_api_client.send_text(instance, resident.phone, req.message)
    except Exception as e:
        print(f"Error sending manual reply to {resident.phone}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

    return {"ok": True, "status_bot": "ATIVO"}
