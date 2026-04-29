<!-- 
Sync Impact Report
- Version change: 0.0.0 -> 1.0.0
- List of modified principles:
    - [PRINCIPLE_1_NAME] -> I. Mentalidade MVP Escalonável
    - [PRINCIPLE_2_NAME] -> II. Segurança e Privacidade First
    - [PRINCIPLE_3_NAME] -> III. Testabilidade e Qualidade
    - [PRINCIPLE_4_NAME] -> IV. UX/UI de Excelência e Localização
    - [PRINCIPLE_5_NAME] -> V. Padrões de Codificação e Documentação
- Added sections: Diretrizes Técnicas, Workflow de Desenvolvimento
- Removed sections: None
- Templates requiring updates:
    - .specify/templates/plan-template.md (✅ updated)
- Follow-up TODOs: None
-->
# Portaria Agent Constitution

## Core Principles

### I. Mentalidade MVP Escalonável
O código deve ser simples e funcional para um MVP rápido, mas obrigatoriamente modular. Evite overengineering, garantindo separação clara de responsabilidades entre lógica de IA, integração (ex: WhatsApp) e regras de negócio do condomínio para facilitar a manutenção e o reaproveitamento.

### II. Segurança e Privacidade First
Como lidaremos com dados sensíveis de moradores, o sistema deve ter validação rigorosa de todas as entradas. É obrigatório implementar guardrails focados em evitar prompt injection e vazamento de informações contextuais ou privadas.

### III. Testabilidade e Qualidade
Todo código de regra de negócio central deve vir acompanhado de testes unitários e de integração. A arquitetura deve permitir a adoção progressiva de TDD (Test-Driven Development) conforme o projeto escala.

### IV. UX/UI de Excelência e Localização
Interfaces devem ser responsivas, modernas e seguir as melhores práticas de mercado. A comunicação da IA com o usuário deve ser clara, amigável e obrigatoriamente em Português do Brasil (PT-BR).

### V. Padrões de Codificação e Documentação
Utilize nomes de variáveis e funções descritivos e em inglês. No entanto, todo o conteúdo voltado ao usuário final e a documentação técnica devem ser redigidos em Português do Brasil (PT-BR).

## Diretrizes Técnicas

Priorizar a modularidade para permitir a substituição de provedores de LLM ou canais de mensageria sem necessidade de refatoração do núcleo de regras de negócio.

## Workflow de Desenvolvimento

Todo novo recurso ou alteração estrutural deve ser precedido por uma especificação e plano de implementação que valide explicitamente a aderência aos princípios desta Constituição.

## Governance

Esta Constituição é a autoridade máxima sobre padrões técnicos e éticos do projeto. Alterações no texto constitucional exigem uma revisão de impacto em todos os templates e artefatos de design ativos.

**Version**: 1.0.0 | **Ratified**: 2026-04-27 | **Last Amended**: 2026-04-27
