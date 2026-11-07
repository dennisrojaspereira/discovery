# Matriz de rastreabilidade — Épico: Otimização da agenda médica

Da fala à história: cada requisito nasce de evidência nas transcrições e
desemboca em uma história implementável.

| História | Requisitos | Regras | Decisão/ADR | Evidência primária |
|---|---|---|---|---|
| HIST-101 Registrar interesse | RF-001, RF-002, RF-006, RF-007 | RN-001, RN-003 | D6 (CRUD fase 1) | [produto, @lucas, 14:16] "formalizar a lista de espera"; [tecnologia, @andre, 10:27] unicidade |
| HIST-102 Consultar fila | RF-003, RF-005 | RN-002, RN-005 | ADR-003 (FIFO), ADR-004 (lazy) | [produto, @fernanda, 14:33] "a lista fique no sistema"; 14:27 expiração |
| HIST-103 Baixa | RF-004 | RN-004, RN-006 | — | jornada [produto, 14:07–14:13] |
| HIST-104 UI integrada | RF-008 | — | — | [tecnologia, @bruno, 10:29] "na tela de agendamento, não numa página escondida"; [negócio, @fernanda, 09:38] |
| HIST-201 Outbox | RF-104 | — | ADR-002 | [tecnologia, 10:14–10:18] |
| HIST-202 Matching | RF-101 | RN-002 | ADR-003 | [produto, @lucas, 14:26] janela |
| HIST-203 Oferta c/ expiração | RF-102 | RN-007 | — (Q5 aberto) | [produto, @pedro, 14:23] |
| HIST-204 Confirmação segura | RF-103 | RN-007 | ADR-001 | [produto, @juliana, 14:24]; [tecnologia, @bruno, 10:12] |
| HIST-301 Notificação | RF-201 | — | — (Q4 aberto) | [negócio, @fernanda, 09:17]; [tecnologia, @andre, 10:22] |
| HIST-302 Métricas | RF-202 | — | — | [produto, @pedro, 14:29] |

## Requisitos sem história (controle)

- RNF-001…RNF-007: transversais, verificados no DoD de cada história.
- Q1, Q2 (dados de negócio): fora do software; donos Roberto e Fernanda.
- Q7 (confirmação prévia): hipótese rival — sem história até decisão de produto.
