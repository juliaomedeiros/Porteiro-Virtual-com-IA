from datetime import datetime
from enum import Enum
from typing import Optional, List, TYPE_CHECKING
from uuid import UUID, uuid4
from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from .condominio import Condominio
    from .embedding import Embedding

class DocumentoStatus(str, Enum):
    PROCESSANDO = "PROCESSANDO"
    INDEXADO = "INDEXADO"
    ERRO = "ERRO"

class DocumentoBase(SQLModel):
    name: str
    file_url: Optional[str] = None
    content_hash: Optional[str] = None
    status: DocumentoStatus = Field(default=DocumentoStatus.PROCESSANDO)
    condominio_id: UUID = Field(foreign_key="condominio.id")

class Documento(DocumentoBase, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    condominio: "Condominio" = Relationship(back_populates="documentos")
    embeddings: List["Embedding"] = Relationship(back_populates="documento")
