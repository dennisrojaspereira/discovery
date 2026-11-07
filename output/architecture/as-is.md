---
title: "Arquitetura AS-IS — MedAgenda"
status: aprovado
created: 2026-11-07
gerado-por: /discovery-arquitetura (análise do código real do monorepo)
---

# Arquitetura AS-IS — MedAgenda

Documento gerado a partir da análise do código em `apps/medagenda-api` e
`apps/medagenda-web` (não de memória). Referências apontam para arquivos reais.

## C1 — Contexto

```mermaid
C4Context
  title MedAgenda — Diagrama de contexto (C1)
  Person(recepcao, "Recepcionista", "Agenda, cancela, cadastra")
  Person(admin, "Administrador", "Gestão + auditoria")
  System(medagenda, "MedAgenda", "Gestão de médicos, pacientes e consultas")
  SystemDb(pg, "PostgreSQL 16", "Persistência (Docker local)")
  Rel(recepcao, medagenda, "Usa", "HTTPS/navegador")
  Rel(admin, medagenda, "Usa", "HTTPS/navegador")
  Rel(medagenda, pg, "Lê/escreve", "Prisma/SQL")
```

Não há integrações externas no AS-IS: sem e-mail, sem SMS, sem webhook — um
cancelamento termina em si mesmo (motivador do discovery).

## C2 — Contêineres

```mermaid
flowchart LR
  subgraph Browser
    UI[medagenda-web\nNext.js 16 · Tailwind v4\nSPA autenticada - porta 3001]
  end
  subgraph Node
    API[medagenda-api\nNestJS 11 · porta 3002\nJWT + RBAC + ValidationPipe]
  end
  DB[(PostgreSQL 16\nbtree_gist)]
  UI -- "fetch JSON + Bearer JWT\n(lib/api.ts)" --> API
  API -- "Prisma 6" --> DB
```

| Contêiner | Stack | Observações |
|---|---|---|
| `medagenda-web` | Next.js 16 (App Router), páginas client-side, componentes estilo shadcn/ui | Autenticação via JWT em `localStorage` (`lib/api.ts`) — adequação de laboratório, ver §Produção |
| `medagenda-api` | NestJS 11, Prisma 6, class-validator, `@nestjs/jwt` | Guards globais: `JwtAuthGuard` + `RolesGuard` (`src/app.module.ts`) |
| PostgreSQL | 16-alpine (Docker) | Extensão `btree_gist` para exclusion constraint |

## Módulos da API (NestJS)

```
src/
├── auth/            JWT, @Public, @Roles, RolesGuard
├── specialties/     CRUD simples
├── doctors/         CRUD + desativação lógica (status INACTIVE)
├── patients/        CRUD (dados fictícios)
├── availability/    Regras semanais + bloqueios + cálculo de slots
├── appointments/    Agendar / listar / cancelar (núcleo)
├── dashboard/       Agregações do dia
├── audit/           AuditService.record() — trilha de mutações
└── prisma/          PrismaService global
```

## Modelo de dados (prisma/schema.prisma)

```mermaid
erDiagram
  Specialty ||--o{ Doctor : tem
  Doctor ||--o{ AvailabilityRule : define
  Doctor ||--o{ AvailabilityBlock : bloqueia
  Doctor ||--o{ Appointment : atende
  Patient ||--o{ Appointment : marca
  User ||--o{ AuditLog : gera
  Appointment {
    uuid id PK
    uuid doctorId FK
    uuid patientId FK
    timestamp startsAt
    timestamp endsAt
    enum status "SCHEDULED|COMPLETED|CANCELLED|NO_SHOW"
    string cancelReason
    timestamp cancelledAt
    string idempotencyKey UK
  }
  AvailabilityRule {
    int weekday "0-6"
    string startTime "HH:mm"
    string endTime "HH:mm"
    int slotDurationMin
    int bufferMin
  }
```

## Estados da consulta

