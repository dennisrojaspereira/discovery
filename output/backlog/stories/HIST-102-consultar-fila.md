# HIST-102 — Consultar a fila com filtros e expiração

**Fase:** 1 · **Tamanho:** P · **Requisitos:** RF-003, RF-005, RF-006 · **Regras:** RN-002, RN-005
**Evidência de origem:** [produto, @fernanda, 14:33], [tecnologia, @camila, 10:18], [produto, @fernanda, 14:27]

## Narrativa
Como **recepcionista**, quero consultar a fila de interessados filtrando por
especialidade e compatibilidade, em ordem de chegada, para encontrar rápido um
paciente para o horário que vagou.

## Escopo técnico
- `GET /waitlist/interests` com filtros `specialtyId`, `status`, `weekday`,
  `period`; ordenação fixa `createdAt ASC` (FIFO — ADR-003).
- **Expiração lazy** (ADR-004): a consulta materializa `EXPIRED` nos vencidos
  antes de responder; expirado não aparece como ativo.
- `GET /waitlist/summary?specialtyId` → `{ activeCount }` (base para HIST-104).
- Resposta inclui paciente (nome/telefone), especialidade, janela, idade do registro.

## Critérios de aceitação (Gherkin)

```gherkin
Funcionalidade: Consultar fila de espera

  Cenário: Ordem FIFO
    Dado interesses ACTIVE criados em t1 < t2 < t3 na mesma especialidade
    Quando a recepção consulta a fila da especialidade
    Então os itens vêm na ordem t1, t2, t3

  Cenário: Filtro por compatibilidade de janela
    Dado um interesse com dias [1] e turnos [MORNING]
    Quando a consulta filtra weekday=3
    Então esse interesse não aparece

  Cenário: Expiração lazy
    Dado um interesse ACTIVE com expiresAt no passado
    Quando a fila é consultada
    Então o interesse aparece como EXPIRED (se status=EXPIRED for filtrado)
    E não aparece entre os ativos
    E o contador do summary não o inclui

  Cenário: Autorização
    Dado um usuário MEDICO
    Quando consulta qualquer endpoint da fila
    Então recebe 403
```
