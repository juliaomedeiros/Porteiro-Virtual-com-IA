from datetime import datetime, date
from enum import Enum
from typing import TYPE_CHECKING, Optional
from uuid import UUID, uuid4
from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from .morador import Morador
    from .area_comum import AreaComum

class ReservaStatus(str, Enum):
    PENDENTE = "PENDENTE"
    CONFIRMADA = "CONFIRMADA"
    CANCELADA = "CANCELADA"

class PagamentoStatus(str, Enum):
    ISENTO = "ISENTO"
    PENDENTE = "PENDENTE"
    PAGO = "PAGO"

class ReservaBase(SQLModel):
    booking_date: date
    hora_inicio: Optional[str] = None # e.g. "08:00"
    hora_fim: Optional[str] = None    # e.g. "11:00"
    status: ReservaStatus = Field(default=ReservaStatus.PENDENTE)
    status_pagamento: PagamentoStatus = Field(default=PagamentoStatus.ISENTO)
    morador_id: UUID = Field(foreign_key="morador.id")
    area_id: UUID = Field(foreign_key="areacomum.id")

class ReservaCreate(SQLModel):
    booking_date: date
    hora_inicio: Optional[str] = None
    hora_fim: Optional[str] = None
    morador_id: UUID
    area_id: UUID

class Reserva(ReservaBase, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    morador: "Morador" = Relationship(back_populates="reservas")
    area_comum: "AreaComum" = Relationship(back_populates="reservas")
