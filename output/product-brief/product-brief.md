---
title: "Product Brief: Otimização da agenda médica — MedAgenda"
status: aprovado-para-prd
created: 2026-11-07
updated: 2026-11-07
gerado-por: /discovery-brief (BMAD Analyst — bmad-product-brief)
fontes: demo/transcripts/*, output/discovery/sintese-conversas.md
---

# Product Brief: Otimização da agenda médica (MedAgenda)

## Sumário executivo

A Rede Clínicas Vida+ perde horários de consulta todos os dias para um problema
com dois tempos: pacientes cancelam em cima da hora e, quando o horário vaga,
não há mecanismo para encontrar outro paciente a tempo. A reocupação de
cancelamentos com menos de 24 horas é de apenas **11%**, contra ~60% quando há
48 horas de antecedência [produto, @pedro, 14:13]. Enquanto isso, existe demanda
reprimida comprovada: **63 pacientes** pediram espontaneamente, numa única
unidade, para serem avisados se surgisse vaga — hoje anotados em planilha e
grupo de WhatsApp, sem padrão entre unidades [produto, @pedro, 14:02; negócio,
@fernanda, 09:12].

Este brief propõe formalizar essa demanda dentro do MedAgenda: uma **lista de
espera** nativa do sistema de agendamento, construída incrementalmente, começando
pelo registro estruturado de interesse e visibilidade para a recepção — sem
notificações, sem automação de oferta e sem IA na primeira fase. A aposta é
converter o improviso atual em um fluxo auditável que, nas fases seguintes,
permita reocupar horários liberados com o mínimo de trabalho manual.

O momento é agora porque o custo do status quo, ainda que não quantificado com
precisão (estimativa assumidamente especulativa de 5–10% do faturamento
[negócio, @roberto, 09:06]), é visível a olho nu pela CEO ("agenda cheia no
sistema, consultório vazio" [negócio, @mariana, 09:00]) — e porque a solução
mínima cabe no orçamento disponível: "estimativa de dias, não semanas"
[tecnologia, @camila, 10:32].

## O problema

- Quando um paciente desmarca, o horário "simplesmente morre" [negócio,
  @fernanda, 09:02]. No sistema, o cancelamento "é um UPDATE e fim" — nada
  acontece depois [tecnologia, @bruno, 10:06].
- A recuperação é artesanal: a recepcionista abre uma planilha e liga um por um;
  a maioria não atende; "na metade das vezes o horário fica vazio do mesmo
  jeito" [produto, @fernanda, 14:12].
- O indicador oficial de ocupação (82%) mente: conta agendado, não realizado
  [negócio, @fernanda, 09:04].
- O custo de oportunidade é duplo: horário ocioso + paciente esperando três
  semanas por vaga na mesma especialidade [negócio, @fernanda, 09:14].

**Quem sente:** a recepção (trabalho manual e broncas), o negócio (faturamento
perdido não medido), e o paciente (espera desnecessária).

## A solução proposta

Formalizar a lista de espera **dentro** do MedAgenda, em três fases incrementais
(cada fase só avança com dados da anterior):

1. **Fase 1 — Registro e visibilidade (MVP):** a recepção registra o interesse
   do paciente (especialidade, janela de disponibilidade, observação), consulta
   a fila integrada à tela de agendamento e dá baixa manualmente ao encaixar.
   Substitui a planilha. Zero automação, zero notificação.
2. **Fase 2 — Oferta e confirmação:** ao cancelar uma consulta, o sistema
   identifica interessados compatíveis e registra ofertas com expiração;
   confirmação cria a consulta pelo fluxo existente (transação + constraint de
   não-sobreposição), imune a dupla confirmação. Oferta **não** trava a vaga
   (decisão D8; alternativa documentada em ADR).
3. **Fase 3 — Notificação e métricas:** canal de notificação ao paciente (com
   consentimento) e painel de reocupação.

## Por que essa abordagem

- **Reusa o que existe:** o mecanismo anti-conflito do agendamento já resolve a
  concorrência da confirmação [tecnologia, @bruno, 10:09]. Nada de infraestrutura
  nova na fase 1; outbox simples só quando houver oferta automática (D5/D6).
- **Determinística e auditável:** ordenação da fila por regra explícita
  (`ORDER BY`), sem LLM — decisão unânime do time técnico (D4): "imagina explicar
  para o paciente que ele perdeu a vaga porque o modelo achou que sim"
  [tecnologia, @bruno, 10:24].
- **Alternativas descartadas:** overbooking (D3 — risco operacional inaceitável
  para a recepção); plataforma de comunicação omnichannel (D2 — veto de
  orçamento); mensageria/microsserviços (D5 — "matar mosca com canhão"
  [tecnologia, @andre, 10:15]).
- **Hipótese rival viva:** confirmação prévia de consultas (Roberto, C1) não foi
  descartada — fica fora do MVP e volta à mesa com os dados do piloto (Q7).

## A quem serve

- **Recepcionista (usuária primária):** precisa registrar interesse em segundos
  e ver a fila na própria tela de agendamento; "toda ferramenta nova até hoje
  aumentou nosso clique, não diminuiu" [negócio, @fernanda, 09:38] — requisito
  inegociável.
- **Gestora de atendimento:** visibilidade da demanda reprimida por especialidade.
- **Paciente (beneficiário):** consegue a consulta mais cedo sem depender de
  sorte ou insistência.
- **Negócio:** horário reocupado = receita recuperada e número para o Q1 do
  Roberto.

## Critérios de sucesso

| Métrica | Hoje | Alvo do piloto |
|---|---|---|
| Taxa de reocupação de cancelamentos <24h | 11% | ≥ 25% |
| Tempo entre cancelamento e reocupação | não medido | medido (baseline) |
| Interesses registrados no sistema (vs. planilha) | 0% | 100% na unidade piloto |
| Reclamações na recepção relacionadas a encaixe | anedótico | não aumentar (métrica de guarda [produto, @pedro, 14:29]) |

## Escopo

**Fase 1 (dentro):** cadastro de interesse (paciente + especialidade + janela +
expiração), consulta/filtragem da fila pela recepção, baixa manual com motivo,
autorização por perfil, auditoria, expurgo de expirados.

**Fora (explícito):** notificação automática (fase 3), oferta automática
(fase 2), confirmação prévia de consultas (hipótese H3/Q7), overbooking
(descartado), apps de paciente, IA generativa em regras de negócio.

## Restrições e premissas

- Orçamento: incremento no sistema atual (D2). Valor em semanas, não meses
  [negócio, @mariana, 09:31]; piloto em uma unidade.
- Privacidade: preferência de especialidade é dado sensível → acesso por perfil,
  trilha de auditoria, retenção definida (expurgo do expirado) [tecnologia,
  @camila, 10:21]. Consentimento de canal fica para a fase 2/3.
- Dependências de dados: Q1 (número da perda) e Q2 (demanda semanal real) seguem
  abertas e não bloqueiam a fase 1.

## Visão

Se funcionar, a agenda deixa de ser um grid estático e vira um mercado interno
de horários: cancelou, o sistema recoloca; o indicador de ocupação passa a medir
consulta realizada; e a recepção deixa de ser um call center improvisado para
ser gestora de exceções.

## Questões abertas herdadas (não bloqueiam o PRD)

Q1 (perda quantificada), Q2 (demanda semanal), Q3 (prazo de expiração — PRD
assumirá default parametrizável), Q5 (SLA de oferta — fase 2), Q7 (confirmação
prévia — fora do MVP).
