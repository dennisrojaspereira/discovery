---
title: Síntese das conversas de discovery — Caso "no-show" (faltas sem aviso)
status: concluído
caso: no-show
fonte: Mattermost (canais negocio-, produto- e tecnologia-no-show)
gerado-por: /discovery-importar (via /discovery-novo-caso)
data: 2026-11-07
---

# Síntese — Caso "no-show": pacientes que faltam sem avisar

Consolidação das três reuniões do caso. Evidências no formato
`[canal, @autor, HH:MM]`. Esta síntese não propõe solução; alimenta o
`/discovery-brief` do caso.

## 1. Problemas

| # | Problema | Evidência |
|---|---|---|
| P1 | Falta sem aviso não dá chance de reação: "aquele horário morreu sem nem avisar que ia morrer" | [negocio-no-show, @fernanda, 08:32] |
| P2 | **O dado não existe**: a recepção não registra falta; a consulta fica "agendada para sempre" | [negocio-no-show, @fernanda, 08:34] |
| P3 | Relatórios mensais misturam consulta realizada com falta | [negocio-no-show, @roberto, 08:35; @fernanda, 08:36] |
| P4 | Estimativas sem medição: 5–10% dos agendamentos (negócio), ~7% em amostra improvisada de 2 semanas (produto) | [negocio-no-show, @fernanda, 08:36; produto-no-show, @pedro, 15:02] |
| P5 | Falta não aciona a lista de espera (ninguém liberou o horário): "é o pior dos mundos" | [negocio-no-show, @roberto, 08:39] |
| P6 | Médico ocioso em horário nobre; reclamações do corpo clínico | [negocio-no-show, @fernanda, 08:40] |
| P7 | `NO_SHOW` existe no schema desde o início mas é **estado órfão**: sem endpoint, sem transição, sem tela | [tecnologia-no-show, @camila, 10:02] |

## 2. Padrões observados (amostra pequena — tratar como indicativo)

- Primeira consulta de paciente novo falta quase o dobro de retornos; segunda-feira de manhã é o pior horário; antecedência >20 dias falta mais [produto-no-show, @pedro, 15:02].
- Reincidentes são minoria conhecida "pelo nome" no balcão — mas sem registro, "reincidente" é "fofoca de balcão" [produto-no-show, @fernanda, 15:20; @pedro, 15:22].
- Benchmark externo: taxa de resposta a lembrete 40–60% ⇒ metade do silêncio é gente que vem [produto-no-show, @pedro, 15:18].

## 3. Hipóteses (não validadas)

| # | Hipótese | Evidência |
|---|---|---|
| H1 | Lembrete simples (48h/24h) reduz o "esqueci" | [produto-no-show, @pedro, 15:13] |
| H2 | Lembrete com confirmação; "não vou" alimenta a lista de espera já pilotada | [negocio-no-show, @roberto, 08:47] |
| H3 | Política de consequência para faltante crônico (caução/bloqueio/pré-pagamento) | [negocio-no-show, @roberto, 08:44; produto-no-show, @fernanda, 15:20] |
| H4 | Silêncio sem punição automática: "não confirmou" só sinaliza para a recepção decidir (humano no circuito) | [produto-no-show, @lucas, 15:17] |
| H5 | E-mail como canal de piloto (custo zero) antes de SMS/WhatsApp pagos | [tecnologia-no-show, @camila, 10:16] |

## 4. Decisões já tomadas

