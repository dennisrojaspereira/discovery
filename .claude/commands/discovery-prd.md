---
description: Gera o PRD do MedAgenda a partir do Product Brief aprovado
---

# /discovery-prd

Gere o PRD usando o workflow PM do BMAD.

## Pré-requisito
`output/product-brief/product-brief.md` aprovado pelo usuário.

## Passos

1. Invoque a skill BMAD **bmad-prd** (Product Manager). Siga o workflow do framework.
2. Salve em `output/prd/prd.md`.
3. O PRD deve conter: contexto; problema; objetivos; usuários; jornada; escopo;
   fora de escopo; requisitos funcionais; requisitos não funcionais; regras de
   negócio; métricas; riscos; dependências; critérios de aceitação.
4. Regras de qualidade:
   - **IDs estáveis**: `RF-xxx` (funcionais), `RNF-xxx` (não funcionais),
     `RN-xxx` (regras de negócio). Nunca renumerar IDs já publicados.
   - Cada requisito marca a origem: `[APROVADO]` (decisão explícita nas conversas
     ou aprovação do usuário) ou `[HIPÓTESE]` (aguarda validação/piloto).
   - Fora de escopo explícito: o que o AS-IS intencionalmente não tem e que NÃO
     entra na fase 1 (notificações, antecipação automática etc., conforme discovery).
   - Rastreabilidade: requisito → evidência na transcrição.
5. **Ponto de aprovação**: apresente o PRD e aguarde aprovação antes de
   `/discovery-arquitetura` e `/discovery-backlog`.
6. Notifique `discovery-medagenda`.
