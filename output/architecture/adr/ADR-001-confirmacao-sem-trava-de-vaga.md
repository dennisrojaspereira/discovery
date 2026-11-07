# ADR-001 — Confirmação de oferta sem trava de vaga

**Status:** aceito (2026-11-07) · **Fase:** 2 · **Decisores:** Rafael (CTO), Bruno (Arquiteto)
**Evidência:** [tecnologia-medagenda, 10:10–10:13]

## Contexto
Na fase 2, um horário liberado é oferecido a interessados da lista de espera.
Duas confirmações podem chegar simultaneamente (risco apontado pelo produto
[produto-medagenda, @juliana, 14:24]).

## Decisão
A oferta **não reserva** a vaga. Confirmar = criar a consulta pelo fluxo padrão
(`AppointmentsService.create`), protegido por transação + exclusion constraint
(`appointments_no_overlap`). A segunda confirmação concorrente recebe **409**
com mensagem honesta ("horário acabou de ser ocupado").

## Alternativa rejeitada: reserva temporária (trava com expiração)
- Um paciente lento bloquearia a vaga por todo o SLA (~15 min) — tempo precioso
  num horário que já é para hoje [tecnologia, @andre, 10:11].
- Exige máquina de estados extra (reservas expirando, liberação, corrida na
  expiração) sem evidência de necessidade.

## Consequências
- (+) Zero mecanismo novo de concorrência; consistência provada por teste e2e
  existente (5 requisições → 1 sucesso).
- (−) Paciente pode confirmar e não conseguir a vaga; mitigação: mensagem clara
  e oferta do próximo horário. Se o piloto mostrar frustração relevante,
  reavaliar trava com expiração (dados, não opinião).
