# Contract: Admin API (Internal)

## Overview
APIs utilizadas pelo Painel Administrativo (Frontend) para gerenciar o condomínio.

## Base URL: `/api/v1`

### 1. Moradores
- `GET /residents`: Lista todos os moradores (com filtros por unidade/nome).
- `POST /residents`: Cadastra um novo morador.
- `PUT /residents/{id}`: Atualiza dados do morador.
- `DELETE /residents/{id}`: Inativa morador.

### 2. Documentos & RAG
- `POST /documents/upload`: Faz upload de um PDF e inicia o processamento OCR/Embeddings.
- `GET /documents`: Lista documentos e status de indexação.
- `DELETE /documents/{id}`: Remove documento e seus respectivos vetores.

### 3. Reservas
- `GET /bookings`: Lista reservas (com filtros por data/área).
- `PATCH /bookings/{id}`: Aprova ou cancela uma reserva.

### 4. Monitoramento
- `GET /analytics/stats`: Resumo de interações (mensagens resolvidas vs transbordos).
- `GET /logs`: Logs detalhados de interações com link para LangSmith.

## Authentication
- JWT (JSON Web Token) via header `Authorization: Bearer <token>`.
- Roles: `ADMIN`, `SINDICO`, `PORTARIA`.
