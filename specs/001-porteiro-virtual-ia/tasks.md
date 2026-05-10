# Tarefas: Porteiro Virtual com IA

**Input**: Documentos de design em `/specs/001-porteiro-virtual-ia/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

## Formato: `[ID] [P?] [Story] Descrição`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependências)
- **[Story]**: A qual história de usuário esta tarefa pertence (ex: US1, US2, US3)
- **Test Requirement**: Cada tarefa inclui a criação de testes unitários e/ou de integração.
- **Token Economy**: Tarefas de IA devem incluir estratégias para otimizar custos (**precise RAG**, prompts curtos e descarte de contexto inútil).
- **Progress Update**: Cada tarefa termina com: "Atualizar o arquivo progresso.md com o status desta tarefa, marcando-a como concluída e registrando o que foi feito."

---

## Fase 1: Infraestrutura e Base de Dados

**Purpose**: Inicialização do projeto, configuração do ambiente e esquema do banco de dados.

- [X] T001 Criar estrutura de monorepo (backend/, frontend/, infra/) e inicializar `specs/001-porteiro-virtual-ia/progresso.md`. Incluir testes de sanidade para a estrutura. Atualizar o arquivo progresso.md com o status desta tarefa, marcando-a como concluída e registrando o que foi feito.
- [X] T002 [P] Configurar `infra/docker-compose.yml` with PostgreSQL (pgvector), backend e imagens base do frontend. Incluir testes de **healthcheck**. Atualizar o arquivo progresso.md com o status desta tarefa, marcando-a como concluída e registrando o que foi feito.
- [X] T003 [P] Configurar framework de migrações de banco de dados (Alembic) em `backend/` e criar tabelas para Condominio, Morador, Documento e AreaComum conforme `data-model.md`. Incluir testes de validação de migração. Atualizar o arquivo progresso.md com o status desta tarefa, marcando-a como concluída e registrando o que foi feito.

---

## Fase 2: Backend e Integração Base

**Purpose**: Configuração central da API e ponte de comunicação externa.

- [X] T004 Configurar projeto backend FastAPI with schemas Pydantic e gerenciamento de sessão de banco de dados em `backend/src/core/`. Incluir testes unitários para conexão com DB. Atualizar o arquivo progresso.md com o status desta tarefa, marcando-a como concluída e registrando o que foi feito.
- [X] T005 [P] Implementar cliente da Evolution API em `backend/src/services/evolution_api.py` para envio de mensagens de texto e arquivos. Incluir testes de integração baseados em **mock**. Atualizar o arquivo progresso.md com o status desta tarefa, marcando-a como concluída e registrando o que foi feito.
- [X] T006 Implementar endpoint de **webhook** do WhatsApp em `backend/src/api/webhooks.py` e lógica de validação de morador (busca por telefone). Incluir testes de integração para o fluxo de **webhook**. Atualizar o arquivo progresso.md com o status desta tarefa, marcando-a como concluída e registrando o que foi feito.

---

## Fase 3: História de Usuário 1 - Resolução de Dúvidas (IA e RAG) (Prioridade: P1) 🎯 MVP

**Goal**: O morador pode tirar dúvidas sobre as regras do condomínio via WhatsApp e receber respostas da IA baseadas em documentos.

**Independent Test**: Enviar uma pergunta sobre uma regra específica no "Regimento Interno" e receber a resposta citada correta.

- [X] T007 [US1] Configurar orquestração LangChain/LangGraph com monitoramento LangSmith em `backend/src/services/ai_service.py`. Incluir testes de conectividade para Gemini e LangSmith. Atualizar o arquivo progresso.md com o status desta tarefa, marcando-a como concluída e registrando o que foi feito.
- [X] T008 [US1] Implementar pipeline de processamento de PDF em `backend/src/workers/pdf_processor.py` usando PyMuPDF e **OCR fallback**. **Token Economy**: Implementar **chunking** eficiente para evitar dados redundantes. Incluir testes unitários para extração de PDF. Atualizar o arquivo progresso.md com o status desta tarefa, marcando-a como concluída e registrando o que foi feito.
- [X] T009 [US1] Criar fluxo de RAG with pgvector em `backend/src/services/rag_service.py`. **Token Economy**: Retornar apenas o contexto estritamente necessário para a LLM. Incluir testes de **retrieval accuracy**. Atualizar o arquivo progresso.md com o status desta tarefa, marcando-a como concluída e registrando o que foi feito.
- [X] T010 [US1] Implementar gerenciamento de memória de conversação em `backend/src/services/memory_service.py`. **Token Economy**: Usar sumarização de histórico para interações longas visando economizar tokens. Incluir testes unitários para o estado da memória. Atualizar o arquivo progresso.md com o status desta tarefa, marcando-a como concluída e registrando o que foi feito.
- [X] T011 [US1] Implementar **security guardrails** e **anti-prompt injection** em `backend/src/core/guardrails.py`. **Token Economy**: Usar prompts concisos para validação. Incluir testes de integração focados em segurança. Atualizar o arquivo progresso.md com o status desta tarefa, marcando-a como concluída e registrando o que foi feito.

---

## Fase 4: História de Usuário 3 - Gestão de Moradores (Prioridade: P1)

**Goal**: O síndico/gestor pode cadastrar moradores e condomínios via API/Painel.

- [X] T012 [P] [US3] Implementar endpoints de API para CRUD de Morador e Condomínio e areas comuns vinvulada ao condominio em `backend/src/api/`. Incluir testes unitários e de **contract**. Atualizar o arquivo progresso.md com o status desta tarefa, marcando-a como concluída e registrando o que foi feito.

---

## Fase 5: História de Usuário 2 - Segunda Via de Boleto (Prioridade: P1)

**Goal**: O morador pode solicitar a segunda via do boleto via WhatsApp.

- [X] T013 [US2] Implementar serviço de integração financeira(via MCP ou API) em `backend/src/services/finance_service.py` para recuperar PDF/linha digitável do boleto. **Token Economy**: Usar prompts precisos de **tool-calling**. Incluir testes de integração com sistema financeiro **mock**. Atualizar o arquivo progresso.md com o status desta tarefa, marcando-a como concluída e registrando o que foi feito.

---

## Fase 6: História de Usuário 4 - Reserva de Áreas Comuns (Prioridade: P2)

**Goal**: O morador pode reservar áreas comuns via WhatsApp.

- [X] T014 [US4] Implementar lógica de reserva com controle de concorrência em `backend/src/services/booking_service.py`. Incluir testes unitários para conflitos de reserva. Atualizar o arquivo progresso.md com o status desta tarefa, marcando-a como concluída e registrando o que foi feito.

---

## Fase 7: História de Usuário 5 - Transbordo Humano (Prioridade: P1)

**Goal**: Escalonamento para um atendente humano caso a IA falhe.

- [X] T015 [US5] Implementar serviço de escalonamento e lógica de notificação em `backend/src/services/escalation_service.py`. Incluir testes de integração para o fluxo de **fallback**. Atualizar o arquivo progresso.md com o status desta tarefa, marcando-a como concluída e registrando o que foi feito.

---

## Fase 8: Frontend (Painel de Gestão)

**Purpose**: Interface de usuário para Síndicos e Porteiros.

- [X] T016 Inicializar projeto Next.js with TypeScript em `frontend/` e configurar cliente de API. Incluir testes unitários de componentes base. Atualizar o arquivo progresso.md com o status desta tarefa, marcando-a como concluída e registrando o que foi feito.
- [X] T017 [P] [US3] Implementar telas de gestão de Moradores (Lista/Criar/Editar) em `frontend/src/pages/residents/`. Incluir testes de UI. Atualizar o arquivo progresso.md com o status desta tarefa, marcando-a como concluída e registrando o que foi feito.
- [X] T018 [P] [US1] Implementar telas de upload de Documentos e monitoramento de RAG em `frontend/src/pages/documents/`. Incluir testes de UI. Atualizar o arquivo progresso.md com o status desta tarefa, marcando-a como concluída e registrando o que foi feito.
- [X] T019 [US5] Implementar Dashboard de Interações e painel de alertas de **escalation** em `frontend/src/pages/dashboard/`. Incluir testes de integração com los logs do Backend. Atualizar o arquivo progresso.md com o status desta tarefa, marcando-a como concluída e registrando o que foi feito.

---

## Fase 9: Polimento e Questões Transversais

- [X] T020 Auditoria final de performance e revisão de otimização de uso de tokens em todos os fluxos. Atualizar documentação em `docs/`. Atualizar o arquivo progresso.md com o status desta tarefa, marcando-a como concluída e registrando o que foi feito.

---

## Dependencies & Execution Order

1. **Fases 1 e 2** são fundamentais e DEVEM ser concluídas primeiro.
2. **Fase 3 (US1)** é o MVP e pode ser desenvolvida independentemente após a Fase 2.
3. **Fase 4 (US3)** é necessária para a identificação de moradores na US1.
4. **Fases 5, 6, 7** podem ser desenvolvidas em paralelo após a US1.
5. **Fase 8** depende das APIs do Backend das Fases 3-7.

### Parallel Opportunities
- T002, T003 (Infra/DB)
- T005, T006 (Integrações Base)
- T012 (APIs de Morador) enquanto a US1 está em andamento.
- T017, T018 (Telas de Frontend) assim que as APIs estiverem prontas.

---

## Implementation Strategy

1. **Setup Foundation**: Focar em T001-T006 para ter um "Hello World" funcional do WhatsApp para o Backend.
2. **MVP Delivery (US1)**: Focar em T007-T011 para habilitar a funcionalidade principal de perguntas e respostas via RAG.
3. **Management Capabilities**: Concluir US3 e US5 para habilitar controle e segurança.
4. **Service Expansion**: Adicionar US2 (Boleto) e US4 (Reservas).
5. **UI Polish**: Paralelizar o desenvolvimento do frontend para melhor visibilidade.
