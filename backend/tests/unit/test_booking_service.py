import pytest
from datetime import date
from uuid import uuid4
from sqlmodel import Session, create_engine, SQLModel
from src.services.booking_service import booking_service
from src.models.reserva import Reserva, ReservaStatus
from src.models.condominio import Condominio
from src.models.morador import Morador
from src.models.area_comum import AreaComum
import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:pass@localhost:5433/porteiro_db")
engine = create_engine(DATABASE_URL)

@pytest.fixture(name="setup_data")
def setup_data_fixture():
    with Session(engine) as session:
        # Create Condo, Morador and Area
        condo = Condominio(name="Booking Condo", cnpj=f"123456789012{uuid4().hex[:2]}")
        session.add(condo)
        session.commit()
        session.refresh(condo)
        
        morador = Morador(name="Resident", phone=f"55119{uuid4().hex[:8]}", unit="101", condominio_id=condo.id)
        session.add(morador)
        
        area = AreaComum(name="Pool", condominio_id=condo.id)
        session.add(area)
        session.commit()
        session.refresh(morador)
        session.refresh(area)
        
        yield morador, area
        
        # Cleanup
        session.delete(morador)
        session.delete(area)
        session.delete(condo)
        session.commit()

@pytest.mark.asyncio
async def test_create_booking_success(setup_data):
    morador, area = setup_data
    booking_date = date(2026, 6, 1)
    
    reserva = await booking_service.create_booking(morador.id, area.id, booking_date)
    
    assert reserva.status == ReservaStatus.CONFIRMADA
    assert reserva.booking_date == booking_date
    
    # Cleanup reserva
    with Session(engine) as session:
        db_reserva = session.get(Reserva, reserva.id)
        session.delete(db_reserva)
        session.commit()

@pytest.mark.asyncio
async def test_create_booking_conflict(setup_data):
    morador, area = setup_data
    booking_date = date(2026, 6, 2)
    
    # First booking
    await booking_service.create_booking(morador.id, area.id, booking_date)
    
    # Second booking (same date, same area)
    with pytest.raises(ValueError, match="Area already booked"):
        await booking_service.create_booking(morador.id, area.id, booking_date)

    # Cleanup
    with Session(engine) as session:
        from sqlmodel import select
        statement = select(Reserva).where(Reserva.area_id == area.id)
        reservas = session.exec(statement).all()
        for r in reservas:
            session.delete(r)
        session.commit()
