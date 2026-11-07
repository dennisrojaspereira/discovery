---
description: Executa a esteira completa de discovery (com pontos de aprovação)
---

# /discovery-completo

Execute a esteira completa, na ordem, **parando nos pontos de aprovação**:

1. `/discovery-importar` — síntese das conversas do Mattermost com evidências.
2. `/discovery-brief` — Product Brief (BMAD Analyst). **⏸ aprovação do usuário.**
3. `/discovery-prd` — PRD (BMAD PM). **⏸ aprovação do usuário.**
4. `/discovery-arquitetura` — AS-IS, TO-BE e ADRs. **⏸ aprovação do usuário.**
5. `/discovery-backlog` — épico e histórias com Gherkin. **⏸ aprovação do usuário.**
6. `/discovery-publicar` — publica docs e backlog no Plane, notifica Mattermost.

A implementação (`/discovery-implementar`) NÃO faz parte deste comando:
é disparada separadamente, escolhendo uma história publicada.

Em cada ponto de aprovação: apresente o artefato, aguarde o usuário aprovar ou
pedir ajustes. Se houver ajustes, refaça e apresente de novo antes de seguir.
