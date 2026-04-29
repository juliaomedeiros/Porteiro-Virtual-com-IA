# Data Model: Porteiro Virtual IA

## Entities

### 1. Condomínio (Condominium)
Representa a entidade jurídica e física do condomínio.
- `id`: UUID (PK)
- `name`: String (Not Null)
- `cnpj`: String (Unique, Not Null)
- `address`: String
- `created_at`: Timestamp
- `updated_at`: Timestamp

### 2. Morador (Resident)
Indivíduos autorizados a interagir com a IA.
- `id`: UUID (PK)
- `condominio_id`: UUID (FK -> Condominio.id)
- `name`: String (Not Null)
- `cpf`: String (Unique,Null) - **Encrypted in Rest**
- `phone`: String (Unique, Not Null) - E.164 format (e.g., +5511999999999)
- `unit`: String (Not Null) - Ex: "Apt 122", "Bloco B - Casa 4"
- `is_active`: Boolean (Default: True)
- `created_at`: Timestamp

### 3. Área Comum (Common Area)
Espaços que podem ser reservados.
- `id`: UUID (PK)
- `condominio_id`: UUID (FK -> Condominio.id)
- `name`: String (Not Null) - Ex: "Salão de Festas", "Churrasqueira"
- `description`: Text
- `max_capacity`: Integer
- `rules`: Text

### 4. Reserva (Booking)
Registros de reservas de áreas comuns.
- `id`: UUID (PK)
- `morador_id`: UUID (FK -> Morador.id)
- `area_id`: UUID (FK -> AreaComum.id)
- `booking_date`: Date (Not Null)
- `status`: Enum (PENDENTE, CONFIRMADA, CANCELADA)
- `created_at`: Timestamp

### 5. Documento (Document)
Documentos oficiais para o RAG.
- `id`: UUID (PK)
- `condominio_id`: UUID (FK -> Condominio.id)
- `name`: String (Not Null) - Ex: "Regimento Interno 2024.pdf"
- `file_url`: String
- `content_hash`: String (MD5/SHA)
- `status`: Enum (PROCESSANDO, INDEXADO, ERRO)
- `created_at`: Timestamp

### 6. Embedding (Vector Data)
Fragmentos de documentos e seus vetores (armazenado via pgvector).
- `id`: UUID (PK)
- `document_id`: UUID (FK -> Documento.id)
- `content`: Text (O fragmento original)
- `embedding`: Vector(768) - Dimensões baseadas no Gemini Embeddings v1.5
- `metadata`: JSONB (Página, contexto, etc.)

### 7. Interação (Interaction Log)
Logs de conversas para auditoria e LangSmith.
- `id`: UUID (PK)
- `morador_id`: UUID (FK -> Morador.id)
- `user_message`: Text
- `ai_response`: Text
- `token_usage`: Integer
- `latency_ms`: Integer
- `langsmith_run_id`: String (UUID do LangSmith)
- `feedback_score`: Integer (NULL, 1-5)
- `created_at`: Timestamp

## Relationships
- **Condomínio** tem muitos **Moradores**, **Áreas Comuns** e **Documentos**.
- **Morador** tem muitas **Reservas** e **Interações**.
- **Documento** tem muitos **Embeddings**.
- **Área Comum** tem muitas **Reservas**.

## Validation Rules
- **Phone**: Deve ser validado antes do cadastro via regex ou libphonenumber.
- **CPF**: Deve ser validado matematicamente.
- **Reserva**: Não pode haver duas reservas CONFIRMADAS para a mesma `area_id` na mesma `booking_date` (Lock de banco).
- **RAG Context**: A busca vetorial deve ser sempre filtrada pelo `condominio_id` do morador autenticado.