| # | Decisão | Evidência |
|---|---|---|
| D1 | **Fase 1 = instrumentação**: registrar a falta e medir, antes de qualquer lembrete/multa | [negocio-no-show, @fernanda, 08:54; @roberto, 08:56; tecnologia-no-show, @rafael, 10:25] |
| D2 | Sem multa generalizada; separar "quem esquece" de "faltante crônico" | [negocio-no-show, @fernanda, 08:42/08:45; @mariana, 08:46] |
| D3 | Sem regra automática punindo silêncio sem dados de taxa de resposta | [negocio-no-show, @mariana, 08:50; produto-no-show, 15:17–15:18] |
| D4 | Sobreagendamento vetado (de novo) | [produto-no-show, @fernanda, 15:14] |
| D5 | Marcação de falta: update condicional (só se `SCHEDULED`), validação temporal invertida (só após início + tolerância parametrizável), 409 em corrida — reusa padrão existente, sem outbox nesta fase | [tecnologia-no-show, @bruno, 10:04; @camila, 10:06; @andre, 10:11; @bruno, 10:12] |
| D6 | Reversão de falta: explícita, auditada, com motivo; `NO_SHOW→SCHEDULED` apenas (nunca direto a `COMPLETED`) | [tecnologia-no-show, @bruno, 10:08] |
| D7 | Sem IA preditiva de no-show: variáveis viram regra explícita auditável (reafirma ADR-003) | [tecnologia-no-show, @bruno, 10:17] |
| D8 | Orçamento: incremento no MedAgenda; custo por mensagem entra na conta antes de prometer canal pago | [negocio-no-show, @roberto, 08:52] |

## 5. Contradições e divergências

| # | Divergência | Lados | Evidência |
|---|---|---|---|
| C1 | Política de consequência | Fernanda: multa destrói relação com o público da clínica × Roberto: caução em especialidades de fila longa é justiça com quem espera | [negocio-no-show, 08:42–08:44] |
| C2 | Janela de reversão da falta | Bruno: até o fim do dia × Camila: 24–48h parametrizável (fechamento de caixa no dia seguinte) — produto decide | [tecnologia-no-show, 10:08–10:10] |
| C3 | Medir vs. agir | Fernanda/consenso: começar medindo × Roberto: "medir sem nunca agir é conforto estatístico" — exige prazo para decisão da fase 2 | [negocio-no-show, 08:54–08:56] |

## 6. Riscos

- **Operacional/UX**: botão de falta não adotado se não couber no fluxo do balcão (desenho de 1 clique na agenda do dia) [produto-no-show, @lucas, 15:10; @fernanda, 15:11]; marcação errada constrange paciente — reversão obrigatória [produto-no-show, @fernanda, 15:11]; excesso de lembretes vira spam [produto-no-show, @fernanda, 15:28].
- **Privacidade**: contador/histórico de faltas é dado sensível — visível só a RECEPCAO/ADMIN, nunca em log; motivo em texto livre sem informação clínica; direito do paciente de conhecer e contestar o próprio histórico (autor + timestamp + reversão auditada) [tecnologia-no-show, @camila, 10:19].
- **Consentimento**: canal de lembrete exige consentimento registrado (campo inexistente hoje — trabalho de LGPD antes de código) [tecnologia-no-show, @andre, 10:15].
- **Dados**: faltas anteriores à feature não existem — painel começa do zero; comunicar que "a régua vale a partir do deploy" [tecnologia-no-show, @bruno, 10:24].
- **Escopo**: lembrete/confirmação/consentimento entrando "de carona" na fase 1 [tecnologia-no-show, @camila, 10:23].

## 7. Questões abertas

| # | Questão | Dono | Evidência |
|---|---|---|---|
| Q1 | Tolerância de atraso antes de permitir marcar falta (minutos) | Produto + Fernanda | [tecnologia-no-show, @camila, 10:06] |
| Q2 | Janela de reversão (fim do dia × 24–48h) e quem reverte após o prazo | Produto decide (C2) | [tecnologia-no-show, @rafael, 10:10] |
| Q3 | Prazo para leitura dos dados e decisão da fase 2 (exigência do Roberto) | Mariana/Roberto | [negocio-no-show, 08:56–08:57] |
| Q4 | Custo por mensagem de SMS/WhatsApp vs. e-mail no piloto | Roberto + Tecnologia | [negocio-no-show, 08:52; tecnologia-no-show, 10:15–10:16] |
| Q5 | Definição operacional de "faltante crônico" (N faltas em quanto tempo) | Produto | [produto-no-show, 15:20–15:22] |

## 8. Encaminhamento

Próximo passo: `/discovery-brief` do caso (ponto de aprovação antes do PRD).
Gancho de arquitetura já identificado: o estado órfão `NO_SHOW` (P7) torna a
fase 1 pequena — transição + reversão + botão + métricas, zero infra nova.
