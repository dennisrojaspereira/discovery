---
title: "Backlog — Épico: Otimização da agenda médica"
status: aprovado-para-publicacao
created: 2026-11-07
gerado-por: /discovery-backlog (BMAD — bmad-create-epics-and-stories)
baseia-se-em: output/prd/prd.md, output/architecture/to-be.md
---

# Épico: Otimização da agenda médica (lista de espera)

**Objetivo:** reocupar horários cancelados formalizando a demanda reprimida
dentro do MedAgenda (OBJ-1…OBJ-4 do PRD). Entrega incremental em 3 fases; cada
fase só avança com dados da anterior.

## Fase 1 — Registro e visibilidade (pronta para implementação)

| ID | História | Requisitos | Tamanho |
|---|---|---|---|
| HIST-101 | Registrar interesse na lista de espera (API) | RF-001, RF-002, RF-006, RF-007; RN-001, RN-003 | P |
| HIST-102 | Consultar a fila com filtros e expiração | RF-003, RF-005, RF-006; RN-002, RN-005 | P |
| HIST-103 | Dar baixa em interesse (atendido/desistiu) | RF-004, RF-007; RN-004, RN-006 | P |
| HIST-104 | Fila visível no fluxo de agendamento (Web) | RF-008; RNF-001 | M |

Detalhes e Gherkin: `stories/HIST-10x-*.md`. Cada história = 1 branch = 1 PR.

## Fase 2 — Oferta e confirmação [HIPÓTESE — aguarda piloto da fase 1]

| ID | História | Requisitos |
|---|---|---|
| HIST-201 | Outbox transacional no cancelamento (`SLOT_RELEASED`) | RF-104 (ADR-002) |
| HIST-202 | Matching de interessados compatíveis com slot liberado | RF-101 (ADR-003) |
| HIST-203 | Oferta com expiração (SLA parametrizável) | RF-102 (Q5) |
| HIST-204 | Confirmação segura reutilizando o fluxo de agendamento | RF-103 (ADR-001) |

## Fase 3 — Notificação e métricas [HIPÓTESE]

| ID | História | Requisitos |
|---|---|---|
| HIST-301 | Notificação com consentimento de canal | RF-201 |
| HIST-302 | Métricas de reocupação no dashboard | RF-202 |

## Critérios de pronto (DoD de toda história)

1. Código segue os padrões do monorepo (módulo NestJS, DTO validado, RBAC, auditoria).
2. Testes e2e cobrindo os cenários Gherkin da história — suíte completa verde.
3. Migrations aplicáveis com `prisma migrate deploy` (sem passo manual).
4. PR único no Forgejo referenciando HIST e RFs; sem merge automático.
5. Notificação no canal `entregas-medagenda`.
