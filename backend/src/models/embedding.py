from typing import Optional, TYPE_CHECKING
from uuid import UUID, uuid4
from sqlmodel import SQLModel, Field, Relationship, Column, JSON
from pgvector.sqlalchemy import Vector

if TYPE_CHECKING:
    from .documento import Documento

class EmbeddingBase(SQLModel):
    model_config = {"arbitrary_types_allowed": True}
    
    content: str
    doc_metadata: dict = Field(default_factory=dict, sa_column=Column(JSON))
    document_id: UUID = Field(foreign_key="documento.id")

class Embedding(EmbeddingBase, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    # Embedding vector with 768 dimensions for Gemini Embeddings v1.5
    embedding: Optional[Vector] = Field(sa_column=Column(Vector(768)))

    documento: "Documento" = Relationship(back_populates="embeddings")
