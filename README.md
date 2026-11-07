# CTO Discovery Lab

> **Da conversa de negócio ao Pull Request, com discovery estruturado, decisões
> rastreáveis e engenharia assistida por agentes.**

Laboratório local de engenharia agêntica que demonstra, de ponta a ponta, como
conversas entre **Negócio**, **Produto** e **Tecnologia** viram **Product Brief**,
**PRD** (via [BMAD Method](https://bmadcode.com)), **backlog** no Plane e uma
**implementação real com Pull Request** no Forgejo — tudo orquestrado pelo
**Claude Code**, rodando 100% em `localhost`.

## Componentes

| Serviço | URL | Papel |
|---|---|---|
| **MedAgenda Web** | http://localhost:3001 | Produto fictício: gestão de clínicas (Next.js) |
| **MedAgenda API** | http://localhost:3002/api | Backend NestJS + Prisma + PostgreSQL |
| **Mattermost** | http://localhost:8065 | Conversas de Negócio/Produto/Tecnologia |
| **Plane** | http://localhost:8080 | Docs, épicos e histórias |
| **Forgejo** | http://localhost:3000 | Git + Pull Requests (hospeda este monorepo) |

Inferência do Claude Code usa conexão externa com o modelo; todo o resto é local.

## Começo rápido

Pré-requisitos: Docker (com Compose v2), Node.js ≥ 20, Git, bash (no Windows, Git Bash).

```bash
./lab.sh bootstrap   # instala, sobe tudo, provisiona e publica as transcrições
./lab.sh start       # sobe containers + apps (após o primeiro bootstrap)
./lab.sh seed        # migrations + dados de exemplo do MedAgenda
./lab.sh verify      # checklist completo com evidências em output/evidence/
```

Outros: `stop`, `status`, `reset` (apaga volumes), `backup` (dump dos bancos).

### Credenciais (somente laboratório — dados fictícios)

- **MedAgenda**: `admin@medagenda.local` / `admin123` (também `recepcao@…/recepcao123`)
- **Mattermost**: `sysadmin` / `Sysadmin123!`
- **Forgejo**: `labadmin` / `Labadmin123!`
- **Plane**: `discovery@medagenda.local` / `DiscoveryLab2026!`

Tokens de API gerados pelo bootstrap ficam em `.lab-state/` (fora do Git).

## A esteira de discovery (comandos do Claude Code)

| Comando | Faz |
|---|---|
| `/discovery-importar` | Lê as conversas do Mattermost e gera síntese com evidências |
| `/discovery-brief` | BMAD Analyst → Product Brief |
| `/discovery-prd` | BMAD PM → PRD com requisitos de ID estável |
| `/discovery-arquitetura` | AS-IS (código real), TO-BE e ADRs |
| `/discovery-backlog` | Épico + histórias com critérios Gherkin |
| `/discovery-publicar` | Publica docs e backlog no Plane |
| `/discovery-implementar` | História do Plane → branch → testes → PR no Forgejo → aviso no Mattermost |
| `/discovery-completo` | Esteira completa com pontos de aprovação |

Cada etapa tem **ponto de aprovação humana**; nenhum PR é mergeado automaticamente.
Artefatos gerados ficam em `output/` (síntese, brief, PRD, arquitetura, backlog,
evidências de teste).

## O produto fictício: MedAgenda

Gestão de clínicas com médicos, especialidades, pacientes, disponibilidade
(regras semanais, duração de consulta, intervalos e bloqueios), agendamento com
**proteção contra conflitos concorrentes** (transação + exclusion constraint no
PostgreSQL + idempotência) e dashboard com dados reais do backend.

**Limitações intencionais do AS-IS** (é daqui que o discovery parte): sem lista
de espera, sem reaproveitamento de horários cancelados, sem notificações, sem
sugestão de remarcação, sem confirmação antecipada.

### Testes

```bash
npm run test --workspace apps/medagenda-api        # unitários
npm run test:e2e --workspace apps/medagenda-api    # 22 testes, inclui:
# - CONCORRÊNCIA: 5 requisições simultâneas no mesmo slot => 1 sucesso, 4×409
# - IDEMPOTÊNCIA: mesma idempotencyKey => mesma consulta
# - bloqueios de agenda, cancelamento, auditoria, RBAC
```

## Estrutura

```
apps/medagenda-web        Frontend (Next.js 16, Tailwind v4, estilo shadcn/ui)
apps/medagenda-api        Backend (NestJS 11, Prisma 6, PostgreSQL 16)
packages/shared-*         Tipos e validação compartilhados
infrastructure/           docker-compose (Postgres+Mattermost+Forgejo) e Plane
integrations/             CLIs: mattermost/, forgejo/, plane/
demo/transcripts/         As 3 reuniões fictícias (~1.000 palavras cada)
_bmad/ + .claude/skills/  BMAD Method v6 (instalação oficial, módulo BMM)
.claude/commands/         /discovery-* (a esteira deste laboratório)
output/                   Artefatos do discovery + evidências
lab.sh                    bootstrap | start | stop | status | seed | verify | reset | backup
```

## Segurança e privacidade

Sistema **fictício** com dados sintéticos. Mesmo assim aplica práticas reais:
autenticação JWT, autorização por perfil, validação de entrada (whitelist),
auditoria de operações, idempotência, proteção de concorrência no banco e
segredos fora do Git. O arquivo `output/architecture/as-is.md` separa o que é
demonstrativo do que seria exigido em produção (TLS, cookies httpOnly, LGPD,
retenção, backup, observabilidade).

## Roteiro de demonstração

Ver [DEMO.md](DEMO.md) — roteiro de 20 minutos em 7 atos.
