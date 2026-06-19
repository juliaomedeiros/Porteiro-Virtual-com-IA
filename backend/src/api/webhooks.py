from fastapi import APIRouter, Depends, HTTPException, Header
from sqlmodel import Session, select, or_
from ..core.database import get_session
from ..models.morador import Morador
from ..services.ai_service import ai_service
from ..services.evolution_api import evolution_api_client
from typing import Dict, Any, Optional

router = APIRouter(prefix="/webhooks", tags=["webhooks"])

@router.post("/evolution-go")
async def whatsapp_webhook(
    payload: Dict[str, Any],
    session: Session = Depends(get_session),
    apikey: Optional[str] = Header(None)
):
    """
    Receives WhatsApp messages from Evolution API.
    """
    event = str(payload.get("event", ""))
    if event.upper() not in ["MESSAGES.UPSERT", "MESSAGES_UPSERT", "MESSAGES-UPSERT", "MESSAGE"]:
        return {"status": "ignored", "reason": "event_not_supported"}

    data = payload.get("data", {})
    
    # Evolution-Go format vs Evolution-API format
    if "Info" in data:
        # Evolution-Go
        info = data.get("Info", {})
        if info.get("IsFromMe", False):
            return {"status": "ignored", "reason": "from_me"}
        remote_jid = info.get("Sender", "") or info.get("Chat", "")
        instance = payload.get("instanceName", "default")
        instance_token = payload.get("instanceToken")
        message_data = data.get("Message", {})
    else:
        # Evolution-API
        key = data.get("key", {})
        if key.get("fromMe", False):
            return {"status": "ignored", "reason": "from_me"}
        remote_jid = key.get("remoteJid", "")
        instance = payload.get("instance", "default")
        instance_token = None
        message_data = data.get("message", {})
    
    if not remote_jid or "@s.whatsapp.net" not in remote_jid:
        return {"status": "ignored", "reason": "invalid_remote_jid"}

    # Extract phone number (remove @s.whatsapp.net)
    phone = remote_jid.split("@")[0]
    
    # Normalização do 9º dígito (Fantasma do Nono Dígito no Brasil)
    phone_com_9 = phone
    phone_sem_9 = phone
    
    if phone.startswith("55") and len(phone) == 12:
        # Faltando o 9 (Ex: 55 83 8147 3750) -> Insere o 9
        phone_com_9 = f"{phone[:4]}9{phone[4:]}"
    elif phone.startswith("55") and len(phone) == 13:
        # Com o 9 (Ex: 55 83 9 8147 3750) -> Remove o 9
        phone_sem_9 = f"{phone[:4]}{phone[5:]}"
    
    # Validate resident
    statement = select(Morador).where(
        or_(
            Morador.phone.contains(phone_com_9),
            Morador.phone.contains(phone_sem_9)
        ),
        Morador.is_active == True
    )
    resident = session.exec(statement).first()
    
    if not resident:
        try:
            unauthorized_msg = "Não há cadastro desse número de telefone nos dados do condomínio. Entre em contato com a administração do seu condomínio para regularizar a situação e poder utilizar o atendimento via WhatsApp."
            await evolution_api_client.send_text(instance, phone, unauthorized_msg, instance_token)
        except Exception as e:
            print(f"Error sending unauthorized message to {phone}: {e}")
        return {"status": "ignored", "reason": "resident_not_found"}

    text = message_data.get("conversation") or message_data.get("extendedTextMessage", {}).get("text")
    
    if not text:
        return {"status": "ignored", "reason": "no_text_content"}

    from datetime import datetime, timezone, timedelta
    
    # Check bot status and 30 min timeout
    if resident.status_bot == "PAUSADO":
        # Ensure updated_at is timezone-aware
        updated_at = resident.updated_at if resident.updated_at.tzinfo else resident.updated_at.replace(tzinfo=timezone.utc)
        if datetime.now(timezone.utc) - updated_at > timedelta(minutes=30):
            resident.status_bot = "ATIVO"
        else:
            resident.updated_at = datetime.now(timezone.utc)
            session.add(resident)
            session.commit()
            return {"status": "ignored", "reason": "bot_paused_waiting_human"}

    escalation_keywords = ["falar com humano", "sindico", "síndico", "atendente", "reclamar"]
    is_escalation = any(kw in text.lower() for kw in escalation_keywords)
    
    if is_escalation:
        resident.status_bot = "PAUSADO"
        resident.updated_at = datetime.now(timezone.utc)
        session.add(resident)
        session.commit()
        
        # Notify user
        try:
            await evolution_api_client.send_text(instance, phone, "Vou transferir você para o síndico. Por favor, aguarde o atendimento humano.", instance_token)
        except Exception as e:
            print(f"Error sending escalation msg: {e}")
        
        # Notify syndics
        from ..models.usuario import Usuario, UsuarioCondominioLink
        sindicos = session.exec(
            select(Usuario)
            .join(UsuarioCondominioLink)
            .where(UsuarioCondominioLink.condominio_id == resident.condominio_id)
            .where(Usuario.role == "SINDICO")
        ).all()
        
        for s in sindicos:
            if s.phone:
                try:
                    await evolution_api_client.send_text(instance, s.phone, f"⚠️ *Transbordo Solicitado*\nMorador: {resident.name} (Unidade {resident.unit})\nMensagem: {text}\nPara responder, fale diretamente com ele pelo seu WhatsApp ou acesse o painel.", instance_token)
                except Exception as e:
                    print(f"Error notifying syndic {s.phone}: {e}")
        
        return {"status": "processed", "reason": "escalated_to_human"}

    # Process via LangChain (US1)
    ai_response = await ai_service.get_response(session, resident, text)
    
    # Send response back to WhatsApp
    try:
        await evolution_api_client.send_text(instance, phone, ai_response, instance_token)
    except Exception as e:
        print(f"Error sending message back to WhatsApp: {e}")

    return {
        "status": "processed",
        "resident_name": resident.name,
        "ai_response": ai_response
    }
