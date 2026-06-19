from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from uuid import UUID

from ..core.database import get_session
from datetime import date as date_type
from sqlalchemy import extract
from ..models.reserva import Reserva, ReservaStatus, PagamentoStatus, ReservaCreate
from ..models.area_comum import AreaComum
from ..models.usuario import Usuario
from ..api.deps import get_current_user
from ..services.evolution_api import evolution_api_client
from ..services.booking_service import booking_service

router = APIRouter()

@router.get("/disponibilidade")
async def check_availability(
    area_id: UUID,
    data: date_type,
    session: Session = Depends(get_session),
    current_user: Usuario = Depends(get_current_user)
):
    blocks = booking_service.check_availability(area_id, data)
    return {"data": data, "available_blocks": blocks}

@router.post("/", response_model=Reserva)
async def create_reserva(
    reserva_in: ReservaCreate,
    session: Session = Depends(get_session),
    current_user: Usuario = Depends(get_current_user)
):
    try:
        reserva = await booking_service.create_booking(
            morador_id=reserva_in.morador_id,
            area_id=reserva_in.area_id,
            booking_date=reserva_in.booking_date,
            hora_inicio=reserva_in.hora_inicio,
            hora_fim=reserva_in.hora_fim
        )
        return reserva
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/", response_model=List[Reserva])
async def list_reservas(
    condominio_id: UUID,
    mes: Optional[int] = None,
    ano: Optional[int] = None,
    session: Session = Depends(get_session),
    current_user: Usuario = Depends(get_current_user)
):
    # Verify permission
    # For now simply list by condominio by joining with AreaComum
    statement = select(Reserva).join(AreaComum).where(AreaComum.condominio_id == condominio_id)
    if mes and ano:
        statement = statement.where(
            extract('month', Reserva.booking_date) == mes,
            extract('year', Reserva.booking_date) == ano
        )
    reservas = session.exec(statement).all()
    return reservas

@router.patch("/{reserva_id}/pagamento")
async def aprovar_pagamento(
    reserva_id: UUID,
    session: Session = Depends(get_session),
    current_user: Usuario = Depends(get_current_user)
):
    reserva = session.get(Reserva, reserva_id)
    if not reserva:
        raise HTTPException(status_code=404, detail="Reserva não encontrada")
    
    reserva.status_pagamento = PagamentoStatus.PAGO
    reserva.status = ReservaStatus.CONFIRMADA
    session.add(reserva)
    session.commit()
    session.refresh(reserva)

    # Disparar WhatsApp de confirmação
    try:
        mensagem = f"Olá {reserva.morador.name}! O pagamento da sua reserva para '{reserva.area_comum.name}' no dia {reserva.booking_date.strftime('%d/%m/%Y')} foi confirmado! Sua reserva está garantida."
        await evolution_api_client.send_text(
            instance=str(reserva.area_comum.condominio_id), # Assuming instance ID is mapped or available via auto-discovery
            number=reserva.morador.phone,
            text=mensagem
        )
    except Exception as e:
        print(f"Erro ao enviar WhatsApp de confirmação: {e}")
        
    return reserva

@router.patch("/{reserva_id}/cancelar")
async def cancelar_reserva(
    reserva_id: UUID,
    session: Session = Depends(get_session),
    current_user: Usuario = Depends(get_current_user)
):
    reserva = session.get(Reserva, reserva_id)
    if not reserva:
        raise HTTPException(status_code=404, detail="Reserva não encontrada")
    
    reserva.status = ReservaStatus.CANCELADA
    session.add(reserva)
    session.commit()
    session.refresh(reserva)
    
    # Disparar WhatsApp de cancelamento
    try:
        mensagem = f"Olá {reserva.morador.name}. Sua reserva para '{reserva.area_comum.name}' no dia {reserva.booking_date.strftime('%d/%m/%Y')} foi CANCELADA pelo síndico. Se tiver dúvidas, entre em contato."
        await evolution_api_client.send_text(
            instance=str(reserva.area_comum.condominio_id),
            number=reserva.morador.phone,
            text=mensagem
        )
    except Exception as e:
        print(f"Erro ao enviar WhatsApp de cancelamento: {e}")

    return reserva
