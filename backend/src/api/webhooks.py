from fastapi import APIRouter, Depends, HTTPException, Header
from sqlmodel import Session, select
from ..core.database import get_session
from ..models.morador import Morador
from ..services.ai_service import ai_service
from ..services.evolution_api import evolution_api_client
from typing import Dict, Any, Optional

router = APIRouter(prefix="/webhooks", tags=["webhooks"])

@router.post("/whatsapp")
async def whatsapp_webhook(
    payload: Dict[str, Any],
    session: Session = Depends(get_session),
    apikey: Optional[str] = Header(None)
):
    """
    Receives WhatsApp messages from Evolution API.
    """
    if payload.get("event") != "messages.upsert":
        return {"status": "ignored", "reason": "event_not_supported"}

    data = payload.get("data", {})
    key = data.get("key", {})
    remote_jid = key.get("remoteJid", "")
    instance = payload.get("instance", "default")
    
    if not remote_jid or "@s.whatsapp.net" not in remote_jid:
        return {"status": "ignored", "reason": "invalid_remote_jid"}

    # Extract phone number (remove @s.whatsapp.net)
    phone = remote_jid.split("@")[0]
    
    # Validate resident
    statement = select(Morador).where(Morador.phone.contains(phone), Morador.is_active == True)
    resident = session.exec(statement).first()
    
    if not resident:
        return {"status": "ignored", "reason": "resident_not_found"}

    message_data = data.get("message", {})
    text = message_data.get("conversation") or message_data.get("extendedTextMessage", {}).get("text")
    
    if not text:
        return {"status": "ignored", "reason": "no_text_content"}

    # Process via LangChain (US1)
    ai_response = await ai_service.get_response(session, resident, text)
    
    # Send response back to WhatsApp
    try:
        await evolution_api_client.send_text(instance, phone, ai_response)
    except Exception as e:
        print(f"Error sending message back to WhatsApp: {e}")

    return {
        "status": "processed",
        "resident_name": resident.name,
        "ai_response": ai_response
    }
