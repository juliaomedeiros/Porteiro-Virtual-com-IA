from datetime import date
from uuid import UUID
from typing import Optional, List
from sqlmodel import Session, select, and_
from ..models.reserva import Reserva, ReservaStatus, ReservaBase
from ..core.database import engine

class BookingService:
    async def create_booking(self, morador_id: UUID, area_id: UUID, booking_date: date) -> Reserva:
        """
        Creates a new booking for a common area.
        Handles concurrency by checking for existing confirmed bookings.
        """
        with Session(engine) as session:
            # Check for existing confirmed booking for the same area and date
            statement = select(Reserva).where(
                and_(
                    Reserva.area_id == area_id,
                    Reserva.booking_date == booking_date,
                    Reserva.status == ReservaStatus.CONFIRMADA
                )
            )
            existing = session.exec(statement).first()
            if existing:
                raise ValueError(f"Area already booked for {booking_date}")
            
            # Create new booking
            db_reserva = Reserva(
                morador_id=morador_id,
                area_id=area_id,
                booking_date=booking_date,
                status=ReservaStatus.CONFIRMADA # Auto-confirming for now
            )
            session.add(db_reserva)
            session.commit()
            session.refresh(db_reserva)
            return db_reserva

    async def list_bookings(self, morador_id: Optional[UUID] = None) -> List[Reserva]:
        with Session(engine) as session:
            statement = select(Reserva)
            if morador_id:
                statement = statement.where(Reserva.morador_id == morador_id)
            return session.exec(statement).all()

    async def cancel_booking(self, reserva_id: UUID) -> bool:
        with Session(engine) as session:
            db_reserva = session.get(Reserva, reserva_id)
            if not db_reserva:
                return False
            db_reserva.status = ReservaStatus.CANCELADA
            session.add(db_reserva)
            session.commit()
            return True

booking_service = BookingService()
