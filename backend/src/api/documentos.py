from typing import List
from uuid import UUID
import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, BackgroundTasks
from sqlmodel import Session, select
from ..core.database import get_session
from ..models.documento import Documento, DocumentoStatus
from ..workers.pdf_processor import pdf_processor
from ..services.rag_service import rag_service

router = APIRouter(prefix="/documents", tags=["documents"])

# Ensure uploads directory exists
UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

async def process_document(doc_id: UUID, file_path: str):
    """
    Background task to process PDF, extract text, create chunks and store embeddings.
    """
    with next(get_session()) as session:
        db_doc = session.get(Documento, doc_id)
        if not db_doc:
            return

        try:
            # 1. Extract text
            text = pdf_processor.extract_text(file_path)
            
            # 2. Create chunks
            chunks = pdf_processor.create_chunks(text)
            
            # 3. Add to RAG service (embeddings)
            await rag_service.add_chunks(session, doc_id, chunks)
            
            # 4. Update status
            db_doc.status = DocumentoStatus.INDEXADO
            session.add(db_doc)
            session.commit()
            
        except Exception as e:
            print(f"Error processing document {doc_id}: {e}")
            db_doc.status = DocumentoStatus.ERRO
            session.add(db_doc)
            session.commit()
        finally:
            # Optionally remove the file after processing
            if os.path.exists(file_path):
                os.remove(file_path)

@router.post("/upload", response_model=Documento, status_code=status.HTTP_201_CREATED)
async def upload_document(
    background_tasks: BackgroundTasks,
    condominio_id: UUID,
    file: UploadFile = File(...),
    session: Session = Depends(get_session)
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    # 1. Create Documento record
    db_doc = Documento(
        name=file.filename,
        condominio_id=condominio_id,
        status=DocumentoStatus.PROCESSANDO
    )
    session.add(db_doc)
    session.commit()
    session.refresh(db_doc)

    # 2. Save file temporarily
    file_path = os.path.join(UPLOAD_DIR, f"{db_doc.id}_{file.filename}")
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # 3. Start background processing
    background_tasks.add_task(process_document, db_doc.id, file_path)

    return db_doc

@router.get("/", response_model=List[Documento])
def read_documents(condominio_id: UUID, session: Session = Depends(get_session)):
    statement = select(Documento).where(Documento.condominio_id == condominio_id)
    documents = session.exec(statement).all()
    return documents

@router.delete("/{document_id}")
def delete_document(document_id: UUID, session: Session = Depends(get_session)):
    document = session.get(Documento, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Cascade delete is handled by database if configured, 
    # but here we might need to manually delete embeddings if not.
    # SQLModel Relationship with cascade="all, delete" should handle it.
    
    session.delete(document)
    session.commit()
    return {"ok": True}
