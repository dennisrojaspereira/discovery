# ADR-T02 — Modalidade declarada na regra de disponibilidade (não só na consulta)

**Status:** aceito (2026-11-07) · **Caso:** telemedicina · **Fase:** 1
**Evidência:** [tecnologia-telemedicina, @bruno, 10:04; @camila, 10:06; produto-telemedicina, @pedro, 14:14]

## Contexto
A diretoria divergiu: blocos dedicados de teleconsulta (Roberto, Dra. Paula) ×
agenda mista (Fernanda, Dr. Miguel). A modelagem decide quem "vence".

## Decisão
`AvailabilityRule.modality ∈ {IN_PERSON, VIDEO, BOTH}` (default `IN_PERSON`).
A consulta também carrega `modality`, validada contra a regra do slot. Resultado:
**a divergência vira configuração por médico** — a Dra. Paula cria regra de
sexta à tarde `VIDEO`; o Dr. Miguel deixa `BOTH`.

## Alternativas rejeitadas
1. **Modalidade só na consulta** (qualquer slot aceita qualquer modalidade):
   impõe o modelo "misto" a todos — ignora a operação do consultório
   [negócio, @roberto, 09:18].
2. **Agenda/calendário separado para vídeo**: duplica o motor de slots e a
   exclusion constraint deixaria de proteger o médico entre agendas; além de
   quebrar o modelo mental do paciente ("consulta com a Dra. Paula", não
   "consulta virtual") [produto, @lucas, 14:12].

## Consequências
- (+) Nenhum mecanismo novo de consistência: a constraint por médico/horário
  segue única e suficiente (slot é slot, em qualquer modalidade).
- (−) Parâmetro de modalidade atravessa o motor de slots e o agendamento; os
  casos de teste dobram [tecnologia, @camila, 10:06] — custo aceito.
