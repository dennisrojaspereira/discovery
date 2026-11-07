# ADR-T04 — Notificação promovida a componente interno (deixa de ser "fase 3 de cada caso")

**Status:** aceito (2026-11-07) · **Casos:** telemedicina (financiador), lista de espera, no-show · **Fase:** 3 do caso tele
**Evidência:** [tecnologia-telemedicina, @camila, 10:17; @bruno, 10:19; negocio-telemedicina, @mariana, 09:28]

## Contexto
Três casos seguidos esbarraram na mesma lacuna: o MedAgenda não envia nada ao
paciente. Lista de espera adiou ofertas, no-show adiou lembretes, e a
teleconsulta não existe sem entrega de link ("carta sem correio" [negócio,
@fernanda, 09:27]).

## Decisão
Notificação vira **componente próprio, interno ao monolito**: tabela
`notifications` (destinatário, canal, template, estado, tentativas, trilha de
envio), consumindo o outbox existente, com **e-mail como primeiro canal**.
Consentimento modelado em dois registros distintos: canal de mensagem e
atendimento remoto (versão do termo + timestamp).

## Alternativas rejeitadas
1. **Continuar como "fase 3" de cada caso**: três implementações parciais da
   mesma coisa, cada uma com seu consentimento improvisado.
2. **Microsserviço de notificação**: mesma resposta dos casos anteriores —
   infraestrutura desproporcional ao volume (dezenas/dia) e à restrição de
   orçamento (D2 do caso 1).
3. **Começar por SMS/WhatsApp**: custo por mensagem + burocracia de template/
   consentimento antes de validar a mecânica; e-mail valida barato
   [tecnologia, @camila, 10:16].

## Consequências
- (+) Um único ponto de verdade para "o que foi enviado a quem, quando, com que
  consentimento" — requisito LGPD dos três casos de uma vez.
- (+) Telemedicina financia; lista de espera e no-show herdam de graça.
- (−) Componente compartilhado cria acoplamento entre casos: mudanças exigem
  olhar os três consumidores — aceitável no monolito com testes.
