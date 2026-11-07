# ADR-T03 — Sem gravação de teleconsulta por default

**Status:** aceito (2026-11-07) · **Caso:** telemedicina
**Evidência:** [tecnologia-telemedicina, @bruno, 10:24]

## Contexto
"Alguém vai pedir" gravação das consultas — para prontuário, auditoria ou
proteção jurídica.

## Decisão
**Não gravar, por default.** As salas são efêmeras e nada é retido além do
registro administrativo da consulta (que já existe para o presencial).

## Racional
- Gravação de ato médico é **passivo jurídico e de armazenamento** com
  benefício duvidoso; muda a natureza da consulta para médico e paciente.
- Se um dia virar requisito de negócio: projeto próprio com consentimento
  específico, criptografia, política de retenção e parecer jurídico — não um
  checkbox.

## Consequências
- (+) Escopo e superfície de risco drasticamente menores; LGPD simples.
- (+) Critério de seleção do provedor fica mais barato (não precisa de storage).
- (−) Sem evidência audiovisual em disputa — mitigado pelo registro
  administrativo (quem, quando, modalidade, duração), idêntico ao presencial.
