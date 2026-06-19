from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from ..core.database import get_session
from ..models.usuario import Usuario, UsuarioRead, UsuarioCreate, UsuarioCondominioLink
from ..models.condominio import Condominio
from ..core.security import get_password_hash
from ..api.deps import get_current_user

router = APIRouter(prefix="/usuarios", tags=["usuarios"])

@router.post("/", response_model=UsuarioRead, status_code=status.HTTP_201_CREATED)
def create_usuario(usuario_in: UsuarioCreate, session: Session = Depends(get_session), current_user: Usuario = Depends(get_current_user)):
    # Check permissions
    if current_user.role not in ["ADMIN", "SINDICO"]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
        
    if current_user.role == "SINDICO" and usuario_in.role not in ["PORTEIRO"]:
        raise HTTPException(status_code=403, detail="SINDICO can only create PORTEIRO")

    # Check if email exists
    existing = session.exec(select(Usuario).where(Usuario.email == usuario_in.email)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create user
    db_user = Usuario(
        name=usuario_in.name,
        email=usuario_in.email,
        hashed_password=get_password_hash(usuario_in.password),
        role=usuario_in.role,
        phone=usuario_in.phone
    )
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user

@router.get("/", response_model=List[UsuarioRead])
def read_usuarios(session: Session = Depends(get_session), current_user: Usuario = Depends(get_current_user)):
    if current_user.role == "ADMIN":
        return session.exec(select(Usuario)).all()
    else:
        # SINDICO only sees users of their condominios
        condominio_ids = [c.id for c in current_user.condominios]
        statement = select(Usuario).join(UsuarioCondominioLink).where(UsuarioCondominioLink.condominio_id.in_(condominio_ids))
        return session.exec(statement).all()

@router.post("/{usuario_id}/condominios/{condominio_id}")
def link_usuario_condominio(usuario_id: UUID, condominio_id: UUID, session: Session = Depends(get_session), current_user: Usuario = Depends(get_current_user)):
    if current_user.role not in ["ADMIN", "SINDICO"]:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    user = session.get(Usuario, usuario_id)
    condominio = session.get(Condominio, condominio_id)
    
    if not user or not condominio:
        raise HTTPException(status_code=404, detail="Usuario or Condominio not found")

    link = UsuarioCondominioLink(usuario_id=usuario_id, condominio_id=condominio_id)
    session.add(link)
    try:
        session.commit()
    except Exception:
        session.rollback()
        raise HTTPException(status_code=400, detail="Link already exists")
        
    return {"ok": True}
