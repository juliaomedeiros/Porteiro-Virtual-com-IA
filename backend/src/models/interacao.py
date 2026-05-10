from datetime import datetime, timezone
from typing import Optional, TYPE_CHECKING
from uuid import UUID, uuid4
from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from .morador import Morador

class InteracaoBase(SQLModel):
    user_message: str
    ai_response: str
    token_usage: Optional[int] = None
    latency_ms: Optional[int] = None
    langsmith_run_id: Optional[str] = None
    feedback_score: Optional[int] = Field(default=None, ge=1, le=5)
    is_escalated: bool = Field(default=False)
    morador_id: UUID = Field(foreign_key="morador.id")

class Interacao(InteracaoBase, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    morador: "Morador" = Relationship(back_populates="interacoes")
