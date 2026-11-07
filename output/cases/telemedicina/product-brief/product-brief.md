---
title: "Product Brief: Telemedicina no MedAgenda — retornos por vídeo"
status: aguardando-aprovacao-para-prd
caso: telemedicina
created: 2026-11-07
updated: 2026-11-07
gerado-por: /discovery-brief (BMAD Analyst — bmad-product-brief)
fontes: demo/cases/telemedicina/transcripts/*, output/cases/telemedicina/discovery/sintese-conversas.md
---

# Product Brief: Telemedicina no MedAgenda (retornos por vídeo)

## Sumário executivo

A Rede Clínicas Vida+ está sendo empurrada para a telemedicina por três forças
simultâneas: um concorrente a três quarteirões anunciando consulta por vídeo, o
próprio corpo clínico pedindo para atender retornos remotamente, e um problema
assistencial silencioso — pacientes que abandonam o retorno porque a segunda
vinda à clínica "é um sacrifício", deixando tratamentos pela metade [negócio,
@fernanda, 09:03].

Este brief propõe entrar em telemedicina pelo caso de uso de **menor risco e
maior valor**: o retorno por vídeo. Não se trata de construir uma plataforma —
o vídeo é commodity contratada via API (D2); o trabalho real é fazer a agenda
do MedAgenda entender **modalidade** (presencial/vídeo) e **tipo de consulta**
(primeira/retorno), e fazer o link chegar à pessoa certa na hora certa. A
sondagem inicial é favorável: 5 de 8 médicos topariam, e 19 de 31 pacientes
prefeririam o retorno por vídeo — com a ressalva unânime do "se funcionar
direito", que é exatamente o produto a construir [produto, @pedro, 14:02].

O momento importa pela convergência com os casos anteriores: a lista de espera
(caso 1) dá destino a horários liberados, o registro de faltas (caso 2) mede o
não-comparecimento — e a telemedicina é o caso de negócio que finalmente
financia o **componente de notificação** que ambos deixaram na geladeira
[negócio, @mariana, 09:28; tecnologia, @camila, 10:17]. Pré-requisito
inegociável: **parecer jurídico/regulatório antes de qualquer agenda aberta**
(D1).

## O problema

- **Retornos perdidos**: paciente vem, faz o exame, e desiste de voltar três
  semanas depois "só para ouvir o resultado em dez minutos" — abandono de
  tratamento com perda clínica e de receita [negócio, @fernanda, 09:03].
  Dimensão desconhecida: o sistema não diferencia retorno de primeira consulta
  (P4) — terceiro caso seguido que esbarra num buraco de medição [negócio,
  @roberto, 09:07].
- **Pressão competitiva** já operante (P1) — e o concorrente resolve a entrega
  de link no improviso (WhatsApp manual do balcão) [produto, @pedro, 14:09].
- **Oferta médica represada**: profissionais dispostos a atender retornos
  remotamente hoje não têm como (P2).

**Quem sente:** o paciente que trabalha/mora longe (segunda vinda), o médico
que quer flexibilidade, o negócio que perde retorno e diferenciação.

## A solução proposta

Telemedicina como **atributo da consulta existente**, não como produto paralelo:

1. **Fase 1 — Agenda consciente de modalidade (piloto com link manual):**
   campos `modality` e `consultationType` na consulta; modalidade declarada na
   regra de disponibilidade (resolve bloco × misto por configuração de cada
   médico — H2/C1); motor de slots filtrando por modalidade; link guardado na
   consulta com acesso restrito e **reenvio em 1 clique pela recepção**.
   Piloto: retorno, uma especialidade, uma unidade, médicos voluntários,
   link enviado manualmente (valida a mecânica antes de automatizar — H4).
2. **Fase 2 — Vídeo como commodity:** provedor externo via API com salas
   efêmeras não enumeráveis; job de véspera (sobre o outbox já desenhado no
   caso 1) cria a sala, guarda o link e dispara o envio.
3. **Fase 3 — Notificação como componente:** serviço interno de mensagens
   (e-mail primeiro) com os **dois consentimentos** distintos — canal de
   mensagem e atendimento remoto (com versão do termo e timestamp) — servindo
   também aos casos lista de espera e no-show (D8).

## Por que essa abordagem

- **Não construímos vídeo** (D2): WebRTC em produção "é um ofício próprio"
  [tecnologia, @bruno, 10:11]; o diferencial da clínica é a jornada, não o codec.
- **Configuração em vez de decisão única**: a divergência bloco dedicado ×
  agenda mista (Roberto × Fernanda, Dra. Paula × Dr. Miguel) se dissolve com
  modalidade por regra de disponibilidade — cada médico escolhe [tecnologia,
  @bruno, 10:04].
- **Coerência entre casos**: falta em teleconsulta usa a mesma transição
  `NO_SHOW` do caso 2 (D9); o job de véspera reusa o outbox do caso 1 — "terceira
  vez seguida que o desenho anterior nos poupa trabalho" [tecnologia, @rafael, 10:28].
- **Alternativas descartadas**: plataforma/suíte hospitalar (custo, D2);
  ferramenta de reunião genérica da conta corporativa (privacidade — mistura
  dado de paciente com operação [tecnologia, @camila, 10:12]); gravação de
  consultas por default (passivo jurídico — D10, vira ADR); WhatsApp como canal
  "resolve e pronto" (link identifica especialidade do paciente — C3).

## A quem serve

- **Paciente de retorno** (beneficiário primário): resolve em 10 minutos o que
  custava meio dia — sempre por **opção**, nunca por imposição; presencial
  permanece disponível (risco de inclusão digital).
- **Recepcionista**: seletor de modalidade no fluxo que já conhece, badge
  inconfundível na agenda, link visível e reenviável — o suporte de primeira
  hora é dela, e o desenho precisa protegê-la [produto, @fernanda, 14:08].
- **Médico voluntário**: blocos remotos ou agenda mista, à sua escolha.
- **Negócio**: retenção de retorno, paridade competitiva e o financiamento do
  componente de notificação.

## Critérios de sucesso (piloto)

| Métrica | Hoje | Alvo/uso |
|---|---|---|
| Adoção: % de retornos elegíveis agendados como vídeo | — | medir; meta a definir pós-piloto |
| Sucesso técnico: teleconsultas concluídas sem reagendamento por falha | — | ≥ 90% ("funcionar direito" virando número) |
| No-show vídeo × presencial | — | comparar (H5) |
| Recuperação de retorno (exige `consultationType`) | não medível | baseline criada |
| Carga no balcão (chamados de suporte por teleconsulta) | — | métrica de guarda |

## Escopo

**Fase 1 (dentro):** `modality` + `consultationType`; modalidade na regra de
disponibilidade; filtro no motor de slots; validação "vídeo só para retorno"
**parametrizada** (D6); campo de link com acesso restrito + reenvio manual;
badge/seletor na UI; falta de teleconsulta via fluxo NO_SHOW existente.

**Fora (explícito):** construir/hospedar vídeo; gravação de consultas (D10);
notificação automática (fase 3); prescrição/documentos digitais; app de
paciente; telemedicina de primeira consulta (H1 — aguarda parecer e piloto);
qualquer abertura de agenda antes do parecer jurídico (D1).

## Restrições e premissas

- **Jurídico no caminho crítico** (D1/Q1): consentimento de atendimento remoto
  com versão e timestamp; situações vedadas; registro exigido. Sem parecer, sem
  código de consulta.
- **Orçamento**: incremento no MedAgenda + assinatura de provedor de vídeo; sem
  microsserviços (D8 mantém componente interno ao monolito).
- **Privacidade**: link = dado sensível por inferência (D7) — fora de logs,
  salas efêmeras, perfis restritos.
- **Dependência externa nova**: provedor de vídeo exige plano B operacional
  (telefone/reagendamento) [tecnologia, @camila, 10:26].
- **Preço**: hipótese de paridade com presencial (H3/C2) — decisão de negócio
  no piloto, fora do software.

## Visão

Se o piloto confirmar, a modalidade vira dimensão natural da agenda — qualquer
consulta elegível pode ser remota, a notificação vira infraestrutura da clínica
(lembretes do caso no-show, ofertas da lista de espera, links de teleconsulta no
mesmo componente), e a clínica deixa de competir por localização para competir
por conveniência.

## Questões abertas herdadas (não bloqueiam o PRD; Q1 bloqueia o deploy)

Q1 parecer jurídico · Q2 preço · Q3 provedor de vídeo · Q4 canal do link no
piloto · Q5 fluxo dos dois consentimentos · Q6 demanda represada de retorno.
