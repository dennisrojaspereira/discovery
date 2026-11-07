# TELE-HIST-102 — Modalidade na disponibilidade e filtro de slots

**Fase:** 1 · **Tamanho:** M · **Requisitos:** TELE-RF-003, TELE-RF-004 · **Regras:** TELE-RN-001
**Evidência de origem:** [tecnologia-telemedicina, @bruno, 10:04; @camila, 10:06] · **ADR:** ADR-T02

## Narrativa
Como **médico**, quero declarar em cada janela da minha agenda se atendo
presencial, por vídeo ou ambos, para que blocos dedicados e agenda mista
convivam como configuração — não como briga.

## Escopo técnico
- `AvailabilityRule.modality`: `IN_PERSON` | `VIDEO` | `BOTH` (default
  `IN_PERSON` nas regras existentes).
- `GET /availability/slots` ganha `modality` (default `IN_PERSON`): retorna só
  slots de regras compatíveis (`VIDEO` casa `VIDEO`/`BOTH`).
- `resolveSlotEnd`/criação de consulta validam compatibilidade modalidade×regra
  (TELE-RN-001) ⇒ 400 incompatível.
- A exclusion constraint segue única (slot ocupado some para as duas modalidades).
- Depende de TELE-HIST-101.

## Critérios de aceitação (Gherkin)

```gherkin
Funcionalidade: Slots por modalidade

  Cenário: Bloco dedicado
    Dado regra de sexta 14:00–17:00 com modality VIDEO
    Quando buscam slots de sexta com modality=VIDEO
    Então os slots aparecem
    Quando buscam com modality=IN_PERSON
    Então nenhum slot dessa regra aparece

  Cenário: Agenda mista
    Dado regra com modality BOTH
    Então os mesmos slots aparecem para as duas modalidades
    E ao ocupar um slot por vídeo, ele some também na busca presencial

  Cenário: Agendamento incompatível
    Dado regra VIDEO às 14:00
    Quando a recepção tenta agendar IN_PERSON às 14:00
    Então a API responde 400 com mensagem clara

  Cenário: Concorrência entre modalidades
    Dado regra BOTH e duas requisições simultâneas (uma VIDEO, uma IN_PERSON) no mesmo slot
    Então exatamente uma recebe 201 e a outra 409 (constraint única por médico/horário)
```
