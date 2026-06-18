from datetime import datetime, timezone
from typing import Optional
from uuid import UUID, uuid4
from sqlmodel import SQLModel, Field, Relationship

class ConfiguracaoIABase(SQLModel):
    modelo_llm: str = Field(default="gemini/gemini-2.0-flash")
    prompt_sistema: Optional[str] = Field(default=None)
    api_key_criptografada: Optional[str] = Field(default=None)
    condominio_id: UUID = Field(foreign_key="condominio.id", unique=True) # One-to-one

class ConfiguracaoIA(ConfiguracaoIABase, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    condominio: "Condominio" = Relationship(back_populates="configuracao_ia")
