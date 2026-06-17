# Tarefas: Porteiro Virtual com IA

## Fase 1 e 2: Setup e Base (Backend / Infra)
- [X] T001 Criar estrutura de monorepo e testes iniciais.
- [X] T002 Configurar infra/docker-compose.yml (Postgres + Nextjs + FastAPI).
- [X] T003 Configurar framework de migrações (Alembic) e criar esquemas base.
- [X] T004 Configurar projeto backend FastAPI.
- [X] T005 Implementar cliente base da Evolution API (Evolution-go).
- [X] T006 Implementar endpoint webhook base.

## Fase 3: RAG Inicial (MVP)
- [X] T007 Configurar LangChain.
- [X] T008 Implementar RAG PDF.
- [X] T009 Busca Semântica pgvector.
- [X] T010 Memória inicial do bot.
- [X] T011 Guardrails básicos implementados.

## Fase 4 e 5 e 6: Features Base
- [X] T012 CRUD de Condomínio e Morador backend.
- [X] T013 Integração financeira (Boleto Base).
- [X] T014 Serviço de reservas backend (Áreas Comuns).

## Fase 8 e 9: Frontend Inicial UI
- [X] T016 Setup Next.js com TypeScript.
- [X] T017 Telas Moradores.
- [X] T018 Telas Documentos.
- [X] T019 Dashboard.
- [X] T021 Modernização Frontend (Tailwind v4 e shadcn/ui).
- [X] T022 Sincronização de migrations Alembic no Docker.

---
## FASE 10: NOVA ARQUITETURA DE IA E OPERAÇÃO (A IMPLEMENTAR)

- [ ] T023 [Backend] Configurar camada LiteLLM para ser provedor-agnóstica e ler a API_KEY criptografada direto do Banco de Dados.
- [ ] T024 [Backend] Criar tabela configuracao_ia (Prompt e Modelo) e ajustar injeção dinâmica no momento da chamada (Prompt DB + Dados Morador + 7 últimas interações).
- [ ] T025 [Backend] Implementar Guardrail Rígido de Autenticação: Bloquear webhook no início com a mensagem "Não há cadastro desse numero" e não chamar IA se número não existir.
- [ ] T026 [Backend] Implementar Roteador Semântico de Intenção (Filtro barato) antes de gastar tokens de RAG, definindo limite estrito de 2 parágrafos.
- [ ] T027 [Backend/Frontend] Lógica de Transbordo Automático: Campo status_bot na tabela Morador. Notificação omnichannel para o Síndico (Painel e Whats). Auto-resume de PAUSADO para ATIVO após 30min de inatividade.
- [ ] T028 [Frontend/Backend] Comunicados (Mensagens em Massa): Tela no Painel Admin/Síndico e backend que dispara lotes no Evolution-go filtrando apenas os moradores do condomínio do síndico.
- [ ] T029 [Frontend/Backend] Encomendas: Nova tabela encomenda, tela Registrar Encomenda (Apto, Destinatário, Tamanho, Descrição, Foto opcional) e envio do template de WhatsApp fixo.
- [ ] T030 [Frontend/Backend] Rotatividade de Moradores: Refatorar tela de edição de moradores permitindo deletar/adicionar números na mesma unidade (Aluguel), e visualizações baseadas no Síndico vinculado ao Condo.


