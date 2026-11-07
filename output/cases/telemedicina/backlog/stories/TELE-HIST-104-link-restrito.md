# TELE-HIST-104 — Link da teleconsulta com acesso restrito (API)

**Fase:** 1 · **Tamanho:** P · **Requisitos:** TELE-RF-006; TELE-RNF-001
**Evidência de origem:** [tecnologia-telemedicina, @andre, 10:14; produto-telemedicina, @fernanda, 14:08] · **ADR:** ADR-T01 (fase 1 = manual)

## Narrativa
Como **recepcionista**, quero gravar e consultar o link da sala na própria
consulta de vídeo, para reenviá-lo na hora em que o paciente ligar — sem o link
vazar para onde não deve.

## Escopo técnico
- `Appointment.videoLink` (nullable): `PATCH /appointments/:id/video-link`
  (ADMIN/RECEPCAO), só para consultas `VIDEO` e `SCHEDULED`; URL validada.
- Visível nas respostas apenas para ADMIN/RECEPCAO.
- **Nunca** em logs nem em payload de auditoria: eventos `VIDEO_LINK_SET`/
  `VIDEO_LINK_UPDATED` registram o ato, não o valor.
- Depende de TELE-HIST-101.

## Critérios de aceitação (Gherkin)

```gherkin
Funcionalidade: Link da teleconsulta

  Cenário: Gravação pelo balcão
    Dado uma consulta VIDEO agendada
    Quando a recepção grava uma URL válida
    Então a API responde 200 e o link aparece na consulta para RECEPCAO/ADMIN
    E existe auditoria VIDEO_LINK_SET sem conter a URL

  Cenário: Consulta presencial não tem link
    Dado uma consulta IN_PERSON
    Quando tentam gravar link
    Então a API responde 400

  Cenário: URL inválida
    Quando a recepção grava "isso não é url"
    Então a API responde 400

  Cenário: Perfil sem acesso
    Dado um usuário MEDICO (fase 1)
    Quando consulta a agenda via API
    Então o campo videoLink não é exposto a ele
```
