import pytest
from uuid import uuid4
from src.services.finance_service import finance_service

@pytest.mark.asyncio
async def test_get_latest_boleto():
    morador_id = uuid4()
    boleto = await finance_service.get_latest_boleto(morador_id)
    
    assert boleto is not None
    assert boleto.valor == 450.00
    assert "23793" in boleto.linha_digitavel
    assert boleto.pdf_url == "https://example.com/boleto_mock.pdf"
