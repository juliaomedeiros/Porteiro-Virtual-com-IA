import os
import time
from typing import Annotated, TypedDict, List, Union
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage
from sqlmodel import Session
from ..core.config import settings
from ..core.guardrails import guardrails
from ..services.memory_service import memory_service
from ..services.rag_service import rag_service
from ..models.morador import Morador

# Configure LangSmith if API key is provided
if settings.LANGSMITH_API_KEY:
    os.environ["LANGCHAIN_TRACING_V2"] = settings.LANGCHAIN_TRACING_V2
    os.environ["LANGCHAIN_ENDPOINT"] = settings.LANGCHAIN_ENDPOINT
    os.environ["LANGCHAIN_API_KEY"] = settings.LANGSMITH_API_KEY
    os.environ["LANGCHAIN_PROJECT"] = settings.LANGCHAIN_PROJECT

class AIService:
    def __init__(self):
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.0-flash",
            google_api_key=settings.GOOGLE_API_KEY,
            temperature=0
        )

    async def get_response(self, session: Session, resident: Morador, message: str) -> str:
        """
        Processes a user message using RAG, memory, and guardrails.
        """
        start_time = time.time()
        
        # 1. Guardrails check
        is_safe, reason = await guardrails.validate_input(message)
        if not is_safe:
            return "Sinto muito, mas não posso processar sua solicitação por questões de segurança. Por favor, reformule sua pergunta."

        # 2. Retrieve history
        history = await memory_service.get_history(session, resident.id)

        # 3. RAG: Search for relevant chunks
        # Token Economy: Limit chunks to save costs
        context_chunks = await rag_service.search(session, message, resident.condominio_id, limit=3)
        context = "\n---\n".join(context_chunks) if context_chunks else "Nenhuma informação específica encontrada nos documentos."

        # 4. Construct Prompt
        # Token Economy: Concise system prompt
        system_prompt = SystemMessage(content=f"""Você é o Porteiro Virtual do condomínio {resident.condominio.name}.
Sua tarefa é ajudar o morador {resident.name} (Unidade {resident.unit}) com dúvidas baseadas nos documentos oficiais.

REGRAS:
1. Responda APENAS com base no contexto fornecido.
2. Se a informação não estiver no contexto, diga que não sabe e peça para ele entrar em contato com o síndico.
3. Se o morador pedir para reservar algo ou solicitar boleto, informe que você pode ajudá-lo se os documentos permitirem ou se as ferramentas estiverem disponíveis.
4. Mantenha um tom profissional e cordial.

CONTEXTO:
{context}""")

        # 5. Call LLM
        messages = [system_prompt] + history + [HumanMessage(content=message)]
        
        try:
            response = await self.llm.ainvoke(messages)
            ai_text = str(response.content)
            
            # 6. Record interaction and calculate metrics
            latency = int((time.time() - start_time) * 1000)
            # Token usage estimation (Gemini API provides this in response metadata usually)
            tokens = response.response_metadata.get("token_usage", {}).get("total_tokens", 0)
            
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
            print(f"Error calling LLM: {e}")
            return "Desculpe, tive um problema técnico ao processar sua resposta. Por favor, tente novamente em alguns instantes ou procure a zeladoria."

ai_service = AIService()
