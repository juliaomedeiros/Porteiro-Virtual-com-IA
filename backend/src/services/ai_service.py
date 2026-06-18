import os
import time
from typing import Annotated, TypedDict, List, Union
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage
from sqlmodel import Session, select
from ..core.config import settings
from ..core.guardrails import guardrails
from ..services.memory_service import memory_service
from ..services.rag_service import rag_service
from ..models.morador import Morador
from ..models.configuracao_ia import ConfiguracaoIA
from ..core.security import decrypt_key
import litellm

# Configure LangSmith if API key is provided
if settings.LANGSMITH_API_KEY:
    os.environ["LANGCHAIN_TRACING_V2"] = settings.LANGCHAIN_TRACING_V2
    os.environ["LANGCHAIN_ENDPOINT"] = settings.LANGCHAIN_ENDPOINT
    os.environ["LANGCHAIN_API_KEY"] = settings.LANGSMITH_API_KEY
    os.environ["LANGCHAIN_PROJECT"] = settings.LANGCHAIN_PROJECT

class AIService:
    def __init__(self):
        pass

    async def get_response(self, session: Session, resident: Morador, message: str) -> str:
        """
        Processes a user message using RAG, memory, and guardrails.
        """
        start_time = time.time()
        
        # 1. Guardrails check
        is_safe, reason = await guardrails.validate_input(message)
        if not is_safe:
            return "Sinto muito, mas não posso processar sua solicitação por questões de segurança. Por favor, reformule sua pergunta."

        # 2. Get ConfiguracaoIA
        config_ia = session.exec(select(ConfiguracaoIA).where(ConfiguracaoIA.condominio_id == resident.condominio_id)).first()
        
        model_name = "gemini/gemini-3.5-flash"
        api_key = settings.GOOGLE_API_KEY
        
        if config_ia:
            if config_ia.modelo_llm:
                model_name = config_ia.modelo_llm
            if config_ia.api_key_criptografada:
                decrypted = decrypt_key(config_ia.api_key_criptografada)
                if decrypted:
                    api_key = decrypted

        # 3. Retrieve history (returns Langchain BaseMessages)
        history = await memory_service.get_history(session, resident.id)

        # 4. Semantic Intent Router (Cheap filter)
        intent_prompt = f"O usuário enviou a seguinte mensagem: '{message}'. Essa mensagem é uma dúvida que exige consulta aos documentos ou regras do condomínio? Responda APENAS 'SIM' ou 'NAO'."
        try:
            router_response = await litellm.acompletion(
                model=model_name,
                messages=[{"role": "user", "content": intent_prompt}],
                api_key=api_key,
                temperature=0.2,
                max_tokens=5
            )
            intent = str(router_response.choices[0].message.content).strip().upper()
            needs_rag = "SIM" in intent
        except Exception:
            needs_rag = True
            
        if needs_rag:
            context_chunks = await rag_service.search(session, message, resident.condominio_id, limit=3)
            context = "\n---\n".join(context_chunks) if context_chunks else "Nenhuma informação específica encontrada nos documentos."
        else:
            context = "Consulta a documentos não é necessária para responder a esta mensagem."

        # 5. Construct Prompt
        default_prompt = f"""Você é o Porteiro Virtual do condomínio {resident.condominio.name}.
Sua tarefa é ajudar o morador {resident.name} (Unidade {resident.unit}) com dúvidas baseadas nos documentos oficiais.

REGRAS:
1. Responda APENAS com base no contexto fornecido.
2. Se a informação não estiver no contexto, diga que não sabe e peça para ele entrar em contato com o síndico.
3. Se o morador pedir para reservar algo ou solicitar boleto, informe que você pode ajudá-lo se os documentos permitirem ou se as ferramentas estiverem disponíveis.
4. Mantenha um tom profissional e cordial.
5. Sua resposta deve ter o limite ESTRITO de no máximo 2 parágrafos.

CONTEXTO:
{context}"""

        prompt_str = default_prompt
        if config_ia and config_ia.prompt_sistema:
            try:
                # We inject the dynamic data into the DB prompt
                prompt_str = config_ia.prompt_sistema.format(
                    condominio_name=resident.condominio.name,
                    resident_name=resident.name,
                    resident_unit=resident.unit,
                    context=context
                )
            except KeyError:
                # Fallback if DB prompt has invalid formatting keys
                prompt_str = config_ia.prompt_sistema + "\n\nCONTEXTO:\n" + context

        system_message = SystemMessage(content=prompt_str)

        # 6. Call LLM via LiteLLM
        messages = [system_message] + history + [HumanMessage(content=message)]
        
        litellm_messages = []
        for msg in messages:
            if isinstance(msg, SystemMessage):
                litellm_messages.append({"role": "system", "content": msg.content})
            elif isinstance(msg, HumanMessage):
                litellm_messages.append({"role": "user", "content": msg.content})
            elif isinstance(msg, AIMessage):
                litellm_messages.append({"role": "assistant", "content": msg.content})

        try:
            response = await litellm.acompletion(
                model=model_name,
                messages=litellm_messages,
                api_key=api_key,
                temperature=0
            )
            ai_text = str(response.choices[0].message.content)
            
            # 7. Record interaction and calculate metrics
            latency = int((time.time() - start_time) * 1000)
            tokens = response.usage.total_tokens if response.usage else 0
            
            await memory_service.add_interaction(
                session, 
                resident.id, 
                message, 
                ai_text, 
                token_usage=tokens, 
                latency_ms=latency
            )
            
            return ai_text
            
        except Exception as e:
            print(f"Error calling LLM via litellm: {e}")
            return "Desculpe, tive um problema técnico ao processar sua resposta. Por favor, tente novamente em alguns instantes ou procure a zeladoria."

ai_service = AIService()
