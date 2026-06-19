from datetime import datetime, timezone
from typing import Optional, List, TYPE_CHECKING
from uuid import UUID, uuid4
from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from .condominio import Condominio

class UsuarioCondominioLink(SQLModel, table=True):
    usuario_id: UUID = Field(foreign_key="usuario.id", primary_key=True)
    condominio_id: UUID = Field(foreign_key="condominio.id", primary_key=True)

class UsuarioBase(SQLModel):
    name: str
    email: str = Field(index=True, unique=True)
    hashed_password: str
    role: str = Field(default="SINDICO") # ADMIN, SINDICO, PORTEIRO
    phone: Optional[str] = None
    is_active: bool = Field(default=True)

class Usuario(UsuarioBase, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    condominios: List["Condominio"] = Relationship(back_populates="usuarios", link_model=UsuarioCondominioLink)

class UsuarioCreate(SQLModel):
    name: str
    email: str
    password: str
    role: str
    phone: Optional[str] = None

class UsuarioRead(SQLModel):
    id: UUID
    name: str
    email: str
    role: str
    phone: Optional[str] = None
    is_active: bool
    created_at: datetime
