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
from ..models.area_comum import AreaComum
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
Sua tarefa é ajudar o morador {resident.name} (Unidade {resident.unit}) com dúvidas baseadas nos documentos oficiais, ou com reservas de áreas comuns.

REGRAS:
1. Responda APENAS com base no contexto fornecido.
2. Se a informação não estiver no contexto, diga que não sabe e peça para ele entrar em contato com o síndico.
3. Se o morador pedir para reservar algo, NUNCA liste os dias disponíveis do mês inteiro e NUNCA tente adivinhar a data ou área. 
4. SEMPRE pergunte primeiro qual a ÁREA e para qual DATA (e horário) ele gostaria de agendar.
5. Somente após ele informar a área e a data, use a ferramenta `check_availability` para ver os horários livres.
6. Após checar a disponibilidade e confirmar com o morador, use a ferramenta `make_reservation` para concluir o agendamento.
7. Mantenha um tom profissional e cordial.
8. Sua resposta deve ter o limite ESTRITO de no máximo 2 parágrafos.

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
                # Append reservation strict rules to user's DB prompt
                prompt_str += "\n\nREGRAS DE RESERVA: Se pedir para reservar, primeiro pergunte a área e a data. Em seguida use check_availability. Depois make_reservation."
            except KeyError:
                # Fallback if DB prompt has invalid formatting keys
                prompt_str = config_ia.prompt_sistema + "\n\nCONTEXTO:\n" + context

        # Add list of Common Areas only if user mentions reservations
        if "reserv" in message.lower() or "agend" in message.lower() or "marcar" in message.lower():
            areas_comuns = session.exec(select(AreaComum).where(AreaComum.condominio_id == resident.condominio_id)).all()
            if areas_comuns:
                areas_context = "\nÁREAS COMUNS DISPONÍVEIS:\n"
                for a in areas_comuns:
                    taxa_str = f"Taxa: R$ {a.taxa} | PIX: {a.chave_pix}" if a.taxa and a.taxa > 0 else "Isento de taxa"
                    tipo_str = "Diária completa" if a.tipo_reserva == "DIARIA" else f"Blocos de {a.duracao_bloco_horas}h"
                    areas_context += f"- {a.name}: {tipo_str}. {taxa_str}\n"
                prompt_str += areas_context

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

        tools = [
            {
                "type": "function",
                "function": {
                    "name": "check_availability",
                    "description": "Consulta os horários e blocos livres de uma área comum para um dia específico.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "area_name": {"type": "string", "description": "Nome da área comum"},
                            "date": {"type": "string", "description": "Data no formato YYYY-MM-DD"}
                        },
                        "required": ["area_name", "date"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "make_reservation",
                    "description": "Cria uma reserva para uma área comum em uma data e bloco de horário específicos.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "area_name": {"type": "string", "description": "Nome da área comum (ex: Churrasqueira, Salão de Festas)"},
                            "date": {"type": "string", "description": "Data no formato YYYY-MM-DD"},
                            "hora_inicio": {"type": "string", "description": "Hora de início no formato HH:MM (ex: 14:00). Opcional se for reserva DIARIA."},
                            "hora_fim": {"type": "string", "description": "Hora de fim no formato HH:MM (ex: 17:00). Opcional se for reserva DIARIA."}
                        },
                        "required": ["area_name", "date"]
                    }
                }
            }
        ]

        try:
            response = await litellm.acompletion(
                model=model_name,
                messages=litellm_messages,
                api_key=api_key,
                temperature=0,
                tools=tools,
                tool_choice="auto"
            )
            
            response_message = response.choices[0].message
            ai_text = str(response_message.content or "")
            
            # Handle Tool Calls
            if hasattr(response_message, "tool_calls") and response_message.tool_calls:
                from ..services.booking_service import booking_service
                from datetime import datetime
                import json
                
                tool_call = response_message.tool_calls[0]
                args = json.loads(tool_call.function.arguments)
                area_name = args.get("area_name")
                date_str = args.get("date")
                hora_inicio = args.get("hora_inicio")
                hora_fim = args.get("hora_fim")
                
                area = session.exec(select(AreaComum).where(
                    AreaComum.condominio_id == resident.condominio_id,
                    AreaComum.name.ilike(f"%{area_name}%")
                )).first()
                
                if not area:
                    ai_text = f"Desculpe, não encontrei a área comum '{area_name}'."
                else:
                    try:
                        booking_date = datetime.strptime(date_str, "%Y-%m-%d").date()
                        formatted_date = booking_date.strftime("%d/%m/%Y")
                        
                        if tool_call.function.name == "check_availability":
                            blocks = booking_service.check_availability(area.id, booking_date)
                            if not blocks:
                                ai_text = f"A área {area.name} está totalmente ocupada no dia {formatted_date}."
                            else:
                                if area.tipo_reserva == "DIARIA":
                                    b = blocks[0]
                                    ai_text = f"A área {area.name} está livre no dia {formatted_date} (Das {b['start']} às {b['end']}). Deseja confirmar a reserva?"
                                else:
                                    ai_text = f"Para o dia {formatted_date} na área {area.name}, temos os seguintes horários livres:\n"
                                    for b in blocks:
                                        ai_text += f"🔹 Das {b['start']} às {b['end']}\n"
                                    ai_text += "\nQual desses blocos você prefere?"
                                    
                        elif tool_call.function.name == "make_reservation":
                            reserva = await booking_service.create_booking(
                                resident.id, area.id, booking_date, hora_inicio, hora_fim
                            )
                            
                            tempo_str = f"das {hora_inicio} às {hora_fim}" if hora_inicio and hora_fim else "para o dia todo"
                            if reserva.status == "PENDENTE":
                                ai_text = f"Reserva para {area.name} no dia {formatted_date} ({tempo_str}) iniciada!\nComo a área possui uma taxa de R$ {area.taxa}, o status está PENDENTE.\n\nPara confirmar, realize o pagamento via PIX para a chave: {area.chave_pix} e envie o comprovante para o síndico."
                            else:
                                ai_text = f"Reserva para {area.name} no dia {formatted_date} ({tempo_str}) confirmada com sucesso!"
                    except Exception as e:
                        if "already booked" in str(e).lower() or "já está reservad" in str(e).lower():
                            ai_text = str(e) # Pass the explicit error message from service
                        else:
                            ai_text = f"Ocorreu um erro: {e}"
            
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
