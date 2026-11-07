---
description: Importa as conversas do Mattermost e gera síntese com evidências
---

# /discovery-importar

Importe as conversas de discovery do Mattermost e consolide uma síntese com evidências rastreáveis.

## Passos

1. Leia as três conversas do Mattermost (API real, via Discovery Bot):
   ```bash
   node integrations/mattermost/mm.mjs read negocio-medagenda
   node integrations/mattermost/mm.mjs read produto-medagenda
   node integrations/mattermost/mm.mjs read tecnologia-medagenda
   ```
2. Consolide em `output/discovery/sintese-conversas.md`, com as seções:
   - **Problemas** (o que dói hoje)
   - **Hipóteses** (ainda não validadas — não tratar como decisão)
   - **Necessidades** (de negócio, de produto, da recepção)
   - **Decisões já tomadas** (explícitas nas conversas)
   - **Contradições e divergências** (quem discorda de quê)
   - **Riscos** (negócio, produto, técnico, privacidade)
   - **Questões abertas** (pendências nomeadas nas reuniões)
3. **Toda afirmação deve citar a evidência**: canal, autor e timestamp da fala
   (ex.: `[negocio-medagenda, @fernanda, 09:02]`). Nada de conclusão sem fonte.
4. Não proponha solução nesta etapa. A síntese alimenta o Analyst do BMAD
   (`/discovery-brief`).
5. Ao final, publique um resumo de 3 linhas no canal `discovery-medagenda`:
   ```bash
   node integrations/mattermost/mm.mjs post discovery-medagenda "<resumo>"
   ```
