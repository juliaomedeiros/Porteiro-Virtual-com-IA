# Contexto do Projeto: Porteiro Virtual com IA

Este arquivo serve como **ponto de entrada** para qualquer LLM (Large Language Model) como o Gemini. Ele contém o estado atual, a stack tecnológica e o histórico do projeto para que a IA consiga executar as tarefas corretamente e entender o escopo geral.

## 🎯 Objetivo Principal
Sistema modular para automação de portaria de condomínios via WhatsApp. Os moradores podem:
- Tirar dúvidas sobre regras (via IA RAG + Documentos em PDF).
- Solicitar 2ª via de boletos.
- Reservar áreas comuns.

## 🛠️ Stack Tecnológica

### Backend (Python)
- **Framework**: FastAPI (porta 8000)
- **Banco de Dados**: PostgreSQL + pgvector
- **ORM / Migrações**: SQLModel + SQLAlchemy + Alembic (pasta backend/migrations/)
- **IA & RAG**: LangChain, LangSmith e Google Gemini.
- **Integração WhatsApp**: evolution-go (evolution API)

### Frontend (TypeScript)
- **Framework**: Next.js 16 (App Router) (porta 3000 / acessado via 3001)
- **UI / CSS**: Tailwind CSS v4 + shadcn/ui (com base-ui)
- **Estilo**: Visual Premium SaaS/Dashboard profissional com responsividade.
- **Ícones**: lucide-react
- **RBAC**: Implementado no frontend com 3 níveis (Admin, Síndico, Porteiro). Admin vê todos os condomínios, Síndico/Porteiro veem apenas do próprio condomínio.

## 🗄️ Estrutura do Banco de Dados (Schema Atual)
O banco Postgres possui as tabelas mapeadas no Alembic:
1. condominio: Dados do condomínio.
2. morador: Moradores autorizados.
3. areacomum: Áreas reserváveis.
4. reserva: Reservas feitas.
5. documento: Uploads de PDFs para RAG.
6. embedding: Vetores do pgvector para busca.
7. interacao: Histórico de interações.
8. evolution-go: Tabelas do WhatsApp (instances, messages, etc).

## 📋 Histórico Recente de Mudanças
- **Frontend Modernizado**: UI migrada para shadcn/ui. Correção do Tailwind CSS de v3 para v4 (@import "tailwindcss";). Correção do menu Mobile.
- **Correções Base UI**: O shadcn/ui usa a prop 'render' do base-ui em vez de 'asChild' para <Button>.
- **Migrations Resolvidas**: Tabelas de sistema criadas rodando 'alembic upgrade head'. O ambiente backend não cria as tabelas automaticamente sem migração.
- **Refatoração Evolution-Go**: Implementada busca dinâmica de Token de Instância via `/instance/all`. O envio em massa (Broadcast) foi isolado em `BackgroundTasks` com delay anti-banimento e envio de "Relatório de Missão" para o Síndico via WhatsApp.

## ⚙️ Diretrizes para a IA
1. Não use @tailwind base/components/utilities. Este projeto usa Tailwind v4.
2. Não use 'asChild' nos Buttons do shadcn/ui, use 'render={<Link ... />}'.
3. Ao gerar migrações do Alembic, limpe as exclusões que ele gera para as tabelas do evolution-go (whatsmeow_, etc).
4. Rode docker compose para rebuild do frontend quando o código for alterado.
5. **Evolution-Go**: Para disparar mensagens (`/send/text` ou `/send/media`), a API exige o **Token da Instância** enviado no header `apikey`, e não a Global API Key. A classe `EvolutionAPIClient` já faz esse *auto-discovery* internamente.
