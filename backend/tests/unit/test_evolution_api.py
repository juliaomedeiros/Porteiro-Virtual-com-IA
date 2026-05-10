import pytest
import respx
from httpx import Response
from src.services.evolution_api import evolution_api_client
from src.core.config import settings
from unittest.mock import patch

@pytest.mark.asyncio
@respx.mock
async def test_send_text_success():
    instance = "test-instance"
    number = "5511999999999"
    text = "Hello world"
    
    with patch.object(settings, "EVOLUTION_API_URL", "http://evolution-api.com"), \
         patch.object(settings, "EVOLUTION_API_KEY", "test-key"):
        
        # Re-initialize client headers if needed or just use the patched settings
        evolution_api_client.url = settings.EVOLUTION_API_URL
        evolution_api_client.headers["apikey"] = settings.EVOLUTION_API_KEY
        
        route = respx.post(f"{settings.EVOLUTION_API_URL}/message/sendText/{instance}").mock(
            return_value=Response(200, json={"status": "success"})
        )
        
        response = await evolution_api_client.send_text(instance, number, text)
        
        assert response == {"status": "success"}
        assert route.called
        # Check payload
        request = route.calls.last.request
        import json
        payload = json.loads(request.content)
        assert payload["number"] == number
        assert payload["textMessage"]["text"] == text

@pytest.mark.asyncio
@respx.mock
async def test_send_media_success():
    instance = "test-instance"
    number = "5511999999999"
    media_url = "http://example.com/file.pdf"
    
    with patch.object(settings, "EVOLUTION_API_URL", "http://evolution-api.com"), \
         patch.object(settings, "EVOLUTION_API_KEY", "test-key"):
        
        evolution_api_client.url = settings.EVOLUTION_API_URL
        evolution_api_client.headers["apikey"] = settings.EVOLUTION_API_KEY
        
        route = respx.post(f"{settings.EVOLUTION_API_URL}/message/sendMedia/{instance}").mock(
            return_value=Response(200, json={"status": "success"})
        )
        
        response = await evolution_api_client.send_media(instance, number, media_url)
        
        assert response == {"status": "success"}
        assert route.called
        # Check payload
        request = route.calls.last.request
        import json
        payload = json.loads(request.content)
        assert payload["number"] == number
        assert payload["mediaMessage"]["media"] == media_url
