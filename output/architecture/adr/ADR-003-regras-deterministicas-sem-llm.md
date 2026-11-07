# ADR-003 — Regras determinísticas na fila; sem IA generativa em regra de negócio

**Status:** aceito (2026-11-07) · **Decisão unânime** [tecnologia-medagenda, 10:23–10:26]

## Contexto
Produto perguntou sobre ranqueamento "inteligente" da fila e sugestões de
remarcação por LLM.

## Decisão
Ordenação e elegibilidade da lista de espera são **regras explícitas e
auditáveis**: FIFO por data de registro (RN-002) + compatibilidade de janela
declarada. Implementação: `ORDER BY createdAt` + filtros SQL. Nenhum modelo
generativo participa de decisão de negócio do agendamento.

## Racional
- Auditabilidade: "imagina explicar para o paciente que ele perdeu a vaga porque
  o modelo achou que sim" [tecnologia, @bruno, 10:24].
- Custo, latência e imprevisibilidade sem benefício mensurável (RNF-007).
- LGPD/é saúde: decisão automatizada sobre dado sensível exige explicabilidade.

## Onde IA **é** bem-vinda neste produto
No processo de engenharia (discovery, análise de conversas, geração de
documentação e código — este laboratório), não na regra determinística
[tecnologia, @camila, 10:25].

## Consequências
- (+) Fila explicável em uma frase; contestação resolvida com consulta ao log.
- (−) Sem "esperteza" de priorização; se houver demanda real (ex.: urgência
  clínica declarada), ela entra como **campo explícito com regra explícita**,
  nunca como score opaco.