```mermaid
stateDiagram-v2
  [*] --> SCHEDULED : POST /appointments
  SCHEDULED --> CANCELLED : POST /:id/cancel (motivo obrigatório)
  SCHEDULED --> COMPLETED : (futuro, sem endpoint dedicado)
  SCHEDULED --> NO_SHOW : (futuro)
  CANCELLED --> [*]
```

O cancelamento (`appointments.service.ts#cancel`) grava `cancelReason` e
`cancelledAt`, audita e **termina aí** — nenhum evento, lista ou notificação.

## Fluxo: agendar consulta (sequence)

```mermaid
sequenceDiagram
  participant W as Web (agendamentos/page.tsx)
  participant A as API (AppointmentsService)
  participant AV as AvailabilityService
  participant PG as PostgreSQL
  W->>A: POST /appointments {doctorId, patientId, startsAt, idempotencyKey}
  A->>A: valida futuro + médico ACTIVE + paciente
  A->>PG: idempotencyKey já existe? (retorna existente se sim)
  A->>AV: resolveSlotEnd() — startsAt é slot válido da regra?
  AV-->>A: endsAt (ou 400)
  A->>AV: hasBlockOverlap()? (409 se bloqueado)
  A->>PG: BEGIN
  A->>PG: count overlap SCHEDULED (camada 2)
  A->>PG: INSERT appointment
  Note over PG: Camada 3: EXCLUDE USING gist\n(doctorId =, tsrange &&) WHERE SCHEDULED\n→ 23P01 sob corrida
  A->>PG: COMMIT
  A->>PG: INSERT audit_log (APPOINTMENT_CREATED)
  A-->>W: 201 consulta (ou 409 conflito)
```

## Mecanismos de consistência existentes (reusar, não recriar)

1. **Validação de slot** contra regras de disponibilidade
   (`availability.service.ts#resolveSlotEnd`).
2. **Checagem transacional** de sobreposição dentro de `$transaction`
   (`appointments.service.ts#create`).
3. **Exclusion constraint** no banco — garantia final sob concorrência
   (migration `20261107015222_add_appointment_no_overlap`):
   ```sql
   ALTER TABLE "appointments" ADD CONSTRAINT appointments_no_overlap
   EXCLUDE USING gist ("doctorId" WITH =, tsrange("startsAt","endsAt") WITH &&)
   WHERE (status = 'SCHEDULED');
   ```
   Violação (23P01) → HTTP 409. Comprovado por teste e2e: 5 requisições
   simultâneas no mesmo slot ⇒ 1×201 + 4×409
   (`test/appointments.e2e-spec.ts`).
4. **Idempotência**: `idempotencyKey` única; reenvio retorna a consulta criada.
5. **Auditoria**: mutações gravam `audit_logs` (ação, entidade, usuário), sem
   dados clínicos no payload (`audit.service.ts`).

## Segurança (AS-IS)

- JWT com expiração; guards globais; RBAC por `@Roles` (ADMIN/RECEPCAO/MEDICO).
- `ValidationPipe` com whitelist + forbidNonWhitelisted (rejeita campo extra).
- Senhas bcrypt; mensagens de login não revelam existência de e-mail.
- Segredos em `.env` (fora do Git).

## Demonstração × produção real

| Aceitável no laboratório | Exigido em produção |
|---|---|
| JWT em `localStorage` | Cookie httpOnly + CSRF, rotação de refresh |
| HTTP local | TLS em tudo |
| Timezone do host | TZ explícita da clínica + testes de DST |
| Seed com senhas conhecidas | Gestão de segredos (vault), MFA |
| Sem rate limit | Rate limit, lockout, WAF |
| Logs no console | Observabilidade, alertas, retenção LGPD |
| `COMPLETED/NO_SHOW` sem endpoint | Fluxo operacional completo |

## O gap que motiva o TO-BE

Não existe nenhum conceito de demanda reprimida: nenhuma entidade "interesse",
nenhuma reação ao cancelamento, nenhuma visibilidade de quem espera vaga.
Ver `to-be.md`.
