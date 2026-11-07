# Matriz de rastreabilidade — Épico: Telemedicina

| História | Requisitos | Regras | ADR | Evidência primária |
|---|---|---|---|---|
| TELE-HIST-101 Modalidade e tipo | TELE-RF-001, TELE-RF-002 | TELE-RN-003/004 | — | [tecnologia, @andre, 10:03; negócio, @roberto, 09:30] |
| TELE-HIST-102 Disponibilidade e slots | TELE-RF-003, TELE-RF-004 | TELE-RN-001 | ADR-T02 | [tecnologia, @bruno, 10:04; @camila, 10:06] |
| TELE-HIST-103 Elegibilidade + flag | TELE-RF-005; TELE-RNF-004 | TELE-RN-002 | — | [tecnologia, @andre, 10:08; negócio, @mariana, 09:13] |
| TELE-HIST-104 Link restrito | TELE-RF-006; TELE-RNF-001 | — | ADR-T01 | [tecnologia, @andre, 10:14; produto, @fernanda, 14:08] |
| TELE-HIST-105 UI | TELE-RF-007; TELE-RNF-003 | — | — | [produto, @lucas, 14:12; quebras 1–3 da jornada, 14:06] |
| TELE-HIST-201 Provedor de vídeo | TELE-RF-101 | TELE-RN-005 | ADR-T01 | [tecnologia, @bruno, 10:11; @camila, 10:12] |
| TELE-HIST-202 Job de véspera | TELE-RF-102 | TELE-RN-005 | ADR-T04 (outbox) | [tecnologia, @andre, 10:16] |
| TELE-HIST-203 Plano B | TELE-RF-103 | — | ADR-T01 | [tecnologia, @camila, 10:26] |
| TELE-HIST-301 Notificação | TELE-RF-201 | — | ADR-T04 | [tecnologia, @camila, 10:17] |
| TELE-HIST-302 Consentimentos | TELE-RF-202/203 | — | — | [tecnologia, 10:21; produto, @lucas, 14:17] |
| TELE-HIST-303 Envio automático do link | — | — | ADR-T04 | [negócio, @fernanda, 09:27] |

## Decisões sem história (controle)

- ADR-T03 (sem gravação): decisão negativa — não gera trabalho, previne trabalho.
- TELE-RF-008 (falta em tele): coberto pelo épico do caso no-show; aqui só o
  motivo "não conectou".
- Q1 (parecer), Q2 (preço): fora do software; donos Roberto/Mariana.
