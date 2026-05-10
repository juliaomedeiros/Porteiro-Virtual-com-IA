from datetime import datetime, date
from enum import Enum
from typing import TYPE_CHECKING
from uuid import UUID, uuid4
from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from .morador import Morador
    from .area_comum import AreaComum

class ReservaStatus(str, Enum):
    PENDENTE = "PENDENTE"
    CONFIRMADA = "CONFIRMADA"
    CANCELADA = "CANCELADA"

class ReservaBase(SQLModel):
    booking_date: date
    status: ReservaStatus = Field(default=ReservaStatus.PENDENTE)
    morador_id: UUID = Field(foreign_key="morador.id")
    area_id: UUID = Field(foreign_key="areacomum.id")

class Reserva(ReservaBase, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    morador: "Morador" = Relationship(back_populates="reservas")
    area_comum: "AreaComum" = Relationship(back_populates="reservas")
