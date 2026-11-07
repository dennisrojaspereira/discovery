# ADR-002 — Outbox transacional em vez de mensageria (e em vez de síncrono puro)

**Status:** aceito (2026-11-07) · **Fase:** 2 · **Decisores:** Rafael, Bruno, Camila, André
**Evidência:** [tecnologia-medagenda, 10:14–10:19]

## Contexto
O gatilho "consulta cancelada" precisa disparar pós-processamento (achar
interessados, criar ofertas, futuramente notificar). Três opções debatidas:
síncrono no request, outbox + job, mensageria (RabbitMQ/Kafka).

## Decisão
**Outbox transacional mínimo**: o cancelamento grava o evento `SLOT_RELEASED`
na MESMA transação do UPDATE; um job no próprio processo da API processa a
tabela em intervalo curto, com marcação idempotente (`processedAt`).
Na **fase 1 nem isso existe** — é CRUD puro [tecnologia, @camila, 10:18].

## Alternativas rejeitadas
1. **Síncrono no request**: falha/lentidão do pós-processamento degradaria o
   cancelamento — operação que a recepção executa com o paciente na linha
   [tecnologia, @bruno, 10:16].
2. **Mensageria**: "matar mosca com canhão" para dezenas de eventos/dia
   [tecnologia, @andre, 10:15]; infra nova fere a restrição de orçamento (D2).

## Consequências
- (+) Evento nunca se perde (mesma transação); cancelamento permanece rápido.
- (+) Sem infraestrutura nova: uma tabela e um loop.
- (−) Latência de segundos até a oferta — irrelevante para o caso de uso.
- (−) Um único processo processa o outbox; se a API escalar horizontalmente,
  adicionar `FOR UPDATE SKIP LOCKED` (anotado para o futuro).
