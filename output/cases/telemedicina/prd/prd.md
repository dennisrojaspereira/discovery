---
title: "PRD: Telemedicina — retornos por vídeo no MedAgenda"
status: aguardando-aprovacao-para-arquitetura-e-backlog
caso: telemedicina
versao: 1.0.0
created: 2026-11-07
updated: 2026-11-07
gerado-por: /discovery-prd (BMAD PM — bmad-prd)
fontes: output/cases/telemedicina/product-brief/product-brief.md, demo/cases/telemedicina/transcripts/*
---

# PRD — Telemedicina: retornos por vídeo

> Convenções: IDs **estáveis** com prefixo do caso — `TELE-RF-xxx` (funcional),
> `TELE-RNF-xxx` (não funcional), `TELE-RN-xxx` (regra de negócio). Origem:
> **[APROVADO]** (decisão explícita nas conversas/brief aprovado) ou
> **[HIPÓTESE]** (aguarda parecer/piloto). Evidências: `[canal, @autor, HH:MM]`.

## 1. Contexto

O MedAgenda agenda consultas sem noção de modalidade ou tipo: `Appointment` e
`AvailabilityRule` são agnósticos de lugar (P6). O negócio aprovou pilotar
**retorno por vídeo** (brief aprovado), com parecer jurídico como pré-requisito
de operação (D1) e vídeo contratado como commodity (D2).

## 2. Problema

Pacientes abandonam retornos pela segunda vinda à clínica (P3); a clínica perde
receita e diferenciação (P1); médicos dispostos a atender remotamente não têm
como (P2); e nada disso é mensurável porque o sistema não distingue retorno de
primeira consulta (P4).

## 3. Objetivos

| ID | Objetivo | Métrica | Alvo piloto |
|---|---|---|---|
| TELE-OBJ-1 | Viabilizar retorno por vídeo ponta a ponta | Teleconsultas realizadas | > 0 com fluxo completo |
| TELE-OBJ-2 | "Funcionar direito" mensurável | % concluídas sem reagendar por falha técnica | ≥ 90% |
| TELE-OBJ-3 | Medir o que hoje não se mede | Baseline de retornos (exige tipo de consulta) | existir |
| TELE-OBJ-4 | Não sobrecarregar o balcão | Chamados de suporte por teleconsulta | métrica de guarda |
| TELE-OBJ-5 | Comparar no-show vídeo × presencial | Taxas por modalidade | baseline (H5) |

## 4. Usuários

- **Recepcionista (RECEPCAO)**: agenda com modalidade, vê/reenvia link, dá suporte de primeira hora.
- **Administrador (ADMIN)**: tudo acima + configuração (parâmetros, elegibilidade).
- **Médico (MEDICO)**: define modalidade das próprias regras de disponibilidade (fase 1 via recepção/admin; self-service é futuro).
- **Paciente**: beneficiário; recebe o link; **não** acessa o sistema.

## 5. Jornada (fase 1 — piloto com link manual)

1. Paciente elegível (retorno, especialidade do piloto) pede agendamento; a
   recepção seleciona **modalidade = vídeo** — opção visível só quando médico
   e tipo permitem.
2. Recepção registra o aceite verbal do atendimento remoto (fluxo definitivo de
   consentimento: Q5, com jurídico).
3. Na véspera/dia, a recepção cola o link da sala no campo da consulta e envia
   manualmente pelo canal combinado (H4); o link fica visível na agenda do dia.
4. Problema de acesso → paciente liga; recepção reenvia o link em 1 clique.
5. Consulta acontece; não conectou → recepção marca falta pelo fluxo NO_SHOW
   (caso 2) com motivo "não conectou".

## 6. Escopo

**Fase 1 (este PRD detalha):** TELE-RF-001…008 — modalidade e tipo de consulta,
modalidade na disponibilidade, filtro de slots, link com acesso restrito,
UI com badge, integração com fluxo de faltas, validação parametrizada.

**Fase 2 [HIPÓTESE]:** TELE-RF-101…103 — provedor de vídeo via API, salas
efêmeras, job de véspera (outbox).

**Fase 3 [HIPÓTESE]:** TELE-RF-201…203 — componente de notificação, dois
consentimentos formais, envio automático do link.

## 7. Fora de escopo

- Construir/hospedar vídeo (D2) · Gravação de consultas (D10 — ADR)
- Primeira consulta por vídeo (H1 — aguarda parecer e piloto)
- Notificação automática na fase 1 (fase 3) · App/portal do paciente
- Prescrição e documentos digitais · Preço (decisão de negócio — Q2)
- Abertura de agenda de vídeo antes do parecer jurídico (D1)

## 8. Requisitos funcionais — Fase 1

### TELE-RF-001 [APROVADO] Modalidade na consulta
`Appointment` ganha `modality`: `IN_PERSON` (default, inclusive para todo o
histórico) ou `VIDEO`. Exibida em toda listagem/agenda com badge inconfundível.
Origem: [tecnologia, @andre, 10:03; produto, @lucas, 14:12].

### TELE-RF-002 [APROVADO] Tipo de consulta (transversal)
`Appointment` ganha `consultationType`: `FIRST_VISIT` | `FOLLOW_UP`
(obrigatório em novos agendamentos; histórico fica `null`/não informado).
Requisito transversal aos casos cancelamento/no-show/tele (D5).
Origem: [negócio, @roberto, 09:07/09:30; tecnologia, @bruno, 10:09].

### TELE-RF-003 [APROVADO] Modalidade na disponibilidade
`AvailabilityRule` ganha `modality`: `IN_PERSON` | `VIDEO` | `BOTH` (default
`IN_PERSON` para regras existentes). Resolve bloco × misto por configuração
(C1/H2). Origem: [tecnologia, @bruno, 10:04].

### TELE-RF-004 [APROVADO] Slots filtrados por modalidade
O cálculo de slots aceita modalidade solicitada e retorna apenas slots de
regras compatíveis (`VIDEO` casa com `VIDEO`/`BOTH` etc.). O agendamento valida
a mesma compatibilidade no servidor. Origem: [tecnologia, @camila, 10:06].

### TELE-RF-005 [APROVADO] Elegibilidade parametrizada
Consulta `VIDEO` exige `consultationType = FOLLOW_UP` enquanto o parâmetro de
elegibilidade (config) assim determinar — regra explícita, não hard-code (D6).
Origem: [tecnologia, @andre, 10:08].

### TELE-RF-006 [APROVADO] Link da teleconsulta
Campo `videoLink` na consulta `VIDEO`: gravável/editável por ADMIN/RECEPCAO,
visível na agenda do dia, **nunca presente em logs/auditoria** (D7). Fase 1:
preenchido manualmente. Origem: [produto, @fernanda, 14:08; tecnologia, @andre, 10:14].

### TELE-RF-007 [APROVADO] Reenvio/cópia em 1 clique
Na agenda do dia, ação de copiar o link para reenvio imediato pelo canal do
piloto. Origem: [produto, @fernanda, 14:08].

### TELE-RF-008 [APROVADO] Falta em teleconsulta
Reusa a transição `NO_SHOW` do caso no-show sem mudança estrutural; motivo
ganha opção "não conectou" (D9). Origem: [tecnologia, @andre, 10:22].

## 9. Fases 2 e 3 (esboço)

- **TELE-RF-101 [HIPÓTESE]** Integração com provedor de vídeo via API: criar
  sala efêmera não enumerável, obter link, expirar após a consulta (Q3).
- **TELE-RF-102 [HIPÓTESE]** Job de véspera (outbox do caso 1): materializa
  salas das teleconsultas do dia seguinte, idempotente por consulta.
- **TELE-RF-103 [HIPÓTESE]** Plano B operacional registrado quando o provedor
  falhar (telefone/reagendamento).
- **TELE-RF-201 [HIPÓTESE]** Componente interno de notificação (e-mail
  primeiro): tabela de mensagens com estado, template, trilha (D8).
- **TELE-RF-202 [HIPÓTESE]** Consentimento de canal (reusa necessidade do caso
  no-show) e **TELE-RF-203** consentimento de atendimento remoto com versão do
  termo e timestamp (Q5; texto do jurídico).

## 10. Requisitos não funcionais

| ID | Origem | Requisito |
|---|---|---|
| TELE-RNF-001 [APROVADO] | D7 | `videoLink` fora de logs, auditoria e URLs próprias; acesso restrito a ADMIN/RECEPCAO |
| TELE-RNF-002 [APROVADO] | [tecnologia, @camila, 10:12] | Provedor de vídeo (fase 2) com salas efêmeras não enumeráveis, sem conta de paciente e contrato adequado a saúde |
| TELE-RNF-003 [APROVADO] | [produto, @lucas, 14:06] | UI impede ambiguidade de modalidade (badge em agenda, confirmação e listagens) |
| TELE-RNF-004 [APROVADO] | D1 | Funcionalidade atrás de parâmetro de ativação: agenda de vídeo só ativável após registro do parecer (gate operacional) |
| TELE-RNF-005 [APROVADO] | RNF-005 do caso 1 | Mutações idempotentes onde houver retry |
| TELE-RNF-006 [APROVADO] | D8 | Sem microsserviços; componente de notificação (fase 3) interno ao monolito |

## 11. Regras de negócio

| ID | Regra |
|---|---|
| TELE-RN-001 [APROVADO] | Consulta `VIDEO` só em slot de regra `VIDEO`/`BOTH` |
| TELE-RN-002 [APROVADO] | Enquanto a elegibilidade vigente for "retorno": `VIDEO` ⇒ `consultationType = FOLLOW_UP` |
| TELE-RN-003 [APROVADO] | `modality` e `consultationType` são imutáveis após criação; mudança = cancelar e reagendar (simplicidade e auditoria) |
| TELE-RN-004 [APROVADO] | Histórico existente: `modality = IN_PERSON`, `consultationType` não informado |
| TELE-RN-005 [HIPÓTESE] | (Fase 2) Sala criada no máximo 24h antes e expirada até 2h após o fim |

## 12. Métricas

Ver TELE-OBJ-1…5. Instrumentação da fase 1: `modality` + `consultationType` nas
consultas e motivo "não conectou" nas faltas — suficientes para adoção, sucesso
técnico, comparação de no-show e baseline de retorno.

## 13. Riscos

| Risco | Mitigação |
|---|---|
| Jurídico atrasar e travar o piloto | Parecer inicia já (Q1); desenvolvimento da fase 1 corre em paralelo (TELE-RNF-004 desacopla deploy de ativação) |
| Paciente confundir modalidade | TELE-RNF-003; roteiro de confirmação verbal no agendamento |
| Suporte de 1ª hora sobrecarregar o balcão | Piloto pequeno; TELE-RF-007; janela com reforço de escala |
| Exclusão digital | Vídeo é opção, nunca default; presencial sempre ofertado |
| Scope creep triplo (agenda+notificação+consentimento) | Fases rígidas [tecnologia, @camila, 10:26] |

## 14. Dependências

- **Externa**: parecer jurídico (Q1 — bloqueia ativação, não o desenvolvimento);
  provedor de vídeo (fase 2, Q3).
- **Interna**: fluxo NO_SHOW do caso 2 (para TELE-RF-008); outbox do caso 1
  (para fase 2); módulos `appointments`/`availability`.

## 15. Critérios de aceitação (fase 1 — nível PRD)

1. Dado um médico com regra `VIDEO` na sexta à tarde, quando a recepção busca
   slots de vídeo, então só os horários dessa regra aparecem; buscando
   presencial, não aparecem.
2. Dado um médico com regra `BOTH`, os mesmos slots servem às duas modalidades
   — e um slot ocupado some para ambas.
3. Dado `consultationType = FIRST_VISIT`, quando se tenta agendar `VIDEO` com a
   elegibilidade vigente "retorno", então a API recusa com 400 e mensagem clara.
4. Dado uma consulta `VIDEO` criada, quando a recepção grava/edita o link,
   então ele aparece na agenda do dia com ação de cópia — e não aparece em
   nenhum log ou payload de auditoria.
5. Dado o parâmetro de ativação desligado (TELE-RNF-004), nenhum slot `VIDEO` é
   ofertado, mesmo com regras configuradas.
6. Dado uma teleconsulta em que o paciente não conectou, a marcação de falta
   funciona pelo fluxo do caso no-show com motivo "não conectou".
7. Toda consulta nova exige `consultationType`; o histórico permanece válido.

## 16. Rastreabilidade

TELE-RF-001↔P6/D4 · TELE-RF-002↔P4/D5 · TELE-RF-003↔C1/H2 · TELE-RF-004↔[camila 10:06]
· TELE-RF-005↔D6/H1 · TELE-RF-006/007↔D7 e quebras 2–3 da jornada [produto 14:06–14:08]
· TELE-RF-008↔D9 · RNFs↔D1/D7/D8. Matriz completa no backlog do caso.
