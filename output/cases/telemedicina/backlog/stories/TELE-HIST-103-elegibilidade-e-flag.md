# TELE-HIST-103 — Elegibilidade parametrizada + feature flag

**Fase:** 1 · **Tamanho:** P · **Requisitos:** TELE-RF-005; TELE-RNF-004 · **Regras:** TELE-RN-002
**Evidência de origem:** [tecnologia-telemedicina, @andre, 10:08; negocio-telemedicina, @mariana, 09:13]

## Narrativa
Como **administradora**, quero que a telemedicina só seja ofertada quando a
chave estiver ligada e apenas para os tipos de consulta elegíveis, para que o
deploy ande em paralelo ao parecer jurídico sem risco de operação indevida.

## Escopo técnico
- Config `TELEMEDICINE_ENABLED` (default `false`) e
  `TELEMEDICINE_ELIGIBLE_TYPES` (default `FOLLOW_UP`).
- Flag desligada: busca de slots `VIDEO` retorna vazio e criação `VIDEO` ⇒ 403
  com mensagem explicando o gate.
- Flag ligada: `VIDEO` exige `consultationType ∈ elegíveis` ⇒ senão 400.
- Regra explícita e testável — não hard-code (D6).
- Depende de TELE-HIST-101/102.

## Critérios de aceitação (Gherkin)

```gherkin
Funcionalidade: Gate regulatório e elegibilidade

  Cenário: Flag desligada
    Dado TELEMEDICINE_ENABLED=false
    Quando buscam slots VIDEO de um médico com regra VIDEO
    Então a resposta é vazia
    E a criação de consulta VIDEO responde 403

  Cenário: Elegibilidade
    Dado TELEMEDICINE_ENABLED=true e elegíveis=FOLLOW_UP
    Quando agendam VIDEO com consultationType FIRST_VISIT
    Então a API responde 400
    Quando agendam VIDEO com FOLLOW_UP
    Então a API responde 201

  Cenário: Parâmetro de elegibilidade muda sem deploy de código
    Dado elegíveis=FIRST_VISIT,FOLLOW_UP
    Quando agendam VIDEO com FIRST_VISIT
    Então a API responde 201
```
