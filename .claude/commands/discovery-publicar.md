---
description: Publica documentos e backlog no Plane (após aprovação)
---

# /discovery-publicar

Publique os artefatos aprovados no Plane via API real.

## Pré-requisito
Backlog aprovado pelo usuário. Plane rodando (`./lab.sh status`).

## Passos

1. Publique documentos e backlog:
   ```bash
   node integrations/plane/plane.mjs publish-docs
   node integrations/plane/plane.mjs publish-backlog
   ```
   - `publish-docs` cria/atualiza páginas do projeto com: visão do produto,
     transcrições, Product Brief, PRD, AS-IS, TO-BE, ADRs e matriz de
     rastreabilidade.
   - `publish-backlog` cria o épico "Otimização da agenda médica" e as
     histórias associadas (fase 1 primeiro), com labels de fase.
2. **Verifique** as operações: o script lista IDs/URLs criados. Confirme com:
   ```bash
   node integrations/plane/plane.mjs verify
   ```
3. Poste no canal `discovery-medagenda` o resumo do que foi publicado, com links
   (`http://localhost:8080/medagenda/projects/...`).
4. Não marque como concluído sem a verificação da etapa 2.
