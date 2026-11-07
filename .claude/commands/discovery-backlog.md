---
description: Gera épico e histórias a partir do PRD aprovado
---

# /discovery-backlog

Gere o backlog incremental a partir do PRD e da arquitetura aprovados.

## Pré-requisitos
PRD (`output/prd/prd.md`) e arquitetura (`output/architecture/`) aprovados.

## Passos

1. Invoque a skill BMAD **bmad-create-epics-and-stories**. Siga o workflow.
2. Salve em `output/backlog/`:
   - `backlog.md` — visão geral do épico e fases
   - `stories/HIST-xxx-*.md` — uma história por arquivo
3. Estrutura esperada (sujeita ao que o discovery aprovou):
   - **Fase 1**: cadastro de interesse em lista de espera; consulta de
     interessados; associação com especialidade e disponibilidade.
   - **Fase 2**: identificação de horários liberados; convite para antecipação;
     controle de expiração; confirmação segura.
   - **Fase 3**: notificações; métricas de ocupação; melhorias operacionais.
4. Cada história contém:
   - ID estável `HIST-xxx`, título, fase
   - Referência aos requisitos do PRD (`RF-xxx`, `RN-xxx`)
   - Critérios de aceitação em **Gherkin** (Dado/Quando/Então), incluindo
     cenários de erro e concorrência quando aplicável
   - Notas técnicas apontando para o AS-IS/TO-BE
5. Histórias da fase 1 devem ser pequenas o bastante para um PR cada.
6. **Ponto de aprovação**: apresente o backlog; só publique no Plane
   (`/discovery-publicar`) após aprovação.
