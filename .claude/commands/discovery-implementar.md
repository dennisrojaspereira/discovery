---
description: Implementa uma história real do Plane e abre PR no Forgejo
---

# /discovery-implementar

Implemente uma história do backlog publicado, de ponta a ponta. Argumento
opcional: o ID da história (ex.: `HIST-101`); sem argumento, use a menor
história pendente da fase 1.

## Fluxo obrigatório

1. **Consultar a história no Plane**:
   ```bash
   node integrations/plane/plane.mjs get-story <HIST-xxx>
   ```
2. **Localizar os requisitos** citados pela história no PRD
   (`output/prd/prd.md`) e as notas no TO-BE (`output/architecture/to-be.md`).
3. **Analisar o código** existente nos módulos afetados antes de escrever
   qualquer linha.
4. **Criar branch**: `feature/<hist-id>-<slug-curto>` a partir de `main`.
5. **Implementar** seguindo os padrões do repositório (NestJS: módulo/service/
   controller/DTO; auditoria em mutações; autorização por perfil; validação).
   Migrations Prisma quando houver mudança de schema.
6. **Testar**: criar testes e2e cobrindo os critérios Gherkin da história e rodar:
   ```bash
   npm run build --workspace apps/medagenda-api && npm run test:e2e --workspace apps/medagenda-api
   ```
   Todos os testes (novos e antigos) devem passar.
7. **Commit** com mensagem referenciando a história (`HIST-xxx`).
8. **Publicar branch**:
   ```bash
   node integrations/forgejo/forgejo.mjs push <branch>
   ```
9. **Abrir Pull Request** (base `main`):
   ```bash
   node integrations/forgejo/forgejo.mjs pr <branch> "<título>" "<corpo com HIST-xxx, requisitos e evidência dos testes>"
   ```
10. **Notificar** o canal `entregas-medagenda` com link do PR e resumo.
11. Mover a história no Plane para "In Review" se a API permitir.

## Proibições
- **Nunca** fazer merge do PR (revisão é humana).
- Não implementar além do escopo da história.
- Não declarar concluído sem a saída real dos testes.
