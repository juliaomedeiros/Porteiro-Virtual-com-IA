import pytest
from src.workers.pdf_processor import PDFProcessor
from unittest.mock import patch, MagicMock

def test_create_chunks():
    processor = PDFProcessor(chunk_size=10, chunk_overlap=2)
    text = "01234567890123456789"
    chunks = processor.create_chunks(text)
    
    # Text length: 20
    # Chunk 1: [0:10] -> "0123456789"
    # Next start: 10 - 2 = 8
    # Chunk 2: [8:18] -> "8901234567"
    # Next start: 18 - 2 = 16
    # Chunk 3: [16:20] -> "6789" (Wait, my logic was slightly off in thought, let's see implementation)
    
    assert len(chunks) == 3
    assert chunks[0] == "0123456789"
    assert chunks[1] == "8901234567"
    assert chunks[2] == "6789"

@patch("pymupdf4llm.to_markdown")
@patch("os.path.exists")
def test_extract_text_success(mock_exists, mock_to_markdown):
    mock_exists.return_value = True
    # Provide text longer than 50 characters to avoid OCR fallback
    long_text = "This is a long enough text extracted from a PDF document that should not trigger the OCR fallback logic."
    mock_to_markdown.return_value = long_text
    
    processor = PDFProcessor()
    text = processor.extract_text("dummy.pdf")
    assert text == long_text

@patch("pymupdf4llm.to_markdown")
@patch("os.path.exists")
def test_extract_text_ocr_fallback(mock_exists, mock_to_markdown):
    mock_exists.return_value = True
    mock_to_markdown.return_value = "   " # Too little text
    
    processor = PDFProcessor()
    text = processor.extract_text("scanned.pdf")
    assert "OCR Fallback" in text
