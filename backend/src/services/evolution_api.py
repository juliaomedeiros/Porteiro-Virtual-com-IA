import httpx
from typing import Optional, Dict, Any
from ..core.config import settings

class EvolutionAPIClient:
    def __init__(self):
        self.url = settings.EVOLUTION_API_URL
        self.api_key = settings.EVOLUTION_API_KEY
        self.headers = {
            "apikey": self.api_key,
            "Content-Type": "application/json"
        }

    async def send_text(self, instance: str, number: str, text: str) -> Dict[str, Any]:
        """
        Sends a text message via Evolution API.
        """
        endpoint = f"{self.url}/message/sendText/{instance}"
        payload = {
            "number": number,
            "options": {
                "delay": 1200,
                "presence": "composing",
                "linkPreview": False
            },
            "textMessage": {
                "text": text
            }
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(endpoint, json=payload, headers=self.headers)
            response.raise_for_status()
            return response.json()

    async def send_media(self, instance: str, number: str, media_url: str, caption: str = "", media_type: str = "document") -> Dict[str, Any]:
        """
        Sends a media message (document, image, etc.) via Evolution API.
        """
        endpoint = f"{self.url}/message/sendMedia/{instance}"
        payload = {
            "number": number,
            "mediaMessage": {
                "mediatype": media_type,
                "caption": caption,
                "media": media_url
            }
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(endpoint, json=payload, headers=self.headers)
            response.raise_for_status()
            return response.json()

evolution_api_client = EvolutionAPIClient()
