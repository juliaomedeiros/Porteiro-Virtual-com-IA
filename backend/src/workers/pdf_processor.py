import fitz  # PyMuPDF
import pymupdf4llm
from typing import List, Dict, Any
import os
import easyocr

class PDFProcessor:
    def __init__(self, chunk_size: int = 1000, chunk_overlap: int = 200):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def extract_text(self, file_path: str) -> str:
        """
        Extracts text from a PDF file using PyMuPDF4LLM for better markdown formatting.
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")
            
        # pymupdf4llm converts PDF to Markdown which is great for LLMs
        md_text = pymupdf4llm.to_markdown(file_path)
        
        # If extraction result is too small, it might be a scanned image
        if len(md_text.strip()) < 50:
            return self._ocr_fallback(file_path)
            
        return md_text

    def _ocr_fallback(self, file_path: str) -> str:
        """
        Fallback to OCR if text extraction fails or returns too little text.
        Uses EasyOCR to extract text from images.
        """
        print(f"Extraindo texto (OCR) de: {file_path}...")
        # Inicializa lazily para não pesar a inicialização da API
        if not hasattr(self, 'reader'):
            self.reader = easyocr.Reader(['pt'])
            
        doc = fitz.open(file_path)
        textos = []
        
        for num_pagina, page in enumerate(doc):
            print(f"  Lendo página {num_pagina + 1}...")
            # Converte a página em imagem
            pix = page.get_pixmap()
            img_bytes = pix.tobytes("png")
            
            # O EasyOCR lê a imagem
            resultados = self.reader.readtext(img_bytes, detail=0)
            textos.append("\n".join(resultados))
            
        return "\n\n".join(textos)

    def create_chunks(self, text: str) -> List[str]:
        """
        Splits text into smaller chunks for embedding.
        Simple character-based chunking for now, can be improved.
        """
        chunks = []
        start = 0
        while start < len(text):
            end = start + self.chunk_size
            chunks.append(text[start:end])
            start += self.chunk_size - self.chunk_overlap
        return chunks

pdf_processor = PDFProcessor()
