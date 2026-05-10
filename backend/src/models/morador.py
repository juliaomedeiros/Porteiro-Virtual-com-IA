from datetime import datetime, timezone
from typing import Optional, List, TYPE_CHECKING
from uuid import UUID, uuid4
from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from .condominio import Condominio
    from .reserva import Reserva
    from .interacao import Interacao

class MoradorBase(SQLModel):
    name: str
    cpf: Optional[str] = Field(default=None, index=True, unique=True) # Encrypted in rest (to be handled by service/logic)
    phone: str = Field(index=True, unique=True)
    unit: str
    is_active: bool = Field(default=True)
    condominio_id: UUID = Field(foreign_key="condominio.id")

class Morador(MoradorBase, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    condominio: "Condominio" = Relationship(back_populates="moradores")
    reservas: List["Reserva"] = Relationship(back_populates="morador")
    interacoes: List["Interacao"] = Relationship(back_populates="morador")

class MoradorUpdate(SQLModel):
    name: Optional[str] = None
    cpf: Optional[str] = None
    phone: Optional[str] = None
    unit: Optional[str] = None
    is_active: Optional[bool] = None
    condominio_id: Optional[UUID] = None
