# HIST-101 — Registrar interesse na lista de espera (API)

**Fase:** 1 · **Tamanho:** P · **Requisitos:** RF-001, RF-002, RF-006, RF-007 · **Regras:** RN-001, RN-003, RN-005(expiresAt)
**Evidência de origem:** [produto, @lucas, 14:16], [produto, @fernanda, 14:33], [tecnologia, @andre, 10:27]

## Narrativa
Como **recepcionista**, quero registrar o interesse de um paciente em uma
especialidade, com a janela em que ele pode comparecer, para que a demanda
reprimida saia da planilha e viva dentro do MedAgenda.

## Escopo técnico
- Modelo `WaitlistInterest` + migration com **índice único parcial**
  (`status='ACTIVE'`, par paciente+especialidade) — ver `to-be.md`.
- `WaitlistModule` (module/service/controller/DTO) seguindo o padrão dos módulos
  existentes; `expiresAt = createdAt + WAITLIST_EXPIRATION_DAYS` (default 30, env).
- Auditoria `WAITLIST_INTEREST_CREATED` sem payload clínico.
- Fora de escopo: UI (HIST-104), listagem (HIST-102), baixa (HIST-103).

## Critérios de aceitação (Gherkin)

```gherkin
Funcionalidade: Registrar interesse na lista de espera

  Cenário: Registro válido
    Dado um paciente cadastrado e a especialidade "Cardiologia"
    Quando a recepção registra interesse com dias [1,3] e turnos [MORNING]
    Então a API responde 201 com status "ACTIVE"
    E "expiresAt" é a data de criação mais o prazo configurado
    E existe auditoria "WAITLIST_INTEREST_CREATED" para o registro

  Cenário: Duplicidade na mesma especialidade
    Dado um interesse ACTIVE do paciente X em "Cardiologia"
    Quando a recepção tenta registrar outro interesse de X em "Cardiologia"
    Então a API responde 409 com mensagem clara

  Cenário: Mesmo paciente, outra especialidade
    Dado um interesse ACTIVE do paciente X em "Cardiologia"
    Quando a recepção registra interesse de X em "Dermatologia"
    Então a API responde 201

  Cenário: Concorrência no registro
    Dado duas requisições simultâneas idênticas de interesse
    Quando ambas são processadas
    Então exatamente uma responde 201 e a outra 409
    E existe apenas um interesse ACTIVE no banco

  Cenário: Janela inválida
    Quando a recepção registra interesse sem nenhum dia da semana
    Então a API responde 400

  Cenário: Autorização
    Dado um usuário com perfil MEDICO
    Quando tenta registrar um interesse
    Então a API responde 403
```
