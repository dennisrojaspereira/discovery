# CTO Discovery Lab — instruções para o Claude Code

Laboratório de engenharia agêntica: da conversa de negócio ao Pull Request.
Produto fictício: **MedAgenda** (gestão de médicos, pacientes e consultas).
Todos os dados são sintéticos — nunca insira dados reais de pacientes.

## Mapa do monorepo

| Caminho | O que é |
|---|---|
| `apps/medagenda-api` | API NestJS + Prisma + PostgreSQL (porta 3002) |
| `apps/medagenda-web` | Frontend Next.js 16 + Tailwind v4 (porta 3001) |
| `packages/shared-types` | Tipos TS compartilhados |
| `packages/shared-validation` | Schemas Zod compartilhados |
| `infrastructure/` | Docker Compose (Postgres, Mattermost, Forgejo, Plane) |
| `integrations/` | CLIs de integração (Mattermost, Forgejo, Plane) |
| `demo/transcripts/` | Transcrições fictícias das 3 reuniões |
| `_bmad/` + `.claude/skills/bmad-*` | BMAD Method v6 (instalação oficial) |
| `.claude/commands/discovery-*.md` | Esteira de discovery deste lab |
| `output/` | Artefatos gerados (síntese, brief, PRD, arquitetura, backlog, evidências) |
| `.lab-state/` | Tokens/segredos gerados em runtime — **fora do Git, nunca commitar** |

## Comandos essenciais

```bash
./lab.sh bootstrap|start|stop|status|seed|verify|reset|backup

# MedAgenda
npm run build --workspace apps/medagenda-api
npm run test:e2e --workspace apps/medagenda-api   # inclui teste de concorrência
npm run dev:api / npm run dev:web

# Integrações (tokens em .lab-state/)
node integrations/mattermost/mm.mjs read|post|channels
node integrations/forgejo/forgejo.mjs push|pr|prs
node integrations/plane/plane.mjs ensure-project|publish-docs|publish-backlog|get-story|verify
```

## Regras do laboratório

1. **Monorepo único** — nunca criar repositórios separados; o Forgejo hospeda este mesmo repo.
2. **BMAD oficial** — use as skills instaladas (`bmad-product-brief`, `bmad-prd`,
   `bmad-architecture`, `bmad-create-epics-and-stories`). Não invente comandos do framework.
3. **Evidência sempre** — conclusões do discovery citam canal/autor/timestamp das
   transcrições; integrações só são declaradas funcionais com teste executado.
4. **Pontos de aprovação** — brief, PRD, arquitetura e backlog exigem aprovação
   humana antes do passo seguinte. Nunca fazer merge de PR.
5. **AS-IS congelado** — não implementar lista de espera/notificações/antecipação
   fora do fluxo de uma história aprovada no Plane.
6. **Segurança** — segredos só em `.env`/`.lab-state` (fora do Git); dados pessoais
   não vão para logs nem auditoria; mutações registram auditoria.
7. **Next.js 16** — antes de mexer no frontend, leia os guias em
   `node_modules/next/dist/docs/` (ver AGENTS.md).

## Convenções de código (API)

- Módulo NestJS por domínio: `module` + `service` + `controller` + DTOs com class-validator.
- Autorização via `@Roles(...)`; rotas públicas via `@Public()`.
- Mutações gravam auditoria (`AuditService.record`).
- Conflito de agendamento: transação + exclusion constraint (migration
  `add_appointment_no_overlap`) — reusar esse mecanismo, não recriar.
- Erros: exceções HTTP do Nest com mensagens em português.

## Credenciais locais (somente laboratório)

- MedAgenda: `admin@medagenda.local/admin123`, `recepcao@…/recepcao123`
- Mattermost: `sysadmin/Sysadmin123!` (personas: `Personas123!`)
- Forgejo: `labadmin/Labadmin123!`
- Plane: `discovery@medagenda.local/DiscoveryLab2026!`
