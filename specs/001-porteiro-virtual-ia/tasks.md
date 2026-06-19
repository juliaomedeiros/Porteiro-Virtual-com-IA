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

- [X] T023 [Backend] Configurar camada LiteLLM para ser provedor-agnóstica e ler a API_KEY criptografada direto do Banco de Dados.
- [X] T024 [Backend] Criar tabela configuracao_ia (Prompt e Modelo) e ajustar injeção dinâmica no momento da chamada (Prompt DB + Dados Morador + 7 últimas interações).
- [X] T025 [Backend] Implementar Guardrail Rígido de Autenticação: Bloquear webhook no início com a mensagem "Não há cadastro desse numero" e não chamar IA se número não existir.
- [X] T026 [Backend] Implementar Roteador Semântico de Intenção (Filtro barato) antes de gastar tokens de RAG, definindo limite estrito de 2 parágrafos.
- [X] T027 [Backend/Frontend] Lógica de Transbordo Automático: Campo status_bot na tabela Morador. Notificação omnichannel para o Síndico (Painel e Whats). Auto-resume de PAUSADO para ATIVO após 30min de inatividade.
- [X] T028 [Frontend/Backend] Comunicados (Mensagens em Massa): Tela no Painel Admin/Síndico e backend que dispara lotes no Evolution-go filtrando apenas os moradores do condomínio do síndico. Implementado em BackgroundTasks com delay anti-ban de 1.5s e relatório final via WhatsApp.
- [X] T029 [Frontend/Backend] Encomendas: Nova tabela encomenda, tela Registrar Encomenda (Apto, Destinatário, Tamanho, Descrição, Foto opcional) e envio do template de WhatsApp fixo.
- [X] T030 [Frontend/Backend] Rotatividade de Moradores: Refatorar tela de edição de moradores permitindo deletar/adicionar números na mesma unidade (Aluguel), e visualizações baseadas no Síndico vinculado ao Condo.
- [X] T031 [Backend] Refatoração Evolution-Go: Busca dinâmica de Token de Instância via rota `/instance/all` para autorização de disparo (`/send/text`), removendo o hardcode de "default".

---
## FASE 11: Autenticação, Usuários e Multi-Tenant
- [X] T032 [Backend] Criar tabela de Usuarios (Admin, Sindico, Porteiro) com senhas (bcrypt) e relação N:N com Condominio, migrando logica de is_sindico.
- [X] T033 [Backend] Implementar rotas OAuth2 para geração de token JWT.
- [X] T034 [Frontend] Criar tela de login e proteger rotas do painel baseadas no token JWT e cargo (RBAC).

## FASE 12: RAG Estrito e Painel Inbox
- [X] T035 [Backend] Ajustar inserção de Documentos e Busca Vetorial no pgvector para obrigar o filtro do metadata `condominio_id`.
- [X] T036 [Frontend/Backend] Refatorar Dashboard de Interações para formato Inbox (Zendesk), agrupando por morador, e buscando as 5 últimas mensagens.
- [X] T037 [Frontend] Botão e input para responder transbordos pelo painel e alterar status de volta para ATIVO automaticamente.

## FASE 13: Fluxo Financeiro de Reservas e Encomendas V2
- [X] T038 [Frontend/Backend] Alterar cadastro de Encomendas para usar Autocomplete do apartamento em vez de texto livre.
- [X] T039 [Backend] Backend de encomendas: notificar via Evolution API apenas 1 morador por unidade (evitar spam).
- [X] T040 [Backend] Alterar `AreaComum` e `Reserva` para suportar `taxa` (Decimal), `chave_pix` (String), e `status_pagamento` (Pendente, Pago).
- [X] T041 [Backend/IA] Implementar Tool Calling na IA para Reservas, gerando PIX de pagamento para áreas tarifadas.
- [X] T042 [Frontend/Backend] Tela no Painel para aprovar pagamento de Reservas, disparando WhatsApp de Confirmação e opções de cancelamento.
