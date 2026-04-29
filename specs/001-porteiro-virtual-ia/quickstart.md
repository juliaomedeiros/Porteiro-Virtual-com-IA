# Quickstart: Porteiro Virtual IA

Este guia descreve como iniciar o ambiente de desenvolvimento local.

## Pré-requisitos
- Docker & Docker Compose instalados.
- Chave de API do Google Gemini.
- Conta no LangSmith (opcional, mas recomendado).
- Evolution API rodando (ou configurar via Docker).

## Instalação Rápida

1. **Clonar o Repositório**:
   ```bash
   git clone <repo-url>
   cd portaria_agent
   ```

2. **Configurar Variáveis de Ambiente**:
   Crie um arquivo `.env` na raiz (e nos diretórios `backend` e `frontend` se necessário):
   ```env
   # Backend
   GOOGLE_API_KEY=sua_chave_gemini
   DATABASE_URL=postgresql://user:pass@db:5432/porteiro_db
   EVOLUTION_API_URL=http://evolution:8080
   LANGSMITH_API_KEY=sua_chave_langsmith
   
   # Frontend
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

3. **Subir os Containers**:
   ```bash
   docker-compose up --build
   ```

4. **Acessar os Serviços**:
   - **Frontend**: http://localhost:3000
   - **Backend (Swagger)**: http://localhost:8000/docs
   - **Postgres**: localhost:5432

## Primeiros Passos

1. Acesse o Painel Administrativo.
2. Cadastre o seu condomínio.
3. Faça upload do **Regimento Interno** em PDF na aba "Documentos".
4. Cadastre o seu número de WhatsApp como **Morador**.
5. Envie uma mensagem para o número configurado na Evolution API e teste a IA!

## Estrutura de Pastas
- `backend/`: API FastAPI e lógica de IA.
- `frontend/`: Painel administrativo em Next.js.
- `infra/`: Configurações de Docker e Banco de Dados.
