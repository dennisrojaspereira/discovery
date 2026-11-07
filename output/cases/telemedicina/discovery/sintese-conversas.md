---
title: Síntese das conversas de discovery — Caso "telemedicina"
status: concluído
caso: telemedicina
fonte: Mattermost (canais negocio-, produto- e tecnologia-telemedicina)
gerado-por: /discovery-importar (via /discovery-novo-caso telemedicina)
data: 2026-11-07
---

# Síntese — Caso "telemedicina": consultas por vídeo

Consolidação das três reuniões do caso. Evidências: `[canal, @autor, HH:MM]`.
Esta síntese não propõe solução; alimenta o `/discovery-brief` do caso.

## 1. Problemas e motivadores

| # | Item | Evidência |
|---|---|---|
| P1 | Pressão competitiva: clínica vizinha anunciando consulta por vídeo | [negocio-telemedicina, @mariana, 09:00] |
| P2 | Demanda interna: médica pedindo para atender retornos de casa | [negocio-telemedicina, @mariana, 09:00] |
| P3 | Retornos abandonados: segunda vinda só para ouvir resultado é sacrifício; "tem gente que desiste do retorno — e o tratamento fica pela metade" | [negocio-telemedicina, @fernanda, 09:03] |
| P4 | **Buraco de medição (de novo)**: o sistema não diferencia primeira consulta de retorno — impossível medir retornos perdidos | [negocio-telemedicina, @fernanda, 09:06; @roberto, 09:07] |
| P5 | O MedAgenda não envia nada ao paciente: "teleconsulta sem conseguir entregar link é carta sem correio" | [negocio-telemedicina, @fernanda, 09:27] |
| P6 | Código agnóstico de modalidade: `Appointment` e `AvailabilityRule` não têm conceito de modalidade nem de tipo de consulta | [tecnologia-telemedicina, @camila, 10:02] |

## 2. Dados levantados (amostras pequenas — indicativos)

- Médicos: 5 de 8 topariam retorno por vídeo; 2 contra; 1 indeciso [produto-telemedicina, @pedro, 14:02].
- Pacientes (amostra enviesada de fila, n=31): 19 prefeririam retorno por vídeo "se funcionar direito" [idem].
- Concorrente opera com link manual via WhatsApp do balcão [produto-telemedicina, @pedro, 14:09].

## 3. Hipóteses (não validadas)

| # | Hipótese | Evidência |
|---|---|---|
| H1 | Retorno é o caso de uso ideal; primeira consulta por vídeo é polêmica/clinicamente limitada | [negocio-telemedicina, @fernanda, 09:10] |
| H2 | Modalidade como **configuração por médico** na disponibilidade (bloco × misto deixa de ser decisão única) | [produto-telemedicina, @pedro, 14:14; tecnologia-telemedicina, @bruno, 10:04] |
| H3 | Mesmo preço do presencial no retorno ("o valor está no médico, não na sala") | [negocio-telemedicina, @roberto, 09:21] |
| H4 | Piloto com **link manual** enviado pela recepção antes de automatizar | [produto-telemedicina, @juliana, 14:10; tecnologia-telemedicina, @camila, 10:26] |
| H5 | No-show de vídeo menor que presencial (literatura) — validar com dado próprio | [produto-telemedicina, @pedro, 14:20] |
| H6 | Vídeo reduz abandono de tratamento (recuperação de retorno) | [produto-telemedicina, @pedro, 14:20] |

## 4. Decisões já tomadas

| # | Decisão | Evidência |
|---|---|---|
| D1 | **Parecer jurídico/regulatório é pré-requisito**, não detalhe — trava o resto | [negocio-telemedicina, @mariana, 09:13; tecnologia-telemedicina, @camila, 10:21] |
| D2 | **Não construir nem hospedar vídeo**: provedor de salas prontas via API (criar/obter link/expirar) | [negocio-telemedicina, @roberto, 09:25; tecnologia-telemedicina, @bruno, 10:11] |
| D3 | Piloto: retorno, uma especialidade, uma unidade, médicos voluntários | [negocio-telemedicina, @mariana, 09:28; produto-telemedicina, @juliana, 14:23] |
| D4 | Modalidade é atributo da consulta na UI (seletor no fluxo existente, badge forte), não agenda separada | [produto-telemedicina, @lucas, 14:12] |
| D5 | `consultationType` (primeira/retorno) vira requisito **transversal** aos três casos | [negocio-telemedicina, @roberto, 09:30; tecnologia-telemedicina, @bruno, 10:09] |
| D6 | Regra "vídeo só para retorno" parametrizada, não hard-code | [tecnologia-telemedicina, @andre, 10:08] |
| D7 | Link é dado sensível por inferência: acesso restrito, nunca em log, sala efêmera com expiração | [tecnologia-telemedicina, @andre, 10:14] |
| D8 | Notificação sai de "fase 3 de cada caso" e vira **componente próprio** (interno ao monolito, e-mail primeiro, tabela de mensagens com estado); telemedicina é o caso de negócio que o financia | [tecnologia-telemedicina, @camila, 10:17; @bruno, 10:19; negocio-telemedicina, @mariana, 09:28] |
| D9 | Falta em teleconsulta usa a mesma transição NO_SHOW do caso anterior (motivo ganha opção "não conectou") | [produto-telemedicina, @pedro, 14:18; tecnologia-telemedicina, @andre, 10:22] |
| D10 | Sem gravação de consulta por default (passivo jurídico/armazenamento) — documentar em ADR | [tecnologia-telemedicina, @bruno, 10:24] |

