---
description: Executa o Analyst do BMAD e gera o Product Brief
---

# /discovery-brief

Gere o Product Brief do discovery usando o workflow oficial do BMAD.

## Pré-requisito
`output/discovery/sintese-conversas.md` deve existir (senão rode `/discovery-importar`).

## Passos

1. Invoque a skill BMAD **bmad-product-brief** (Analyst). Siga o workflow do
   framework — não invente comandos internos do BMAD.
2. Use como insumos:
   - `output/discovery/sintese-conversas.md`
   - `demo/transcripts/*.md` (fonte primária)
3. Salve o resultado em `output/product-brief/product-brief.md`.
4. Requisitos do documento:
   - Todas as conclusões referenciam as transcrições (canal/autor/timestamp).
   - Separar claramente **fatos relatados** de **hipóteses**.
   - Registrar alternativas consideradas e descartadas (ex.: overbooking) e o porquê.
   - Problema central, público, impacto esperado, restrições (orçamento do Roberto,
     "valor rápido" da Mariana, carga zero para a recepção da Fernanda).
5. **Ponto de aprovação**: apresente o brief ao usuário e aguarde aprovação
   explícita antes de seguir para `/discovery-prd`.
6. Notifique o canal `discovery-medagenda` que o brief está pronto para revisão.
