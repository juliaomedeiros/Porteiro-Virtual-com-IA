from typing import List, Dict, Any
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from sqlmodel import Session, select
from ..models.embedding import Embedding
from ..models.documento import Documento
from ..core.config import settings
from pgvector.sqlalchemy import Vector
import uuid

class RAGService:
    def __init__(self):
        self.embeddings = GoogleGenerativeAIEmbeddings(
            model="gemini-embedding-2",  
            google_api_key=settings.GOOGLE_API_KEY,
            output_dimensionality=768
        )

    async def add_chunks(self, session: Session, doc_id: uuid.UUID, chunks: List[str], metadatas: List[Dict[str, Any]] = None):
        """
        Generates embeddings for chunks and saves them to the database.
        """
        if not chunks:
            return
            
        if metadatas is None:
            metadatas = [{} for _ in chunks]
            
        # Generate embeddings
        vectors = await self.embeddings.aembed_documents(chunks)
        
        for chunk, vector, meta in zip(chunks, vectors, metadatas):
            embedding_obj = Embedding(
                content=chunk,
                embedding=vector,
                doc_metadata=meta,
                document_id=doc_id
            )
            session.add(embedding_obj)
            
        session.commit()

    async def search(self, session: Session, query_text: str, condominio_id: uuid.UUID, limit: int = 3) -> List[str]:
        """
        Searches for relevant chunks in the database using vector similarity.
        """
        # Generate embedding for the query
        query_vector = await self.embeddings.aembed_query(query_text)
        
        # Use pgvector cosine_distance for similarity search
        # Filter by both Documento relation and metadata strict filtering for tenant isolation
        statement = (
            select(Embedding)
            .join(Documento)
            .where(Documento.condominio_id == condominio_id)
            .where(Embedding.doc_metadata["condominio_id"].astext == str(condominio_id))
            .order_by(Embedding.embedding.cosine_distance(query_vector))
            .limit(limit)
        )
        
        results = session.exec(statement).all()
        return [r.content for r in results]

rag_service = RAGService()
