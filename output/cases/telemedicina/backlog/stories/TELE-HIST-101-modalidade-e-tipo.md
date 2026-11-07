# TELE-HIST-101 — Modalidade e tipo de consulta no agendamento (API)

**Fase:** 1 · **Tamanho:** P · **Requisitos:** TELE-RF-001, TELE-RF-002 · **Regras:** TELE-RN-003, TELE-RN-004
**Evidência de origem:** [tecnologia-telemedicina, @andre, 10:03; @bruno, 10:09; negocio-telemedicina, @roberto, 09:30]

## Narrativa
Como **recepcionista**, quero registrar a modalidade (presencial/vídeo) e o
tipo (primeira consulta/retorno) ao agendar, para que a agenda saiba o que é
cada coisa — e o negócio finalmente meça retornos.

## Escopo técnico
- Enums `AppointmentModality` (`IN_PERSON`/`VIDEO`) e `ConsultationType`
  (`FIRST_VISIT`/`FOLLOW_UP`); campos em `Appointment` com defaults de histórico
  (`IN_PERSON` / `null`).
- DTO de criação: `consultationType` obrigatório; `modality` default `IN_PERSON`.
- Imutáveis após criação (TELE-RN-003): sem endpoint de edição.
- Campos presentes nas respostas de listagem/dashboard.
- Fora de escopo: validação de slot por modalidade (102), elegibilidade (103), UI (105).

## Critérios de aceitação (Gherkin)

```gherkin
Funcionalidade: Modalidade e tipo de consulta

  Cenário: Agendamento com tipo obrigatório
    Quando a recepção agenda sem informar consultationType
    Então a API responde 400
    Quando informa FOLLOW_UP
    Então a API responde 201 com modality IN_PERSON (default) e o tipo gravado

  Cenário: Histórico intacto
    Dado consultas criadas antes da feature
    Quando listadas
    Então aparecem com modality IN_PERSON e consultationType nulo

  Cenário: Imutabilidade
    Dado uma consulta criada
    Então não existe endpoint que altere modality ou consultationType
    E a tentativa de PATCH nesses campos (se enviada) é rejeitada/ignorada pela validação
```
