from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from ..core.database import get_session
from ..models.area_comum import AreaComum, AreaComumBase, AreaComumUpdate

router = APIRouter(prefix="/areas-comuns", tags=["areas-comuns"])

@router.post("/", response_model=AreaComum, status_code=status.HTTP_201_CREATED)
def create_area_comum(area_comum: AreaComumBase, session: Session = Depends(get_session)):
    db_area_comum = AreaComum.model_validate(area_comum)
    session.add(db_area_comum)
    session.commit()
    session.refresh(db_area_comum)
    return db_area_comum

@router.get("/", response_model=List[AreaComum])
def read_areas_comuns(
    condominio_id: Optional[UUID] = None,
    offset: int = 0, 
    limit: int = 100, 
    session: Session = Depends(get_session)
):
    statement = select(AreaComum).offset(offset).limit(limit)
    if condominio_id:
        statement = statement.where(AreaComum.condominio_id == condominio_id)
    areas_comuns = session.exec(statement).all()
    return areas_comuns

@router.get("/{area_id}", response_model=AreaComum)
def read_area_comum(area_id: UUID, session: Session = Depends(get_session)):
    area_comum = session.get(AreaComum, area_id)
    if not area_comum:
        raise HTTPException(status_code=404, detail="Area Comum not found")
    return area_comum

@router.patch("/{area_id}", response_model=AreaComum)
def update_area_comum(area_id: UUID, area_comum: AreaComumUpdate, session: Session = Depends(get_session)):
    db_area_comum = session.get(AreaComum, area_id)
    if not db_area_comum:
        raise HTTPException(status_code=404, detail="Area Comum not found")
    area_comum_data = area_comum.model_dump(exclude_unset=True)
    for key, value in area_comum_data.items():
        setattr(db_area_comum, key, value)
    session.add(db_area_comum)
    session.commit()
    session.refresh(db_area_comum)
    return db_area_comum

@router.delete("/{area_id}")
def delete_area_comum(area_id: UUID, session: Session = Depends(get_session)):
    area_comum = session.get(AreaComum, area_id)
    if not area_comum:
        raise HTTPException(status_code=404, detail="Area Comum not found")
    session.delete(area_comum)
    session.commit()
    return {"ok": True}
