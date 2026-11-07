---
title: "Backlog — Épico: Telemedicina (retornos por vídeo)"
status: aprovado-para-publicacao
caso: telemedicina
created: 2026-11-07
gerado-por: /discovery-backlog (BMAD — bmad-create-epics-and-stories)
baseia-se-em: output/cases/telemedicina/prd/prd.md, output/cases/telemedicina/architecture/to-be.md
---

# Épico: Telemedicina — retornos por vídeo

**Objetivo:** viabilizar retorno por vídeo ponta a ponta (TELE-OBJ-1…5),
começando por agenda consciente de modalidade com piloto de link manual.
**Gate regulatório:** desenvolvimento corre; ativação só com parecer (TELE-RNF-004).

## Fase 1 — Agenda consciente de modalidade (pronta para implementação)

| ID | História | Requisitos | Tamanho |
|---|---|---|---|
| TELE-HIST-101 | Modalidade e tipo de consulta no agendamento (API) | TELE-RF-001, TELE-RF-002; TELE-RN-003, TELE-RN-004 | P |
| TELE-HIST-102 | Modalidade na disponibilidade e filtro de slots | TELE-RF-003, TELE-RF-004; TELE-RN-001 | M |
| TELE-HIST-103 | Elegibilidade parametrizada + feature flag | TELE-RF-005; TELE-RNF-004; TELE-RN-002 | P |
| TELE-HIST-104 | Link da teleconsulta com acesso restrito (API) | TELE-RF-006; TELE-RNF-001 | P |
| TELE-HIST-105 | UI: seletor de modalidade, badge e link na agenda do dia | TELE-RF-007; TELE-RNF-003 | M |

Detalhes e Gherkin: `stories/TELE-HIST-10x-*.md`. Cada história = 1 branch = 1 PR.
Ordem recomendada: 101 → 102 → 103 → 104 → 105 (105 depende das anteriores).

## Fase 2 — Vídeo como commodity [HIPÓTESE — aguarda piloto + parecer]

| ID | História | Requisitos |
|---|---|---|
| TELE-HIST-201 | Integração com provedor de vídeo (salas efêmeras via API) | TELE-RF-101 (ADR-T01) |
| TELE-HIST-202 | Job de véspera sobre o outbox (idempotente por consulta) | TELE-RF-102 (TELE-RN-005) |
| TELE-HIST-203 | Plano B operacional para falha do provedor | TELE-RF-103 |

## Fase 3 — Notificação e consentimentos [HIPÓTESE]

| ID | História | Requisitos |
|---|---|---|
| TELE-HIST-301 | Componente de notificação (e-mail, tabela com estado e trilha) | TELE-RF-201 (ADR-T04) |
| TELE-HIST-302 | Consentimentos: canal de mensagem + atendimento remoto (versão/timestamp) | TELE-RF-202, TELE-RF-203 |
| TELE-HIST-303 | Envio automático do link de teleconsulta | depende de 201+301 |

## Critérios de pronto (DoD de toda história)

1. Padrões do monorepo (módulo NestJS, DTO validado, RBAC, auditoria sem dado sensível).
2. Testes e2e cobrindo os cenários Gherkin — suíte completa verde (inclui casos anteriores).
3. Migrations aplicáveis com `prisma migrate deploy`.
4. PR único no Forgejo referenciando TELE-HIST e TELE-RFs; sem merge automático.
5. Notificação no canal `entregas-medagenda`.
