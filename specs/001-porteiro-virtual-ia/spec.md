# Feature Specification: Porteiro Virtual com IA

**Feature Branch**: `001-porteiro-virtual-ia`  
**Created**: 2026-04-27  
**Status**: Draft  
**Input**: User description: "Porteiro Virtual com IA para condomínios via WhatsApp com perfis de Morador, Síndico/Porteiro e Desenvolvedor."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Morador: Resolução de Dúvidas (Priority: P1)

Como morador, quero tirar dúvidas sobre as regras do condomínio via WhatsApp, para que eu não precise procurar documentos físicos ou incomodar o síndico.

**Why this priority**: É a funcionalidade central de atendimento da IA, reduzindo a carga operacional do síndico.

**Independent Test**: Enviar uma pergunta sobre o regimento interno via WhatsApp e receber uma resposta precisa e amigável em PT-BR.

**Acceptance Scenarios**:

1. **Given** que o morador está cadastrado, **When** ele pergunta "Pode cachorro no elevador?", **Then** a IA responde com base na Convenção/Regimento Interno.
2. **Given** que a dúvida não consta nos documentos, **When** o morador pergunta algo fora do escopo, **Then** a IA informa educadamente que não possui essa informação.

---

### User Story 2 - Morador: Segunda Via de Boleto (Priority: P1)

Como morador, quero solicitar a 2ª via do meu boleto via WhatsApp, para facilitar o pagamento da taxa condominial sem depender de outros canais.

**Why this priority**: Funcionalidade de alto valor percebido e essencial para a saúde financeira do condomínio.

**Independent Test**: Solicitar o boleto do mês atual e receber o arquivo PDF ou linha digitável válida.

**Acceptance Scenarios**:

1. **Given** que o sistema financeiro está integrado, **When** o morador solicita "meu boleto deste mês", **Then** a IA retorna o boleto correspondente à unidade dele.

---

### User Story 3 - Porteiro/Síndico: Gestão de Moradores (Priority: P1)

Como síndico, quero cadastrar e gerenciar moradores no painel, para garantir que apenas pessoas autorizadas utilizem o serviço via WhatsApp.

**Why this priority**: Bloqueio (gate) essencial para a segurança e identificação correta dos usuários.

**Independent Test**: Cadastrar um novo morador no painel e verificar se ele consegue interagir com a IA no WhatsApp.

**Acceptance Scenarios**:

1. **Given** a interface de gestão, **When** o síndico cadastra um CPF e telefone, **Then** o sistema vincula o número de celular à unidade informada.

---

### User Story 4 - Morador: Reserva de Áreas Comuns (Priority: P2)

Como morador, quero reservar o salão de festas ou churrasqueira via WhatsApp, para agilizar o processo sem burocracia.

**Why this priority**: Automatização de um processo recorrente e propenso a conflitos manuais.

**Independent Test**: Realizar uma reserva para uma data disponível e receber a confirmação.

---

### User Story 5 - Transbordo para Atendimento Humano (Priority: P1)

Como morador, quero ser encaminhado para um atendente humano se a IA não resolver minha dúvida, para não ficar sem suporte.

**Why this priority**: Garante que o usuário nunca seja deixado sem resposta (Rede de Segurança).

**Independent Test**: Simular falha na resolução da IA e verificar se o Porteiro/Síndico recebe o alerta no painel.

---

### Edge Cases

- **Prompt Injection**: O que acontece quando um usuário tenta forçar a IA a ignorar suas regras de segurança ou agir como outra pessoa? (Deve ser bloqueado pelos guardrails).
- **Conflito de Reservas**: Como o sistema lida com dois moradores tentando reservar o mesmo espaço no mesmo segundo? (Trava de concorrência no banco de dados).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE processar mensagens via API do WhatsApp em tempo real.
- **FR-002**: A IA DEVE basear suas respostas exclusivamente nos documentos (RAG - Retrieval-Augmented Generation) carregados para o condomínio.
- **FR-003**: O sistema DEVE validar o número de celular do morador contra a base de dados cadastrada antes de responder.
- **FR-004**: O painel de gestão DEVE permitir o envio de mensagens em massa (comunicados) via WhatsApp.
- **FR-005**: O sistema DEVE notificar automaticamente o morador quando uma encomenda for registrada na portaria.
- **FR-006**: O painel master (Desenvolvedor) DEVE permitir o ajuste de prompts e monitoramento de logs.

### Non-Functional Requirements

- **NFR-001 (Segurança)**: Todo dado sensível de morador (CPF, telefone) DEVE ser criptografado em repouso.
- **NFR-002 (Performance)**: O tempo de resposta da IA (do recebimento da mensagem ao envio da resposta) DEVE ser inferior a 10 segundos na média.
- **NFR-003 (Disponibilidade)**: O sistema DEVE estar disponível 24/7 para interações via WhatsApp.
- **NFR-004 (Privacidade)**: Implementar guardrails para evitar vazamento de dados de uma unidade para outra.

### Key Entities *(include if feature involves data)*

- **Morador**: CPF, Nome, Celular, Unidade (Apartamento/Bloco).
- **Condomínio**: Nome, CNPJ, Documentos Oficiais (PDF/Texto), Áreas Comuns.
- **Reserva**: ID Morador, ID Área, Data, Status (Pendente/Confirmada).
- **Interação**: Histórico de mensagens, Feedback do usuário, Logs de Segurança.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 80% das dúvidas dos moradores são resolvidas autonomamente pela IA sem necessidade de transbordo humano.
- **SC-002**: Tempo médio de emissão de 2ª via de boleto reduzido para menos de 1 minuto via WhatsApp.
- **SC-003**: Zero incidentes de vazamento de dados contextuais entre moradores diferentes em 90 dias de operação.
- **SC-004**: Redução de 50% no volume de ligações para a portaria/síndico para dúvidas rotineiras.

## Assumptions

- Os moradores possuem acesso ao WhatsApp e o utilizam como canal primário.
- O condomínio fornecerá os documentos em formato digital (PDF/DOCX) legível.
- O sistema financeiro do condomínio possui API ou exportação compatível para geração de boletos.
