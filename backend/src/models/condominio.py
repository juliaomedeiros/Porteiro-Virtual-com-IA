from datetime import datetime, timezone
from typing import Optional, List, TYPE_CHECKING
from uuid import UUID, uuid4
from sqlmodel import SQLModel, Field, Relationship

from .usuario import UsuarioCondominioLink

if TYPE_CHECKING:
    from .morador import Morador
    from .area_comum import AreaComum
    from .documento import Documento
    from .configuracao_ia import ConfiguracaoIA
    from .encomenda import Encomenda
    from .usuario import Usuario

class CondominioBase(SQLModel):
    name: str = Field(index=True)
    cnpj: str = Field(index=True, unique=True)
    address: Optional[str] = None

class Condominio(CondominioBase, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    moradores: List["Morador"] = Relationship(back_populates="condominio")
    areas_comuns: List["AreaComum"] = Relationship(back_populates="condominio")
    documentos: List["Documento"] = Relationship(back_populates="condominio")
    configuracao_ia: Optional["ConfiguracaoIA"] = Relationship(back_populates="condominio")
    encomendas: List["Encomenda"] = Relationship(back_populates="condominio")
    usuarios: List["Usuario"] = Relationship(back_populates="condominios", link_model=UsuarioCondominioLink)

class CondominioUpdate(SQLModel):
    name: Optional[str] = None
    cnpj: Optional[str] = None
    address: Optional[str] = None
