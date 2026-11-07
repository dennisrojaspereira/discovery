---
description: Gera um caso de discovery inédito (transcrições novas via LLM) e prepara a esteira
---

# /discovery-novo-caso <tema>

Crie um caso de discovery **inédito** sobre `<tema>` (um problema vizinho do
produto MedAgenda — ex.: no-show, telemedicina, fila de exames, atrasos). Isso
prova que a esteira generaliza: o BMAD processa conversas que não existiam
antes da demonstração.

Sem argumento, proponha 3 temas plausíveis e deixe o usuário escolher.

## Passos

1. **Defina o slug** do caso (kebab-case curto, ex.: `no-show`).
2. **Gere as três transcrições** — você (o agente) é a LLM; não use API externa:
   - `demo/cases/<slug>/transcripts/01-negocio.md` (Mariana, Roberto, Fernanda)
   - `demo/cases/<slug>/transcripts/02-produto.md` (Juliana, Lucas, Fernanda, Pedro)
   - `demo/cases/<slug>/transcripts/03-tecnologia.md` (Rafael, Bruno, Camila, André)

   Regras de qualidade (as mesmas do caso original):
   - ~1.000 palavras cada; timestamps `**[HH:MM] Nome:** fala`; interrupções e
     perguntas naturais.
   - **Reusar exatamente estas personas** (já existem no Mattermost).
   - Divergências reais entre participantes; nenhuma solução fechada a priori.
   - Dados citados devem ser verossímeis mas marcados como estimativa quando for o caso.
   - O tema deve tocar o código real do MedAgenda (ex.: estados de consulta,
     disponibilidade, agendamento) para a fase de arquitetura ter substância.
3. **Publique no Mattermost** (cria os canais do caso automaticamente):
   ```bash
   node integrations/mattermost/publish-transcripts.mjs demo/cases/<slug>/transcripts <slug>
   ```
   Canais resultantes: `negocio-<slug>`, `produto-<slug>`, `tecnologia-<slug>`.
4. **Rode a esteira normalmente**, lendo os canais do caso e escrevendo em
   `output/cases/<slug>/…` (mesma estrutura: discovery/, product-brief/, prd/,
   architecture/, backlog/):
   ```bash
   node integrations/mattermost/mm.mjs read negocio-<slug>   # etc.
   ```
   Siga `/discovery-importar` → `/discovery-brief` → … respeitando os **pontos
   de aprovação**. No Plane, publique como **novo épico no mesmo projeto
   MedAgenda** (não criar outro projeto), com label `caso:<slug>`.

## Proibições

- Não reutilizar texto das transcrições de outros casos (plágio interno quebra
  a demonstração).
- Não pular os gates de aprovação.
- Não criar usuários novos no Mattermost sem necessidade.
