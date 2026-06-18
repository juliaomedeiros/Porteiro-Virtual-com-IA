from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlmodel import Session, select
from ..core.database import get_session
from ..models.encomenda import Encomenda, EncomendaCreate, EncomendaUpdate
from ..models.morador import Morador
from ..services.evolution_api import evolution_api_client

router = APIRouter(prefix="/encomendas", tags=["encomendas"])

async def send_encomenda_notification(morador_phone: str, destinatario: str, tamanho: str, descricao: str):
    message = f"📦 *Sua Encomenda Chegou!*\n\nOlá! Uma nova encomenda foi recebida na portaria.\n\n*Destinatário*: {destinatario}\n*Tamanho*: {tamanho}\n*Descrição*: {descricao or 'Não informada'}\n\nPor favor, venha retirar o mais breve possível."
    try:
        await evolution_api_client.send_text("default", morador_phone, message)
    except Exception as e:
        print(f"Failed to notify morador about encomenda: {e}")

@router.post("/", response_model=Encomenda, status_code=status.HTTP_201_CREATED)
def create_encomenda(encomenda: EncomendaCreate, background_tasks: BackgroundTasks, session: Session = Depends(get_session)):
    db_encomenda = Encomenda.model_validate(encomenda)
    session.add(db_encomenda)
    session.commit()
    session.refresh(db_encomenda)
    
    # Try to notify the resident of that unit
    statement = select(Morador).where(
        Morador.condominio_id == encomenda.condominio_id,
        Morador.unit == encomenda.unidade,
        Morador.is_active == True
    )
    moradores = session.exec(statement).all()
    
    # Send notification to all active residents of the unit
    for m in moradores:
        background_tasks.add_task(
            send_encomenda_notification,
            morador_phone=m.phone,
            destinatario=encomenda.destinatario,
            tamanho=encomenda.tamanho,
            descricao=encomenda.descricao
        )
        
    return db_encomenda

@router.get("/", response_model=List[Encomenda])
def read_encomendas(condominio_id: UUID, offset: int = 0, limit: int = 100, session: Session = Depends(get_session)):
    statement = select(Encomenda).where(Encomenda.condominio_id == condominio_id).order_by(Encomenda.created_at.desc()).offset(offset).limit(limit)
    encomendas = session.exec(statement).all()
    return encomendas

@router.patch("/{encomenda_id}", response_model=Encomenda)
def update_encomenda(encomenda_id: UUID, encomenda: EncomendaUpdate, session: Session = Depends(get_session)):
    db_encomenda = session.get(Encomenda, encomenda_id)
    if not db_encomenda:
        raise HTTPException(status_code=404, detail="Encomenda not found")
        
    encomenda_data = encomenda.model_dump(exclude_unset=True)
    for key, value in encomenda_data.items():
        setattr(db_encomenda, key, value)
        
    session.add(db_encomenda)
    session.commit()
    session.refresh(db_encomenda)
    return db_encomenda

@router.delete("/{encomenda_id}")
def delete_encomenda(encomenda_id: UUID, session: Session = Depends(get_session)):
    encomenda = session.get(Encomenda, encomenda_id)
    if not encomenda:
        raise HTTPException(status_code=404, detail="Encomenda not found")
    session.delete(encomenda)
    session.commit()
    return {"ok": True}
