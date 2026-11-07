# ADR-004 — Expiração de interesse avaliada na leitura (lazy) na fase 1

**Status:** aceito (2026-11-07) · **Fase:** 1

## Contexto
Interesses devem expirar (RN-005; pedido da operação [produto-medagenda,
@fernanda, 14:27]). Opções: job agendado (cron/worker) ou avaliação na consulta.

## Decisão
Fase 1 usa **expiração lazy**: cada interesse carrega `expiresAt` calculado na
criação; as consultas filtram/atualizam por `expiresAt < now()`. Nenhum
scheduler novo.

## Alternativa rejeitada (por ora): job agendado
Criaria o primeiro componente de background do sistema só para expirar
registros — exatamente o tipo de infraestrutura prematura vetada na reunião
técnica (D5/D6). O job entra na fase 2, quando o outbox já exigir um loop de
background; a expiração pega carona nele.

## Consequências
- (+) Zero infra nova; comportamento determinístico e testável.
- (−) Registro expirado só muda de status persistido quando tocado por uma
  consulta; métricas da fase 3 devem usar `expiresAt` (fonte da verdade), não o
  timestamp da transição.
