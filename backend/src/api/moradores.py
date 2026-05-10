from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from ..core.database import get_session
from ..models.morador import Morador, MoradorBase, MoradorUpdate

router = APIRouter(prefix="/moradores", tags=["moradores"])

@router.post("/", response_model=Morador, status_code=status.HTTP_201_CREATED)
def create_morador(morador: MoradorBase, session: Session = Depends(get_session)):
    db_morador = Morador.model_validate(morador)
    session.add(db_morador)
    session.commit()
    session.refresh(db_morador)
    return db_morador

@router.get("/", response_model=List[Morador])
def read_moradores(
    condominio_id: Optional[UUID] = None,
    offset: int = 0, 
    limit: int = 100, 
    session: Session = Depends(get_session)
):
    statement = select(Morador).offset(offset).limit(limit)
    if condominio_id:
        statement = statement.where(Morador.condominio_id == condominio_id)
    moradores = session.exec(statement).all()
    return moradores

@router.get("/{morador_id}", response_model=Morador)
def read_morador(morador_id: UUID, session: Session = Depends(get_session)):
    morador = session.get(Morador, morador_id)
    if not morador:
        raise HTTPException(status_code=404, detail="Morador not found")
    return morador

@router.patch("/{morador_id}", response_model=Morador)
def update_morador(morador_id: UUID, morador: MoradorUpdate, session: Session = Depends(get_session)):
    db_morador = session.get(Morador, morador_id)
    if not db_morador:
        raise HTTPException(status_code=404, detail="Morador not found")
    morador_data = morador.model_dump(exclude_unset=True)
    for key, value in morador_data.items():
        setattr(db_morador, key, value)
    session.add(db_morador)
    session.commit()
    session.refresh(db_morador)
    return db_morador

@router.delete("/{morador_id}")
def delete_morador(morador_id: UUID, session: Session = Depends(get_session)):
    morador = session.get(Morador, morador_id)
    if not morador:
        raise HTTPException(status_code=404, detail="Morador not found")
    session.delete(morador)
    session.commit()
    return {"ok": True}