## 5. Contradições e divergências

| # | Divergência | Lados | Evidência |
|---|---|---|---|
| C1 | Bloco dedicado × agenda mista | Roberto/Dra. Paula: blocos (operação do consultório) × Fernanda/Dr. Miguel: misto (liquidez do horário — "acabamos de montar lista de espera contra horário morto") | [negocio-telemedicina, 09:16–09:18; produto-telemedicina, 14:14] — resolução proposta: configuração por médico (H2) |
| C2 | Preço | Roberto: mesmo preço × percepção de valor do paciente exige comunicação (Fernanda) | [negocio-telemedicina, 09:21–09:22] |
| C3 | Canal do link | WhatsApp "resolve" × privacidade (link identifica especialidade do paciente) e mistura com conta corporativa | [produto-telemedicina, @lucas, 14:25; tecnologia-telemedicina, @camila, 10:12] |

## 6. Riscos

- **Regulatório**: atendimento remoto exige consentimento com versão do termo e timestamp; situações que exigem presencial; jurídico no caminho crítico [negocio 09:11; tecnologia 10:21].
- **Operacional**: paciente confundindo modalidade e aparecendo na clínica; suporte de primeira hora sobrecarregando o balcão ("a senhora que não abre o link às 14h01") — recepção precisa ver link/status e **reenviar em 1 clique** [negocio 09:14; produto 14:06–14:08].
- **Dependência externa nova**: provedor de vídeo fora do ar derruba consultas — plano B operacional (telefone/reagendamento) [tecnologia, @camila, 10:26].
- **Privacidade**: dois consentimentos distintos (canal de mensagem × atendimento remoto); link fora de logs; provedor com salas não enumeráveis e contrato adequado a saúde [tecnologia, 10:12–10:21].
- **Escopo triplo**: o caso toca agenda + notificação + consentimento — "faseamento rígido ou vira um trimestre" [tecnologia, @camila, 10:26].
- **Inclusão**: oferecer, nunca empurrar; presencial sempre disponível [produto, @juliana, 14:23].

## 7. Questões abertas

| # | Questão | Dono | Evidência |
|---|---|---|---|
| Q1 | Parecer jurídico: termos, situações vedadas, registro exigido | Roberto + jurídico | [negocio, 09:11–09:13] |
| Q2 | Preço do retorno por vídeo (piloto decide) | Negócio | [negocio, 09:21] |
| Q3 | Escolha do provedor de vídeo (critérios de privacidade definidos) | Tecnologia | [tecnologia, 10:11–10:12] |
| Q4 | Canal de entrega do link no piloto (e-mail × manual × WhatsApp) | Produto + Tecnologia + jurídico | [produto, 14:25] |
| Q5 | Fluxo de registro dos dois consentimentos (momento e UX) | Produto + jurídico | [produto, @lucas, 14:17; tecnologia, 10:21] |
| Q6 | Demanda represada de retorno (depende do `consultationType` existir) | Fernanda/Pedro | [negocio, 09:06; produto, 14:22] |

## 8. Encaminhamento e faseamento técnico proposto

- **Fase 1**: campos `modality` + `consultationType`, modalidade na `AvailabilityRule`, filtro de modalidade no motor de slots, link em campo restrito com reenvio manual pela recepção [tecnologia, @bruno, 10:27].
- **Fase 2**: provedor de vídeo via API (salas efêmeras) + job de véspera sobre o outbox já desenhado.
- **Fase 3**: notificação como componente formal com os dois consentimentos.

Próximo passo: `/discovery-brief` do caso — **⏸ aguardando aprovação desta síntese**.
