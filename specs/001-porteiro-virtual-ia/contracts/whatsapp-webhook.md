# Contract: WhatsApp Webhook (Evolution API)

## Overview
Este contrato define o formato das mensagens recebidas pelo Backend (FastAPI) provenientes da Evolution API (WhatsApp).

## Endpoint: `POST /webhooks/whatsapp`

### Payload (Message Received)
```json
{
  "event": "messages.upsert",
  "instance": "porteiro-virtual",
  "data": {
    "key": {
      "remoteJid": "5511999999999@s.whatsapp.net",
      "fromMe": false,
      "id": "ABC123XYZ"
    },
    "message": {
      "conversation": "Pode cachorro no elevador?"
    },
    "messageType": "conversation",
    "pushName": "João Silva",
    "messageTimestamp": 1714250000
  }
}
```

### Response Codes
- `200 OK`: Webhook processado ou enfileirado com sucesso.
- `400 Bad Request`: Formato de mensagem inválido.
- `401 Unauthorized`: Token de API inválido.

## Logic Flow
1. Receber webhook.
2. Validar se `data.key.remoteJid` pertence a um morador cadastrado.
3. Extrair o texto de `data.message.conversation`.
4. Processar via LangChain (RAG + Guardrails).
5. Responder via Evolution API `POST /message/sendText`.
