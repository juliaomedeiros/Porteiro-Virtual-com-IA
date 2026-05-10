import pytest
import os
from unittest.mock import patch, MagicMock, AsyncMock
from langchain_core.messages import AIMessage

# Mock GOOGLE_API_KEY before importing AIService to avoid validation error during instantiation
with patch("src.core.config.settings.GOOGLE_API_KEY", "test-key"):
    from src.services.ai_service import AIService
    from src.core.config import settings

@pytest.mark.asyncio
async def test_ai_service_initialization():
    with patch("src.core.config.settings.GOOGLE_API_KEY", "test-key"):
        service = AIService()
        assert service.llm is not None
        assert service.graph is not None

@pytest.mark.asyncio
async def test_ai_service_get_response_mock():
    # Mock the class instead of the instance to avoid Pydantic setattr issues
    with patch("src.services.ai_service.ChatGoogleGenerativeAI") as MockLLM:
        mock_llm_instance = MockLLM.return_value
        # Use a real AIMessage for the mock response content
        mock_llm_instance.ainvoke = AsyncMock(return_value=AIMessage(content="Mocked AI response"))
        
        # Now instantiate service which will use the mock
        service = AIService()
        response = await service.get_response("user123", "Hello")
        assert response == "Mocked AI response"
        assert mock_llm_instance.ainvoke.called

def test_langsmith_configuration():
    # This test checks if the environment variables are correctly mapped from settings
    # We must ensure GOOGLE_API_KEY is present during reload to avoid validation error
    with patch.dict(os.environ, {"GOOGLE_API_KEY": "test-key"}, clear=True), \
         patch.object(settings, "LANGSMITH_API_KEY", "test-langsmith-key"), \
         patch.object(settings, "GOOGLE_API_KEY", "test-key"):
        
        # We need to re-import or trigger the configuration logic
        import importlib
        import src.services.ai_service
        importlib.reload(src.services.ai_service)
        
        assert os.environ.get("LANGCHAIN_TRACING_V2") == "false" # Default from settings
        assert os.environ.get("LANGCHAIN_API_KEY") == "test-langsmith-key"
        assert os.environ.get("LANGCHAIN_PROJECT") == "porteiro-virtual-ia"
