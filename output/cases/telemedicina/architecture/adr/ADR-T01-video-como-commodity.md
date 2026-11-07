# ADR-T01 — Vídeo como commodity contratada via API (nunca construir/hospedar)

**Status:** aceito (2026-11-07) · **Caso:** telemedicina · **Fase:** 2
**Evidência:** [negocio-telemedicina, @roberto, 09:25; tecnologia-telemedicina, @bruno, 10:11; @camila, 10:12]

## Contexto
Teleconsulta exige salas de vídeo. Opções: construir (WebRTC próprio), suíte
hospitalar completa, ferramenta de reunião genérica da conta corporativa, ou
provedor de salas via API.

## Decisão
**Provedor de salas prontas via API**: criar sala efêmera, obter link, expirar.
O MedAgenda orquestra (agenda, link, notificação); o vídeo é commodity.

Critérios de seleção (da privacidade, não do preço): salas efêmeras com nome
não enumerável, sem exigir conta do paciente, contrato com confidencialidade
adequada a dados de saúde.

## Alternativas rejeitadas
1. **Construir WebRTC**: "é um ofício próprio — TURN, qualidade adaptativa,
   eco" [tecnologia, @bruno, 10:11]. Custo permanente fora do core.
2. **Suíte hospitalar**: fere a restrição de orçamento (incremento, não
   plataforma) [negócio, @roberto, 09:25].
3. **Ferramenta de reunião da conta corporativa**: mistura dado de paciente com
   operação da empresa; links/relatórios na tenancy errada [tecnologia,
   @camila, 10:12].

## Consequências
- (+) Fase 1 nem toca em vídeo (link manual); fase 2 é integração fina.
- (−) Dependência externa nova (primeira fora do Docker local): exige plano B
  operacional (telefone/reagendamento) e monitoramento do provedor.
