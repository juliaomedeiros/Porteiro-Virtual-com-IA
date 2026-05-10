from uuid import UUID
from typing import Optional
from sqlmodel import Session, select
from ..models.interacao import Interacao
from ..core.database import engine

class EscalationService:
    async def escalate_interaction(self, interacao_id: UUID, reason: str = "AI failed to resolve") -> bool:
        """
        Marks an interaction as escalated for human intervention.
        In a real scenario, this could also send a notification to a dashboard
        or an external system (e.g., WhatsApp message to the manager).
        """
        with Session(engine) as session:
            db_interacao = session.get(Interacao, interacao_id)
            if not db_interacao:
                return False
            
            db_interacao.is_escalated = True
            # We could also log the reason in a separate field or a dedicated 'Alert' model
            session.add(db_interacao)
            session.commit()
            
            # TODO: Send notification to Sindico/Porteiro (Evolution API, Email, etc.)
            print(f"ESCALATION: Interaction {interacao_id} escalated. Reason: {reason}")
            
            return True

    async def get_pending_escalations(self) -> list[Interacao]:
        with Session(engine) as session:
            statement = select(Interacao).where(Interacao.is_escalated == True)
            return session.exec(statement).all()

escalation_service = EscalationService()
