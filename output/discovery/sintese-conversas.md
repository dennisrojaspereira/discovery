---
title: Síntese das conversas de discovery — MedAgenda
status: concluído
fonte: Mattermost (canais negocio-, produto- e tecnologia-medagenda)
gerado-por: /discovery-importar
data: 2026-11-07
---

# Síntese das conversas de discovery

Consolidação das três reuniões publicadas no Mattermost. **Toda afirmação cita a
evidência** no formato `[canal, @autor, HH:MM]`. Esta síntese não propõe solução;
ela alimenta o Analyst do BMAD (`/discovery-brief`).

## 1. Problemas

| # | Problema | Evidência |
|---|---|---|
| P1 | Cancelamentos de última hora deixam horários ociosos: "o paciente liga às 8h para desmarcar a consulta das 9h. Aí aquele horário simplesmente morre" | [negocio-medagenda, @fernanda, 09:02] |
| P2 | O indicador de ocupação (82%) conta consulta agendada, não realizada — "a ociosidade real ninguém mede" | [negocio-medagenda, @fernanda, 09:04] |
| P3 | Impacto financeiro não quantificado; estimativa de 5–10% do faturamento é "chute" assumido | [negocio-medagenda, @roberto, 09:06] |
| P4 | Reorganização da agenda é manual e despadronizada: planilha/caderno/grupo de WhatsApp, diferente em cada unidade | [negocio-medagenda, @fernanda, 09:09 e 09:12] |
| P5 | Ligações de reaproveitamento falham: "a maioria não atende… na metade das vezes o horário fica vazio do mesmo jeito" | [produto-medagenda, @fernanda, 14:12] |
| P6 | Reocupação de cancelamentos <24h é de apenas 11% (vs. ~60% com +48h de antecedência) | [produto-medagenda, @pedro, 14:13] |
| P7 | Quando uma consulta é cancelada no sistema, nada acontece: "o cancelamento é um UPDATE e fim" — sem evento, sem lista, sem notificação | [tecnologia-medagenda, @bruno, 10:06] |

## 2. Hipóteses (não validadas — não tratar como decisão)

| # | Hipótese | Evidência |
|---|---|---|
| H1 | Lista de espera formal: paciente registra interesse por especialidade e é avisado quando vaga | [produto-medagenda, @lucas, 14:16] |
| H2 | Antecipação ativa: oferecer horário vago a quem já tem consulta futura | [produto-medagenda, @lucas, 14:16] |
| H3 | Confirmação prévia 48h antes reduziria cancelamentos de última hora | [negocio-medagenda, @roberto, 09:25; produto-medagenda, @pedro, 14:18] |
| H4 | Interesse do paciente deveria expirar com o tempo | [produto-medagenda, @fernanda, 14:27] |
| H5 | Paciente precisa declarar janela de disponibilidade, senão o aviso vira spam | [produto-medagenda, @lucas, 14:26] |
| H6 | SLA de resposta à oferta (~15 min) — explicitamente um "chute do produto" a validar no piloto | [produto-medagenda, @pedro, 14:23; tecnologia-medagenda, @rafael, 10:30] |

## 3. Necessidades

- **Negócio**: reduzir desperdício de horários e trabalho manual; valor rápido ("prefiro algo imperfeito funcionando em semanas") [negocio-medagenda, @mariana, 09:31]; piloto em uma unidade [idem].
- **Operação/Recepção**: solução não pode aumentar carga da recepção ("qualquer solução que exija a recepcionista ligando para vinte pacientes… não fica de pé") [negocio-medagenda, @roberto, 09:15]; a fila deve viver no sistema, não em planilha paralela [produto-medagenda, @fernanda, 14:33]; integrada à tela de agendamento [tecnologia-medagenda, @bruno, 10:29].
- **Produto**: métricas de sucesso definidas antes de construir [produto-medagenda, @pedro, 14:29]; validação com usuários/piloto manual antes de automatizar [produto-medagenda, @lucas, 14:32].
- **Pacientes** (relatado): demanda real por antecipação — 63 pacientes ativos na planilha informal de uma única unidade [produto-medagenda, @pedro, 14:02].

## 4. Decisões já tomadas (explícitas nas conversas)

