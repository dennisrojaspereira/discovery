# HIST-103 — Dar baixa em interesse (atendido / desistiu)

**Fase:** 1 · **Tamanho:** P · **Requisitos:** RF-004, RF-007 · **Regras:** RN-004, RN-006
**Evidência de origem:** jornada da recepção [produto, 14:07–14:13]

## Narrativa
Como **recepcionista**, quero dar baixa em um interesse quando o paciente for
atendido ou desistir, para que a fila reflita a realidade e gere métrica de
reocupação.

## Escopo técnico
- `POST /waitlist/interests/:id/fulfill` `{appointmentId}`: valida que a
  consulta existe, está `SCHEDULED` e pertence ao mesmo paciente → `FULFILLED`
  + vínculo (RN-006).
- `POST /waitlist/interests/:id/cancel` `{reason}` (3–300) → `CANCELLED`.
- Só interesses `ACTIVE` podem ser baixados; auditoria em ambas transições.

## Critérios de aceitação (Gherkin)

```gherkin
Funcionalidade: Baixa de interesse

  Cenário: Atendido com vínculo
    Dado um interesse ACTIVE do paciente X e uma consulta SCHEDULED de X
    Quando a recepção dá baixa como atendido vinculando a consulta
    Então o status vira FULFILLED e o appointmentId fica registrado
    E existe auditoria "WAITLIST_INTEREST_FULFILLED"

  Cenário: Vínculo inválido
    Dado um interesse ACTIVE do paciente X e uma consulta do paciente Y
    Quando a recepção tenta dar baixa vinculando essa consulta
    Então a API responde 400

  Cenário: Desistência exige motivo
    Dado um interesse ACTIVE
    Quando a recepção dá baixa como desistência sem motivo
    Então a API responde 400
    Quando informa motivo válido
    Então o status vira CANCELLED com o motivo registrado

  Cenário: Baixa dupla
    Dado um interesse FULFILLED
    Quando qualquer baixa é tentada novamente
    Então a API responde 400
```
