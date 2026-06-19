from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from ..core.database import get_session
from ..models.condominio import Condominio, CondominioBase, CondominioUpdate

router = APIRouter(prefix="/condominios", tags=["condominios"])

@router.post("/", response_model=Condominio, status_code=status.HTTP_201_CREATED)
def create_condominio(condominio: CondominioBase, session: Session = Depends(get_session)):
    db_condominio = Condominio.model_validate(condominio)
    session.add(db_condominio)
    session.commit()
    session.refresh(db_condominio)
    return db_condominio

@router.get("/", response_model=List[Condominio])
def read_condominios(offset: int = 0, limit: int = 100, session: Session = Depends(get_session)):
    condominios = session.exec(select(Condominio).offset(offset).limit(limit)).all()
    return condominios

@router.get("/{condominio_id}", response_model=Condominio)
def read_condominio(condominio_id: UUID, session: Session = Depends(get_session)):
    condominio = session.get(Condominio, condominio_id)
    if not condominio:
        raise HTTPException(status_code=404, detail="Condominio not found")
    return condominio

@router.patch("/{condominio_id}", response_model=Condominio)
def update_condominio(condominio_id: UUID, condominio: CondominioUpdate, session: Session = Depends(get_session)):
    db_condominio = session.get(Condominio, condominio_id)
    if not db_condominio:
        raise HTTPException(status_code=404, detail="Condominio not found")
    condominio_data = condominio.model_dump(exclude_unset=True)
    for key, value in condominio_data.items():
        setattr(db_condominio, key, value)
    session.add(db_condominio)
    session.commit()
    session.refresh(db_condominio)
    return db_condominio

@router.delete("/{condominio_id}")
def delete_condominio(condominio_id: UUID, session: Session = Depends(get_session)):
    condominio = session.get(Condominio, condominio_id)
    if not condominio:
        raise HTTPException(status_code=404, detail="Condominio not found")
    session.delete(condominio)
    session.commit()
    return {"ok": True}

from fastapi import BackgroundTasks
from pydantic import BaseModel
from ..services.evolution_api import evolution_api_client
from ..models.morador import Morador
import asyncio

from typing import Optional
from ..core.config import settings

class BroadcastMessage(BaseModel):
    message: str
    instance_name: Optional[str] = None

from fastapi import BackgroundTasks

async def send_broadcast_task(condominio_id: UUID, message: str, instance_name: str):
    from ..core.database import engine
    from sqlmodel import Session
    
    with Session(engine) as session:
        statement = select(Morador).where(
            Morador.condominio_id == condominio_id,
            Morador.is_active == True
        )
        moradores = session.exec(statement).all()
        
        sindico_stmt = select(Morador).where(
            Morador.condominio_id == condominio_id,
            Morador.is_sindico == True,
            Morador.is_active == True
        )
        sindicos = session.exec(sindico_stmt).all()
        
    sucessos = 0
    erros = 0
    detalhes = []
    
    for m in moradores:
        try:
            await evolution_api_client.send_text(instance_name, m.phone, message)
            sucessos += 1
            await asyncio.sleep(1.5) # Anti-ban delay generoso
        except Exception as e:
            erros += 1
            detalhes.append(f"- {m.name} (Apto {m.unit})")
            print(f"Failed to send broadcast to {m.phone}: {e}")
            
    # Ao final, envia relatório para o Síndico
    if sindicos:
        report_msg = f"🤖 *Relatório de Comunicado*\nSeu comunicado terminou de ser processado!\n\n✅ Sucessos: {sucessos}\n❌ Falhas: {erros}\n"
        if erros > 0:
            report_msg += "\nDetalhes das falhas:\n" + "\n".join(detalhes)
            
        for s in sindicos:
            try:
                await evolution_api_client.send_text(instance_name, s.phone, report_msg)
            except Exception as e:
                print(f"Failed to send report to Sindico {s.phone}: {e}")

@router.post("/{condominio_id}/broadcast")
async def broadcast_message(
    condominio_id: UUID, 
    payload: BroadcastMessage, 
    background_tasks: BackgroundTasks,
    session: Session = Depends(get_session)
):
    condominio = session.get(Condominio, condominio_id)
    if not condominio:
        raise HTTPException(status_code=404, detail="Condominio not found")
        
    target_instance = payload.instance_name
    if not target_instance or target_instance == "default":
        target_instance = settings.EVOLUTION_INSTANCE_NAME
        
    background_tasks.add_task(send_broadcast_task, condominio_id, payload.message, target_instance)
    
    return {
        "status": "accepted", 
        "message": "✅ O Comunicado foi enfileirado e está sendo disparado com segurança. O síndico receberá um relatório no WhatsApp ao finalizar."
    }
