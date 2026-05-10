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
