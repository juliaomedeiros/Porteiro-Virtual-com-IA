from datetime import datetime, timezone
from typing import Optional, TYPE_CHECKING
from uuid import UUID, uuid4
from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from .condominio import Condominio

class EncomendaBase(SQLModel):
    destinatario: str
    unidade: str
    tamanho: str  # Pequeno, Médio, Grande
    descricao: Optional[str] = None
    foto_url: Optional[str] = None
    status: str = Field(default="PENDENTE") # PENDENTE, ENTREGUE
    condominio_id: UUID = Field(foreign_key="condominio.id")

class Encomenda(EncomendaBase, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    condominio: "Condominio" = Relationship(back_populates="encomendas")

class EncomendaCreate(EncomendaBase):
    pass

class EncomendaUpdate(SQLModel):
    status: Optional[str] = None
    descricao: Optional[str] = None
    foto_url: Optional[str] = None
