# Porteiro Virtual com IA 🤖🏢

O **Porteiro Virtual com IA** é uma solução moderna e escalonável para automação de atendimento em condomínios via WhatsApp. Utilizando Inteligência Artificial Generativa e técnicas de **RAG (Retrieval-Augmented Generation)**, o sistema permite que moradores tirem dúvidas sobre regulamentos internos, solicitem serviços e realizem reservas de forma autônoma e segura.

---

## 🚀 Tecnologias Principais

- **Backend:** Python (FastAPI), LangChain/LangGraph.
- **Inteligência Artificial:** Google Gemini (LLM), pgvector (Busca Vetorial).
- **Integração WhatsApp:** Evolution API.
- **Frontend:** Next.js (TypeScript).
- **Monitoramento:** LangSmith.
- **Infraestrutura:** Docker & Docker Compose.

---

## 🛠️ Metodologia de Desenvolvimento (SDD & Spec Kit)

Este projeto foi concebido seguindo os princípios de **SDD (Spec-Driven Development)**, utilizando o **Spec Kit** para garantir que a implementação seja fiel aos requisitos e tecnicamente sólida desde o primeiro dia.

### O que é SDD?
O **Spec-Driven Development** (Desenvolvimento Orientado a Especificação) é uma abordagem onde a documentação técnica (Especificações, Planos e Contratos) é tratada como a "fonte da verdade" antes da escrita de qualquer código. Isso reduz ambiguidades, facilita o trabalho de IAs generativas e garante que o MVP entregue exatamente o que foi planejado.

### Como usamos o Spec Kit aqui:
O diretório `specs/001-porteiro-virtual-ia/` contém todo o DNA do projeto:
1.  **`spec.md`**: Define os cenários de usuário, prioridades (P1, P2) e critérios de aceitação.
2.  **`research.md`**: Documenta as decisões técnicas (por que LangChain? por que pgvector?).
3.  **`plan.md`**: Mapeia a arquitetura, stack tecnológica e estrutura de pastas.
4.  **`data-model.md` & `contracts/`**: Definem a estrutura de dados e as interfaces de API.
5.  **`tasks.md`**: Uma lista de tarefas granulares, gerada automaticamente pelo Spec Kit, que orienta a implementação passo a passo com foco em testes e economia de tokens.

---

## 📋 Funcionalidades (MVP)

- [x] **Resolução de Dúvidas (RAG):** Respostas precisas baseadas no Regimento Interno do condomínio.
- [x] **Segunda Via de Boleto:** Integração para recuperação rápida de cobranças.
- [x] **Gestão de Moradores:** Painel administrativo para controle de acesso.
- [x] **Reservas:** Agendamento de áreas comuns com controle de concorrência.
- [x] **Transbordo Humano:** Escalonamento inteligente quando a IA não consegue resolver o problema.

---

## 🏁 Como Iniciar

Consulte o arquivo [quickstart.md](specs/001-porteiro-virtual-ia/quickstart.md) para instruções detalhadas de configuração do ambiente Docker e chaves de API.

---

## 🛡️ Segurança e Privacidade
O projeto implementa **Security Guardrails** contra *Prompt Injection* e garante que os dados dos moradores (como CPF e Telefone) sejam criptografados em repouso, respeitando a privacidade entre unidades.

---

