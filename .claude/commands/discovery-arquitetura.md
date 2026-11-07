---
description: Analisa o monorepo, documenta o AS-IS e propõe o TO-BE
---

# /discovery-arquitetura

Documente a arquitetura real do MedAgenda e proponha a evolução incremental.

## Passos

1. **Analise o código real** do monorepo (não descreva de memória):
   - `apps/medagenda-api/prisma/schema.prisma` (modelo de dados, constraints)
   - `apps/medagenda-api/src/appointments/*` (transação, idempotência, conflito)
   - `apps/medagenda-api/src/availability/*` (slots, regras, bloqueios)
   - `apps/medagenda-api/prisma/migrations/*` (exclusion constraint)
   - `apps/medagenda-web/app/*` (fluxos de UI)
2. A skill BMAD **bmad-architecture** pode apoiar o workflow. Não invente
   comandos do framework.
3. Gere em `output/architecture/`:
   - `as-is.md` — arquitetura atual: C1 e C2 (Mermaid), modelo de dados,
     fluxos de negócio (sequence diagrams Mermaid: agendar, cancelar),
     estados da consulta, mecanismos de consistência existentes.
   - `to-be.md` — como a lista de espera se integra ao agendamento existente,
     cobrindo: concorrência, consistência, autorização, privacidade,
     idempotência, auditoria. Proposta incremental por fases.
   - `adr/ADR-001-*.md` em diante — decisões com alternativas rejeitadas
     (ex.: confirmação sem trava vs. com reserva; outbox vs. síncrono vs.
     mensageria; regras determinísticas vs. LLM).
4. Restrições (vindas da reunião de tecnologia — respeite-as):
   - Não propor microsserviços desnecessários.
   - Não propor IA generativa para regra determinística.
   - Reusar o mecanismo de conflito existente (transação + exclusion constraint).
5. **Ponto de aprovação**: apresente AS-IS/TO-BE/ADRs antes do backlog.
