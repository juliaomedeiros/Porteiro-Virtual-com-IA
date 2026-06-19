import datetime
from datetime import date
from uuid import UUID
from typing import Optional, List, Dict, Any
from sqlmodel import Session, select, and_, or_
from ..models.reserva import Reserva, ReservaStatus, ReservaBase
from ..core.database import engine

def generate_blocks(hora_inicio: str, hora_fim: str, duracao: int) -> List[Dict[str, str]]:
    if not hora_inicio or not hora_fim or not duracao:
        return []
    
    try:
        t_start = datetime.datetime.strptime(hora_inicio, "%H:%M")
        t_end = datetime.datetime.strptime(hora_fim, "%H:%M")
        
        blocks = []
        current = t_start
        while current < t_end:
            next_time = current + datetime.timedelta(hours=duracao)
            if next_time > t_end:
                break # Or we could truncate it to t_end. Let's just drop incomplete blocks.
            blocks.append({
                "start": current.strftime("%H:%M"),
                "end": next_time.strftime("%H:%M")
            })
            current = next_time
        return blocks
    except Exception:
        return []

class BookingService:
    def check_availability(self, area_id: UUID, booking_date: date) -> List[Dict[str, str]]:
        """
        Returns a list of available time blocks for a given area and date.
        If the area is DIARIA, returns a single block for the whole day if free.
        """
        import datetime
        # Force timezone -3 (Brasília) for safety
        now = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=-3)))
        current_date = now.date()
        current_time = now.strftime("%H:%M")

        if booking_date < current_date:
            return []

        from ..models.area_comum import AreaComum
        
        with Session(engine) as session:
            area = session.get(AreaComum, area_id)
            if not area:
                return []
                
            # Get existing non-canceled reservations for this date
            statement = select(Reserva).where(
                and_(
                    Reserva.area_id == area_id,
                    Reserva.booking_date == booking_date,
                    Reserva.status != ReservaStatus.CANCELADA
                )
            )
            existing_reservas = session.exec(statement).all()
            
            if area.tipo_reserva == "DIARIA":
                if len(existing_reservas) > 0:
                    return []
                
                start_time = area.hora_inicio_funcionamento or "00:00"
                if booking_date == current_date and start_time < current_time:
                    return []
                    
                return [{
                    "start": start_time,
                    "end": area.hora_fim_funcionamento or "23:59"
                }]
            else: # POR_BLOCO
                all_blocks = generate_blocks(
                    area.hora_inicio_funcionamento, 
                    area.hora_fim_funcionamento, 
                    area.duracao_bloco_horas
                )
                
                available_blocks = []
                for block in all_blocks:
                    is_free = True
                    
                    # Filter out past blocks if booking is today
                    if booking_date == current_date and block["start"] < current_time:
                        continue
                        
                    for r in existing_reservas:
                        if r.hora_inicio == block["start"] and r.hora_fim == block["end"]:
                            is_free = False
                            break
                    if is_free:
                        available_blocks.append(block)
                return available_blocks

    async def create_booking(self, morador_id: UUID, area_id: UUID, booking_date: date, hora_inicio: Optional[str] = None, hora_fim: Optional[str] = None) -> Reserva:
        """
        Creates a new booking for a common area.
        Handles concurrency by checking for existing active bookings.
        """
        import datetime
        now = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=-3)))
        current_date = now.date()
        current_time = now.strftime("%H:%M")

        if booking_date < current_date:
            raise ValueError("Não é possível reservar datas no passado.")

        from ..models.area_comum import AreaComum
        from ..models.reserva import PagamentoStatus

        with Session(engine) as session:
            area = session.get(AreaComum, area_id)
            if not area:
                raise ValueError("Area comum não encontrada")
                
            # Check availability first
            statement = select(Reserva).where(
                and_(
                    Reserva.area_id == area_id,
                    Reserva.booking_date == booking_date,
                    Reserva.status != ReservaStatus.CANCELADA
                )
            )
            
            if area.tipo_reserva == "DIARIA":
                if booking_date == current_date:
                    start_time = area.hora_inicio_funcionamento or "00:00"
                    if start_time < current_time:
                        raise ValueError("O horário de início desta área já passou no dia de hoje.")
                        
                existing = session.exec(statement).first()
                if existing:
                    raise ValueError(f"A área já está reservada no dia {booking_date}")
                h_inicio = area.hora_inicio_funcionamento
                h_fim = area.hora_fim_funcionamento
            else:
                if not hora_inicio or not hora_fim:
                    raise ValueError("Hora de início e fim são obrigatórias para reserva em blocos.")
                
                if booking_date == current_date and hora_inicio < current_time:
                    raise ValueError("Este horário já passou no dia de hoje.")
                    
                # Check specific block overlap
                statement = statement.where(
                    and_(
                        Reserva.hora_inicio == hora_inicio,
                        Reserva.hora_fim == hora_fim
                    )
                )
                existing = session.exec(statement).first()
                if existing:
                    raise ValueError(f"O bloco das {hora_inicio} às {hora_fim} já está reservado no dia {booking_date}")
                h_inicio = hora_inicio
                h_fim = hora_fim
            
            has_taxa = area.taxa and area.taxa > 0
            
            # Create new booking
            db_reserva = Reserva(
                morador_id=morador_id,
                area_id=area_id,
                booking_date=booking_date,
                hora_inicio=h_inicio,
                hora_fim=h_fim,
                status=ReservaStatus.PENDENTE if has_taxa else ReservaStatus.CONFIRMADA,
                status_pagamento=PagamentoStatus.PENDENTE if has_taxa else PagamentoStatus.ISENTO
            )
            session.add(db_reserva)
            session.commit()
            session.refresh(db_reserva)
            
            # --- START NOTIFICATIONS ---
            try:
                from ..services.evolution_api import evolution_api_client
                from ..models.usuario import Usuario, UsuarioCondominioLink
                
                morador = db_reserva.morador
                condominio = area.condominio
                data_str = booking_date.strftime('%d/%m/%Y')
                
                if db_reserva.status == ReservaStatus.PENDENTE:
                    # Mensagem Morador
                    pix_text = f"\nO PIX do condomínio é: {area.chave_pix}." if area.chave_pix else ""
                    msg_morador = (
                        f"Olá {morador.name}. Sua reserva para {area.name} no *{condominio.name}* para o dia {data_str} foi agendada e está PENDENTE.\n"
                        f"Para confirmar, é necessário realizar o pagamento da taxa de R$ {area.taxa:.2f}.{pix_text}\n"
                        f"Por favor, realize o pagamento e envie o comprovante para o síndico."
                    )
                    
                    import asyncio
                    asyncio.create_task(
                        evolution_api_client.send_text(
                            instance=str(condominio.id), 
                            number=morador.phone, 
                            text=msg_morador
                        )
                    )
                    
                    # Mensagem Síndico
                    statement = select(Usuario).join(UsuarioCondominioLink).where(
                        UsuarioCondominioLink.condominio_id == condominio.id,
                        Usuario.role == "SINDICO"
                    )
                    sindicos = session.exec(statement).all()
                    
                    apto = f"{morador.unit}" if morador.unit else "Não informado"
                    msg_sindico = (
                        f"Nova reserva pendente no *{condominio.name}*!\n"
                        f"O morador {morador.name} (Apto: *{apto}*) agendou {area.name} para o dia {data_str}. A taxa é de R$ {area.taxa:.2f}.\n"
                        f"Quando o morador te enviar o comprovante, por favor, acesse o Painel Web e clique em 'Confirmar Pagamento' para liberar a reserva."
                    )
                    
                    for sindico in sindicos:
                        if sindico.phone:
                            asyncio.create_task(
                                evolution_api_client.send_text(
                                    instance=str(condominio.id), 
                                    number=sindico.phone, 
                                    text=msg_sindico
                                )
                            )
            except Exception as e:
                print(f"Erro ao disparar notificações de reserva: {e}")
            # --- END NOTIFICATIONS ---

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
