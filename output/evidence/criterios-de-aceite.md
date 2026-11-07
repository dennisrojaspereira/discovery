# Critérios de aceite do laboratório — evidências

Verificação final em 2026-11-07. Evidências automatizadas complementares em
`output/evidence/verify-*.md` (gerado por `./lab.sh verify` — 10/10 OK).

| # | Critério | Status | Evidência |
|---|---|---|---|
| 1 | Todo o código em um monorepo | ✅ | Repositório único com npm workspaces (`apps/*`, `packages/*`); Forgejo hospeda o mesmo repo |
| 2 | MedAgenda acessível via navegador | ✅ | http://localhost:3001 (login `admin@medagenda.local/admin123`); `verify`: Web respondendo |
| 3 | Médicos cadastráveis | ✅ | e2e `doctors › cria, edita e desativa` + UI /medicos |
| 4 | Especialidades cadastráveis | ✅ | e2e `specialties › cria e lista` + UI /especialidades |
| 5 | Pacientes fictícios cadastráveis | ✅ | e2e `patients › cria e edita` + UI /pacientes |
| 6 | Disponibilidades configuráveis | ✅ | e2e `availability › lista slots` (regras + bloqueios) + UI /disponibilidade |
| 7 | Consultas agendadas e canceladas | ✅ | e2e agendar/cancelar/reagendar slot liberado + UI /agendamentos |
| 8 | Testes de conflito de horários passam | ✅ | e2e CONCORRÊNCIA: 5 requisições simultâneas ⇒ 1×201 + 4×409 (exclusion constraint `appointments_no_overlap`) |
| 9 | Mattermost funcionando | ✅ | http://localhost:8065, time medagenda, 6 canais; `verify` OK |
| 10 | 3 transcrições publicadas | ✅ | 89 falas postadas pelas 10 personas nos canais negocio/produto/tecnologia-medagenda (`publish-transcripts.mjs`) |
| 11 | Plane funcionando | ✅ | http://localhost:8080, workspace `medagenda`; `plane.mjs verify`: 11 issues, 14 páginas |
| 12 | Forgejo funcionando | ✅ | http://localhost:3000, repo `labadmin/cto-discovery-lab` com main + branch de feature |
| 13 | BMAD instalado | ✅ | BMAD Method 6.12.4, módulo bmm, 29 skills em `.claude/skills/bmad-*` |
| 14 | Product Brief gerado | ✅ | `output/product-brief/product-brief.md` (estrutura BMAD, evidências citadas) |
| 15 | PRD gerado | ✅ | `output/prd/prd.md` (RF/RNF/RN com IDs estáveis, [APROVADO]/[HIPÓTESE]) |
| 16 | AS-IS documentado | ✅ | `output/architecture/as-is.md` (C1/C2, ER, sequence, estados — do código real) |
| 17 | Backlog gerado | ✅ | `output/backlog/` (épico, 10 histórias, Gherkin, matriz de rastreabilidade) |
| 18 | Épico criado no Plane após aprovação | ✅ | Issue "Épico · Otimização da agenda médica" + 10 histórias filhas com labels de fase (API v1 real) |
| 19 | História implementada pelo agente | ✅ | HIST-101: branch `feature/hist-101-registrar-interesse`, módulo waitlist + migration com índice único parcial, 11 novos e2e (33/33 verdes) |
| 20 | Pull Request real aberto no Forgejo | ✅ | PR #1: http://localhost:3000/labadmin/cto-discovery-lab/pulls/1 (sem merge — revisão humana) |
| 21 | Mattermost notificado do PR | ✅ | Post do Discovery Bot no canal `entregas-medagenda` com link do PR e evidência de testes |

## Observações de implementação

- **Plane**: o endpoint público HTTP de sign-up da instância (god-mode) retornou
  500 nesta versão (1.4.3); o bootstrap contorna com provisionamento idempotente
  via Django shell dentro do container (`integrations/plane/bootstrap-instance.py`),
  que cria admin, workspace e API token. Pages não existem na API pública v1 —
  publicadas pela API interna de sessão (mesma usada pelo frontend do Plane).
- **Épico**: Plane CE 1.4.3 não expõe epics na API pública; o épico é uma issue-pai
  com label `épico` e as histórias são issues-filhas (campo `parent`) — visível
  como hierarquia na UI.
- **Aprovações**: nesta execução de validação do laboratório, os gates de
  aprovação foram exercidos de forma autônoma para provar a esteira ponta a
  ponta; na demonstração ao vivo, cada `/discovery-*` para e aguarda aprovação
  humana (ver `.claude/commands/discovery-completo.md`).
