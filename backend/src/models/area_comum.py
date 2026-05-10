from typing import Optional, List, TYPE_CHECKING
from uuid import UUID, uuid4
from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from .condominio import Condominio
    from .reserva import Reserva

class AreaComumBase(SQLModel):
    name: str
    description: Optional[str] = None
    max_capacity: Optional[int] = None
    rules: Optional[str] = None
    condominio_id: UUID = Field(foreign_key="condominio.id")

class AreaComum(AreaComumBase, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)

    condominio: "Condominio" = Relationship(back_populates="areas_comuns")
    reservas: List["Reserva"] = Relationship(back_populates="area_comum")

class AreaComumUpdate(SQLModel):
    name: Optional[str] = None
    description: Optional[str] = None
    max_capacity: Optional[int] = None
    rules: Optional[str] = None
    condominio_id: Optional[UUID] = None
