# Research: Porteiro Virtual IA

## Technical Decisions

### 1. Framework AI: LangChain (LangGraph) vs. CrewAI
- **Decision**: Utilizar **LangChain** como framework base, especificamente **LangGraph** para a orquestração de estados e fluxos complexos.
- **Rationale**: 
    - O projeto exige rastreabilidade rigorosa e monitoramento via **LangSmith**, que possui integração nativa e profunda com o ecossistema LangChain.
    - LangGraph permite maior controle sobre os loops de decisão e interações "human-in-the-loop" (essencial para o transbordo humano).
    - Embora o CrewAI seja excelente para orquestração de agentes autônomos, o LangChain oferece uma base mais sólida para um RAG corporativo e integração de ferramentas customizadas.
- **Alternatives considered**: 
    - **CrewAI**: Rejeitado como framework principal para garantir total compatibilidade com LangSmith e controle granular do fluxo de RAG, mas pode ser usado em uma camada superior se houver necessidade de agentes altamente autônomos no futuro.

### 2. Banco de Dados e Vetores: pgvector vs. Especializados
- **Decision**: Utilizar **PostgreSQL com a extensão pgvector**.
- **Rationale**: 
    - **Simplicidade Operacional**: Mantém todos os dados (relacionais de moradores/logs e vetoriais de documentos) em um único serviço, simplificando o backup e a infraestrutura via Docker.
    - **Consultas Híbridas**: Permite realizar JOINs entre metadados relacionais (ex: filtrar documentos por condomínio) e busca semântica em uma única query SQL.
    - **Escalabilidade**: Suporta milhões de vetores com performance adequada para o volume esperado de um MVP de condomínios.
- **Alternatives considered**: 
    - **Pinecone**: Rejeitado para evitar dependência de serviço externo (SaaS) e fragmentação de dados.
    - **Qdrant**: Uma alternativa sólida, mas adicionaria complexidade de infraestrutura desnecessária para a fase de MVP.

### 3. Processamento de PDFs e OCR
- **Decision**: Utilizar **PyMuPDF (fitz)** com **PyMuPDF4LLM** para extração rápida e **Tesseract** como fallback para OCR de imagens.
- **Rationale**: 
    - PyMuPDF é significativamente mais rápido que outras bibliotecas e preserva bem a estrutura de tabelas e parágrafos (essencial para Regimentos Internos).
    - PyMuPDF4LLM converte o PDF diretamente para Markdown, facilitando o "chunking" para o RAG.
    - O Tesseract será acionado apenas quando o PDF for detectado como uma imagem digitalizada.
- **Alternatives considered**: 
    - **Unstructured**: Excelente, mas possui muitas dependências pesadas; será considerada apenas se PyMuPDF falhar em layouts muito complexos.

### 4. Infraestrutura de Desenvolvimento
- **Decision**: Manter o banco de dados (Postgres) localmente dentro do **Docker Compose**.
- **Rationale**: 
    - Garante paridade entre ambientes de desenvolvimento e teste.
    - Facilita o "setup" inicial para novos desenvolvedores.
    - Para produção, o mesmo container pode ser utilizado ou migrado para um serviço gerenciado (RDS/Cloud SQL) com poucas alterações.

### 5. Segurança e Guardrails
- **Decision**: Implementar **Guardrails Customizados** (Regex + Classificadores de Intent) e utilizar **LangChain Guardrails/NeMo Guardrails**.
- **Rationale**: 
    - Proteção contra Prompt Injection e vazamento de dados de outros moradores é um requisito crítico (Princípio II).
    - O uso de uma camada de validação antes e depois da chamada ao Gemini garante que a resposta esteja dentro do escopo do condomínio.

## Summary of Tech Stack
- **Backend**: FastAPI
- **LLM**: Google Gemini (Flash para velocidade, Pro para tarefas complexas)
- **Vector DB**: Postgres + pgvector
- **AI Orchestration**: LangChain + LangGraph
- **Monitoring**: LangSmith
- **WhatsApp API**: Evolution API
- **PDF/OCR**: PyMuPDF + Tesseract
