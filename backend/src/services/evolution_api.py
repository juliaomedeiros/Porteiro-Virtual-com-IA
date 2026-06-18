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

    async def send_text(self, instance: str, number: str, text: str, instance_token: Optional[str] = None) -> Dict[str, Any]:
        """
        Sends a text message via Evolution API or Evolution-Go.
        """
        payload_node = {
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
        
        payload_go = {
            "number": number,
            "text": text
        }
        
        headers = self.headers.copy()
        headers["instance"] = instance
        if instance_token:
            headers["apikey"] = instance_token
        
        async with httpx.AsyncClient() as client:
            # Tenta Evolution-Go primeiro
            endpoint_go = f"{self.url}/send/text"
            response = await client.post(endpoint_go, json=payload_go, headers=headers)
            
            if response.status_code == 404:
                # Fallback para Evolution API oficial
                endpoint_node = f"{self.url}/message/sendText/{instance}"
                response = await client.post(endpoint_node, json=payload_node, headers=headers)
                
            if response.status_code != 200:
                print(f"Error sending message: {response.text}")
            response.raise_for_status()
            return response.json()

    async def send_media(self, instance: str, number: str, media_url: str, caption: str = "", media_type: str = "document", instance_token: Optional[str] = None) -> Dict[str, Any]:
        """
        Sends a media message (document, image, etc.) via Evolution API or Evolution-Go.
        """
        payload = {
            "number": number,
            "mediaMessage": {
                "mediatype": media_type,
                "caption": caption,
                "media": media_url
            }
        }
        
        headers = self.headers.copy()
        headers["instance"] = instance
        if instance_token:
            headers["apikey"] = instance_token
        
        async with httpx.AsyncClient() as client:
            endpoint_go = f"{self.url}/send/media"
            response = await client.post(endpoint_go, json=payload, headers=headers)
            
            if response.status_code == 404:
                endpoint_node = f"{self.url}/message/sendMedia/{instance}"
                response = await client.post(endpoint_node, json=payload, headers=headers)
                
            response.raise_for_status()
            return response.json()

evolution_api_client = EvolutionAPIClient()
