from typing import List, Optional
from sqlmodel import Session, select
from ..models.interacao import Interacao
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from ..core.config import settings
import uuid

class MemoryService:
    def __init__(self, max_messages: int = 10):
        self.max_messages = max_messages
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.0-flash",
            google_api_key=settings.GOOGLE_API_KEY,
            temperature=0
        )

    async def get_history(self, session: Session, morador_id: uuid.UUID) -> List[BaseMessage]:
        """
        Retrieves the last N interactions for a resident and converts them to LangChain messages.
        """
        statement = (
            select(Interacao)
            .where(Interacao.morador_id == morador_id)
            .order_by(Interacao.created_at.desc())
            .limit(self.max_messages)
        )
        
        results = session.exec(statement).all()
        
        # Convert to messages and reverse to get chronological order
        messages = []
        for inter in reversed(results):
            messages.append(HumanMessage(content=inter.user_message))
            messages.append(AIMessage(content=inter.ai_response))
            
        return messages

    async def add_interaction(
        self, 
        session: Session, 
        morador_id: uuid.UUID, 
        user_message: str, 
        ai_response: str,
        token_usage: Optional[int] = None,
        latency_ms: Optional[int] = None
    ):
        """
        Saves a new interaction to the database.
        """
        interaction = Interacao(
            morador_id=morador_id,
            user_message=user_message,
            ai_response=ai_response,
            token_usage=token_usage,
            latency_ms=latency_ms
        )
        session.add(interaction)
        session.commit()

    async def summarize_history(self, messages: List[BaseMessage]) -> str:
        """
        Summarizes a list of messages to save tokens.
        """
        if len(messages) < 4:
            return ""
            
        history_text = ""
        for m in messages:
            role = "User" if isinstance(m, HumanMessage) else "AI"
            history_text += f"{role}: {m.content}\n"
            
        prompt = f"Summarize the following conversation history briefly to be used as context for an AI assistant:\n\n{history_text}"
        
        try:
            response = await self.llm.ainvoke(prompt)
            return str(response.content)
        except Exception:
            return "Histórico de conversas anteriores disponível."

memory_service = MemoryService()