| # | Decisão | Evidência |
|---|---|---|
| D1 | Produto investiga antes de qualquer solução; nada decidido em sala | [negocio-medagenda, @mariana, 09:27] |
| D2 | Restrição de orçamento: incremento no sistema atual, não plataforma nova | [negocio-medagenda, @roberto, 09:30] |
| D3 | Overbooking descartado | [produto-medagenda, @fernanda, 14:19; @juliana, 14:20] |
| D4 | Sem IA generativa em regra determinística (ordenação de fila = `ORDER BY`, auditável) — "unânime, registra como ADR" | [tecnologia-medagenda, @bruno, 10:24; @rafael, 10:26] |
| D5 | Sem microsserviços/mensageria para o volume atual; se precisar de assíncrono, outbox simples | [tecnologia-medagenda, @andre, 10:15; @bruno, 10:16; @camila, 10:18] |
| D6 | Fase 1 sem eventos e sem notificação: "CRUD honesto" com autorização, auditoria e UI da recepção | [tecnologia-medagenda, @camila, 10:18 e 10:32] |
| D7 | Confirmação de vaga reusa o mecanismo de agendamento existente (transação + exclusion constraint) | [tecnologia-medagenda, @bruno, 10:09] |
| D8 | Proposta técnica: oferta **sem trava** de vaga; quem confirma primeiro leva (trava com expiração = otimização futura) | [tecnologia-medagenda, @bruno, 10:12; @rafael, 10:13] |

## 5. Contradições e divergências

| # | Divergência | Lados | Evidência |
|---|---|---|---|
| C1 | O que atacar primeiro | Fernanda: reaproveitar horário vago (cancelamento sempre existirá) × Roberto: confirmação antecipada (atacar a causa) | [negocio-medagenda, 09:24–09:26] |
| C2 | Ocupação está boa ou não | Relatório diz 82% × realidade da ponta (indicador não mede realizado) | [negocio-medagenda, 09:03–09:04] |
| C3 | Oferta trava a vaga? | Travar bloqueia 15 min preciosos × não travar frustra quem confirma em segundo | [tecnologia-medagenda, @camila 10:10, @andre 10:11, @bruno 10:12] |
| C4 | Síncrono × assíncrono | André: síncrono basta para o volume × Bruno: pós-cancelamento não pode degradar o request do cancelamento → outbox | [tecnologia-medagenda, 10:15–10:16] |

## 6. Riscos

- **Negócio**: decidir investimento sem número real de perda (pendência do Roberto) [negocio-medagenda, 09:06–09:07]; scope creep além do orçamento — "sou eu que vou dizer não" [tecnologia-medagenda, @camila, 10:28].
- **Produto/UX**: oferta simultânea gera conflito entre pacientes ("briga feia") [produto-medagenda, @fernanda, 14:22]; aviso sem janela de disponibilidade vira spam [@lucas, 14:26]; ferramenta que aumenta cliques da recepção será abandonada [negocio-medagenda, @fernanda, 09:38].
- **Técnico**: duas confirmações simultâneas para a mesma vaga [produto-medagenda, @juliana, 14:24]; duplicidade de interesse na fila (unique constraint parcial) [tecnologia-medagenda, @andre, 10:27].
- **Privacidade/Conformidade**: preferência de especialidade é dado de saúde sensível — exige controle de acesso por perfil, auditoria e expurgo do expirado [tecnologia-medagenda, @camila, 10:21]; comunicação com paciente exige consentimento de canal [@andre, 10:22; negocio-medagenda, @roberto, 09:35].

## 7. Questões abertas

| # | Questão | Dono sugerido | Evidência |
|---|---|---|---|
| Q1 | Quantificar perda de faturamento com cancelamentos (premissas explícitas) | Roberto | [negocio-medagenda, 09:34] |
| Q2 | Demanda real de antecipação por semana (dados da planilha do centro) | Fernanda | [negocio-medagenda, 09:33] |
| Q3 | Política de expiração do interesse (prazo) | Produto | [tecnologia-medagenda, @rafael, 10:30] |
| Q4 | Canal de notificação da fase 2 (custo, consentimento, privacidade) | Produto + Tecnologia | [tecnologia-medagenda, @rafael, 10:30] |
| Q5 | SLA da oferta (15 min é chute; validar no piloto) | Produto | [tecnologia-medagenda, @rafael, 10:30] |
| Q6 | Paciente pode ter interesse em mais de uma especialidade? (proposta: sim; duplicado na mesma, não) | Produto | [tecnologia-medagenda, @andre, 10:27] |
| Q7 | Confirmação prévia de consultas entra no escopo? | Produto (depende de C1) | [produto-medagenda, @juliana, 14:37] |

## 8. Encaminhamento

Próximo passo da esteira: `/discovery-brief` (BMAD Analyst) usando esta síntese
e as transcrições como fonte primária.
