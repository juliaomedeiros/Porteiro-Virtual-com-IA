import pytest
import os
from unittest.mock import patch, AsyncMock

# Mock GOOGLE_API_KEY before importing RAGService to avoid validation error during instantiation
with patch("src.core.config.settings.GOOGLE_API_KEY", "test-key"):
    from src.services.rag_service import RAGService
    from src.models.condominio import Condominio
    from src.models.documento import Documento
    from src.models.embedding import Embedding

from sqlmodel import Session, create_engine, select
import uuid

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:pass@localhost:5433/porteiro_db")
engine = create_engine(DATABASE_URL)

@pytest.fixture(name="session")
def session_fixture():
    with Session(engine) as session:
        yield session

@pytest.mark.asyncio
async def test_rag_retrieval_accuracy(session: Session):
    # Mock GOOGLE_API_KEY for RAGService initialization
    with patch("src.core.config.settings.GOOGLE_API_KEY", "test-key"):
        # Setup test data
        condo = Condominio(name="RAG Condo", cnpj=str(uuid.uuid4())[:14])
        session.add(condo)
        session.commit()
        session.refresh(condo)
        
        doc = Documento(name="Rules", condominio_id=condo.id)
        session.add(doc)
        session.commit()
        session.refresh(doc)
        
        # Chunks to index
        chunks = ["The pool is open from 8am to 8pm", "Dogs are not allowed in the elevator"]
        
        # Mock embeddings to return distinct vectors
        # v1: pool related
        # v2: dog related
        v1 = [1.0] + [0.0] * 767
        v2 = [0.0, 1.0] + [0.0] * 766
        
        with patch("src.services.rag_service.GoogleGenerativeAIEmbeddings") as MockEmbed:
            mock_instance = MockEmbed.return_value
            mock_instance.aembed_documents = AsyncMock(return_value=[v1, v2])
            mock_instance.aembed_query = AsyncMock(side_effect=lambda q: v1 if "pool" in q else v2)
            
            service = RAGService()
            await service.add_chunks(session, doc.id, chunks)
            
            # Test search for "pool" - should return pool chunk first
            results = await service.search(session, "When is the pool open?", condo.id)
            assert len(results) > 0
            assert "pool" in results[0]
            
            # Test search for "dogs" - should return dog chunk first
            results = await service.search(session, "Can I bring my dog?", condo.id)
            assert len(results) > 0
            assert "Dogs" in results[0]

        # Cleanup
        # Find all embeddings for this document and delete them
        statement = select(Embedding).where(Embedding.document_id == doc.id)
        embeddings = session.exec(statement).all()
        for e in embeddings:
            session.delete(e)
        session.delete(doc)
        session.delete(condo)
        session.commit()
