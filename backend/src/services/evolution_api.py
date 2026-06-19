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
        self.instance_tokens = {}

    async def get_instance_token(self, instance_name: str) -> str:
        if instance_name in self.instance_tokens:
            return self.instance_tokens[instance_name]
            
        async with httpx.AsyncClient() as client:
            endpoint = f"{self.url}/instance/all"
            response = await client.get(endpoint, headers=self.headers)
            if response.status_code == 200:
                data = response.json()
                for inst in data.get("data", []):
                    self.instance_tokens[inst["name"]] = inst["token"]
                    
        return self.instance_tokens.get(instance_name, self.api_key)

    async def send_text(self, instance: str, number: str, text: str, instance_token: str = None) -> dict:
        """
        Sends a text message via Evolution API or Evolution-Go.
        """
        payload_go = {
            "instance": instance,
            "number": number,
            "text": text
        }

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
        
        token_to_use = instance_token or await self.get_instance_token(instance)
        
        headers = self.headers.copy()
        headers["apikey"] = token_to_use
        
        async with httpx.AsyncClient() as client:
            # Tenta Evolution-Go primeiro
            endpoint_go = f"{self.url}/send/text"
            response = await client.post(endpoint_go, json=payload_go, headers=headers)
            
            if response.status_code in [404, 401]:
                # Fallback para Evolution API oficial (algumas versões do EvoGo usam a rota legada)
                endpoint_node = f"{self.url}/message/sendText/{instance}"
                response = await client.post(endpoint_node, json=payload_node, headers=headers)
                
            if response.status_code != 200:
                print(f"Error sending message: {response.text}")
            response.raise_for_status()
            return response.json()

    async def send_media(self, instance: str, number: str, media_url: str, media_type: str, caption: str = "", instance_token: str = None) -> dict:
        """
        Sends a media message (document, image, etc.) via Evolution API or Evolution-Go.
        """
        payload = {
            "instance": instance,
            "number": number,
            "mediaMessage": {
                "mediatype": media_type,
                "caption": caption,
                "media": media_url
            }
        }
        
        token_to_use = instance_token or await self.get_instance_token(instance)
        
        headers = self.headers.copy()
        headers["apikey"] = token_to_use
        
        async with httpx.AsyncClient() as client:
            endpoint_go = f"{self.url}/send/media"
            response = await client.post(endpoint_go, json=payload, headers=headers)
            
            if response.status_code == 404:
                endpoint_node = f"{self.url}/message/sendMedia/{instance}"
                response = await client.post(endpoint_node, json=payload, headers=headers)
                
            response.raise_for_status()
            return response.json()

evolution_api_client = EvolutionAPIClient()
