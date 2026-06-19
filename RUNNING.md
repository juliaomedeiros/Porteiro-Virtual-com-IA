# Guia de Execução: Porteiro Virtual com IA

Este guia fornece as instruções passo a passo para configurar, executar e testar a aplicação em seu ambiente local, incluindo o novo sistema de Controle de Acesso (RBAC).

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado:
- **Docker** e **Docker Compose**
- **Git**
- Uma **API Key do Google Gemini** (necessária para a IA e Embeddings)
- (Opcional) Chave da Evolution API e LangSmith para monitoramento completo.

---

## 🚀 Passo a Passo

### 1. Configuração do Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
# Google AI
GOOGLE_API_KEY=sua_chave_gemini_aqui

# Evolution API (Integração WhatsApp)
EVOLUTION_API_URL=http://seu_link_evolution:8080
EVOLUTION_API_KEY=sua_apikey_evolution
EVOLUTION_INSTANCE_NAME=nome_da_sua_instancia

# LangSmith (Opcional - Monitoramento)
LANGSMITH_API_KEY=sua_chave_langsmith
LANGCHAIN_TRACING_V2=true
LANGCHAIN_PROJECT=porteiro-virtual
```

### 2. Subir o Ambiente Docker

Acesse a pasta `infra/` e execute o Docker Compose para subir o banco de dados (com pgvector), o backend e o frontend:

```bash
cd infra
docker-compose up --build -d
```

Isso iniciará:
- **Banco de Dados**: Porta `5433` (Postgres com pgvector)
- **Backend (FastAPI)**: Porta `8000`
- **Frontend (Next.js)**: Porta `3000`

### 3. Migrações do Banco de Dados

Caso esteja rodando localmente (fora do Docker) ou precise aplicar migrações manualmente:

```bash
cd backend
# Instale as dependências (recomendado usar venv)
pip install -r requirements.txt
# Aplique as migrações
alembic upgrade head
```

### 4. Acessar a Aplicação

- **Painel Administrativo (Frontend)**: [http://localhost:3001](http://localhost:3001)
- **Documentação da API (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)

### 5. Configurar o Webhook no Evolution-Go

Para que o bot (backend) receba as mensagens dos moradores, é necessário configurar o Webhook na sua instância do Evolution-Go.
Aponte o Webhook para o endereço interno do Docker do backend:
- **URL do Webhook:** `http://backend:8000/api/v1/webhooks/evolution-go`
- **Eventos:** Selecione o evento `messages` (ou `messages.upsert`).

---

## 🔐 Controle de Acesso (RBAC)

**IMPORTANTE:** Como as melhorias foram feitas no código-fonte, você **precisa reconstruir as imagens do Docker** para que as mudanças apareçam no navegador:

```bash
cd infra
docker-compose up --build -d
```

O sistema agora possui três perfis de usuário para teste. Você pode alternar entre eles usando o seletor no canto superior direito da barra de navegação.

### Perfis Disponíveis:

1.  **Admin (Administrador do Sistema):**
    *   **Acesso:** Global (todos os condomínios).
    *   **Permissões:** Criar, editar e excluir Condomínios, Áreas Comuns, Moradores e Documentos.
    *   **Dashboard:** Visualiza métricas de qualquer condomínio.

2.  **Síndico:**
    *   **Acesso:** Restrito ao seu condomínio selecionado.
    *   **Permissões:** Somente leitura. Pode visualizar moradores, áreas comuns e documentos.
    *   **Dashboard:** Visualiza apenas as métricas do seu condomínio.
    *   **Restrição:** Não pode criar, editar ou excluir dados.

3.  **Porteiro:**
    *   **Acesso:** Restrito ao seu condomínio selecionado.
    *   **Permissões:** Somente leitura (similar ao Síndico).
    *   **Foco:** Monitoramento de interações e visualização de moradores/áreas.

---

## 🧪 Executando Testes

### Testes do Backend (Python/Pytest)

```bash
cd backend
pytest
```

### Testes do Frontend (TypeScript/Jest)

```bash
cd frontend
npm install
npm test
```

---

## 🛠️ Guia de Uso Rápido (Fluxo de Teste)

1.  **Acesse o Frontend** como **Admin** (padrão inicial).
2.  **Crie um Condomínio** (pelo Swagger em `localhost:8000/docs` ou via script, já que a página de gestão de condomínios está em desenvolvimento).
3.  **Cadastre Áreas Comuns** para esse condomínio.
4.  **Vá em Documentos & RAG** e faça o upload de um PDF (ex: Regimento Interno).
    *   Aguarde o status mudar para `INDEXADO`.
5.  **Cadastre um Morador** com o seu número de WhatsApp (formato E.164, ex: `5511999999999`).
6.  **Teste o RBAC:**
    *   Mude sua função para **Síndico** ou **Porteiro** no menu superior.
    *   Selecione o condomínio que você criou.
    *   Note que as opções de "New Resident", "Upload PDF" e botões de exclusão/edição sumiram.
    *   Verifique se a lista de moradores e áreas comuns agora mostra apenas os dados do condomínio selecionado.
7.  **Interação WhatsApp:** Envie uma mensagem para o bot e veja a resposta baseada no documento que você subiu.
8.  **Dashboard:** Volte ao painel e veja as estatísticas de uso atualizadas em tempo real.

### 9. Arquivo de Contexto para IA (gemini.md)
O arquivo gemini.md localizado na raiz do projeto deve ser anexado como contexto sempre que um novo chat com Inteligência Artificial (Gemini ou outros) for iniciado. Ele fornece visibilidade da arquitetura, status do frontend e esquema do banco de dados para evitar alucinações.

### 10. Atualizações de Interface e Cache
Caso sinta que a interface (Frontend) não carregou as melhorias do **Tailwind CSS v4** ou botões do **shadcn/ui**, limpe o cache do seu navegador e verifique se o Docker completou o rebuild usando:
docker compose up --build -d frontend
