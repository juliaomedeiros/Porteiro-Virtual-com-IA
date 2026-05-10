from typing import List, Dict, Any
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select, func
from ..core.database import get_session
from ..models.interacao import Interacao
from ..models.morador import Morador

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get("/stats")
def get_stats(condominio_id: UUID, session: Session = Depends(get_session)):
    # Total interactions
    total_query = select(func.count(Interacao.id)).join(Morador).where(Morador.condominio_id == condominio_id)
    total_count = session.exec(total_query).one()

    # Escalated interactions
    escalated_query = select(func.count(Interacao.id)).join(Morador).where(
        Morador.condominio_id == condominio_id,
        Interacao.is_escalated == True
    )
    escalated_count = session.exec(escalated_query).one()

    # Total tokens
    tokens_query = select(func.sum(Interacao.token_usage)).join(Morador).where(Morador.condominio_id == condominio_id)
    total_tokens = session.exec(tokens_query).one() or 0

    return {
        "total_interactions": total_count,
        "escalated_interactions": escalated_count,
        "total_tokens_used": total_tokens,
        "escalation_rate": (escalated_count / total_count * 100) if total_count > 0 else 0
    }

@router.get("/logs", response_model=List[Interacao])
def get_logs(
    condominio_id: UUID, 
    limit: int = 50, 
    only_escalated: bool = False,
    session: Session = Depends(get_session)
):
    statement = select(Interacao).join(Morador).where(Morador.condominio_id == condominio_id)
    
    if only_escalated:
        statement = statement.where(Interacao.is_escalated == True)
        
    statement = statement.order_by(Interacao.created_at.desc()).limit(limit)
    results = session.exec(statement).all()
    return results
