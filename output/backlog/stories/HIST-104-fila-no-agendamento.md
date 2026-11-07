# HIST-104 — Fila visível no fluxo de agendamento (Web)

**Fase:** 1 · **Tamanho:** M · **Requisitos:** RF-008; RNF-001
**Evidência de origem:** [tecnologia, @bruno, 10:29], [negócio, @fernanda, 09:38]

## Narrativa
Como **recepcionista**, quero ver na tela de agendamento quantos pacientes
esperam vaga na especialidade selecionada e abrir a fila em um clique, para que
a lista de espera entre no meu fluxo, e não o contrário.

## Escopo técnico
- Página `/lista-espera`: tabela da fila (filtros, FIFO, badges de status),
  registro de interesse em diálogo (≤ 5 interações — RNF-001), ações de baixa.
- No diálogo "Agendar consulta": badge com `activeCount` da especialidade
  selecionada (via `GET /waitlist/summary`) + link para a fila filtrada.
- Item "Lista de espera" na navegação lateral.
- Depende de HIST-101/102/103 (consome os endpoints).

## Critérios de aceitação (Gherkin)

```gherkin
Funcionalidade: Fila integrada à UI de agendamento

  Cenário: Contador no agendamento
    Dado 3 interesses ACTIVE em "Cardiologia"
    Quando a recepção abre "Agendar consulta" e seleciona "Cardiologia"
    Então vê o indicador "3 na lista de espera" com link para a fila

  Cenário: Registro rápido
    Quando a recepção registra um interesse pela UI
    Então o fluxo exige no máximo 5 interações
    E o novo interesse aparece na fila sem recarregar a página

  Cenário: Baixa pela UI
    Dado um interesse ACTIVE na fila
    Quando a recepção clica em "Atendido" e seleciona a consulta criada
    Então o item muda para FULFILLED com feedback visual
```
