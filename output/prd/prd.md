---
title: "PRD: Lista de espera e otimização da agenda — MedAgenda"
status: aprovado-para-arquitetura-e-backlog
versao: 1.0.0
created: 2026-11-07
updated: 2026-11-07
gerado-por: /discovery-prd (BMAD PM — bmad-prd)
fontes: output/product-brief/product-brief.md, demo/transcripts/*, output/discovery/sintese-conversas.md
---

# PRD — Lista de espera e otimização da agenda médica

> Convenções: `RF-xxx` requisito funcional · `RNF-xxx` não funcional · `RN-xxx`
> regra de negócio. IDs são **estáveis** (nunca renumerar). Cada requisito marca
> origem: **[APROVADO]** (decisão explícita nas conversas/aprovação) ou
> **[HIPÓTESE]** (aguarda validação/piloto). Evidências: `[canal, @autor, HH:MM]`.

## 1. Contexto

O MedAgenda gerencia médicos, especialidades, pacientes, disponibilidade e
consultas, com proteção transacional contra conflito de horários. Cancelamentos,
porém, encerram o fluxo: o horário liberado não é reaproveitado (síntese P1/P7).
A recuperação acontece fora do sistema, em planilhas e WhatsApp (P4), com
reocupação de apenas 11% nos cancelamentos <24h (P6).

## 2. Problema

Horário liberado em cima da hora não encontra paciente disponível a tempo,
gerando ociosidade com demanda reprimida comprovada (63 interessados em uma
unidade). Agravantes: processo manual sobrecarrega a recepção (P5) e o indicador
de ocupação não mede consulta realizada (P2).

## 3. Objetivos

| ID | Objetivo | Métrica | Alvo piloto |
|---|---|---|---|
| OBJ-1 | Reocupar horários cancelados | Taxa de reocupação <24h | 11% → ≥25% |
| OBJ-2 | Eliminar a planilha paralela | Interesses registrados no sistema | 100% unidade piloto |
| OBJ-3 | Não aumentar carga da recepção | Reclamações/tempo por registro | Guarda: não piorar |
| OBJ-4 | Medir o que hoje não se mede | Baseline tempo-até-reocupação | Existir |

## 4. Usuários

- **Recepcionista** (perfil RECEPCAO): registra interesse, consulta fila, dá baixa.
- **Administrador** (ADMIN): tudo da recepção + configuração e auditoria.
- **Médico** (MEDICO): sem acesso à fila na fase 1 (sem necessidade identificada).
- **Paciente**: beneficiário; **não** acessa o sistema na fase 1.

## 5. Jornada (fase 1)

1. Paciente liga pedindo consulta; não há horário próximo na especialidade.
2. Recepcionista oferece entrar na lista de espera; coleta janela de
   disponibilidade e registra no sistema (≤ 30 segundos).
3. Surge um cancelamento: recepcionista abre a fila filtrada pela especialidade
   do médico, vê interessados compatíveis ordenados, liga para o primeiro.
4. Paciente aceita → recepcionista agenda pelo fluxo normal e dá **baixa** no
   interesse (motivo: atendido). Recusou/mudou → registra o motivo e segue ao próximo.
5. Interesses não atendidos expiram automaticamente após o prazo configurado.

## 6. Escopo

**Fase 1 (este PRD detalha):** RF-001…RF-008 — registro, consulta, baixa,
expiração, autorização, auditoria, UI integrada.

**Fase 2 [HIPÓTESE]:** identificação de horários liberados; convite/oferta com
expiração; confirmação segura (RF-101…RF-104, esboço).

**Fase 3 [HIPÓTESE]:** notificações com consentimento; métricas de ocupação
(RF-201…RF-202, esboço).

## 7. Fora de escopo

- Notificação automática em qualquer canal (fase 3) — [negócio, @roberto, 09:19]
- Oferta/antecipação automática (fase 2)
- Confirmação prévia de consultas — hipótese rival viva (Q7) [produto, @juliana, 14:37]
- Overbooking — descartado (D3) [produto, @fernanda, 14:19]
- IA generativa em regras de negócio — vetado (D4) [tecnologia, 10:24–10:26]
- Acesso do paciente ao sistema; apps móveis

## 8. Requisitos funcionais — Fase 1

### RF-001 [APROVADO] Registrar interesse na lista de espera
A recepção registra interesse de um paciente contendo: paciente (existente),
especialidade, janela de disponibilidade (dias da semana + turnos manhã/tarde),
observação livre opcional (máx. 300), médico preferido opcional.
Origem: [produto, @lucas, 14:16; @fernanda, 14:33]. Evidência de demanda: P6/P4.

### RF-002 [APROVADO] Impedir duplicidade de interesse
Não pode existir mais de um interesse **ativo** do mesmo paciente na mesma
especialidade. Especialidades diferentes são permitidas.
Origem: [tecnologia, @andre, 10:27] (Q6 resolvida: proposta do André acatada).

### RF-003 [APROVADO] Consultar a fila
Listar interesses com filtros por especialidade, status e compatibilidade de
janela; ordenação **determinística**: data de registro (FIFO) — sem score, sem
IA (D4). Exibir: paciente, contato, especialidade, janela, idade do registro.
Origem: [produto, @fernanda, 14:33; tecnologia, @camila, 10:18].

### RF-004 [APROVADO] Dar baixa em um interesse
Estados: `ACTIVE → FULFILLED` (atendido, vinculando a consulta criada) ou
`ACTIVE → CANCELLED` (desistiu/indisponível, com motivo obrigatório).
Origem: jornada da recepção [produto, 14:07–14:13].

### RF-005 [APROVADO] Expiração automática
Interesse `ACTIVE` expira após N dias (default **30**, parametrizável) →
`EXPIRED`. Fase 1: expiração avaliada na leitura/consulta (lazy), sem job.
Origem: [produto, @fernanda, 14:27] (H4 acatada; Q3: default a validar).

### RF-006 [APROVADO] Autorização por perfil
ADMIN e RECEPCAO: CRUD completo da fila. MEDICO: sem acesso na fase 1.
Origem: [tecnologia, @camila, 10:21].

### RF-007 [APROVADO] Auditoria
Toda mutação da fila gera registro de auditoria (quem, quando, o quê) **sem
dados clínicos no payload**. Origem: [tecnologia, @camila, 10:21].

### RF-008 [APROVADO] Fila visível no fluxo de agendamento
Na tela de agendamento, ao selecionar especialidade, a recepção vê o contador
de interessados ativos compatíveis e acessa a fila em 1 clique.
Origem: [tecnologia, @bruno, 10:29; negócio, @fernanda, 09:38].

## 9. Requisitos funcionais — Fases 2 e 3 (esboço)

- **RF-101 [HIPÓTESE]** Ao cancelar consulta, listar interesses compatíveis com o
  slot liberado (especialidade do médico + janela).
- **RF-102 [HIPÓTESE]** Registrar oferta a um interessado com expiração (SLA
  default 15 min — Q5, validar) [produto, @pedro, 14:23].
- **RF-103 [HIPÓTESE]** Confirmação da oferta cria a consulta pelo fluxo padrão;
  oferta **não trava** a vaga; segunda confirmação concorrente recebe recusa
  clara (D8) [tecnologia, @bruno, 10:12].
- **RF-104 [HIPÓTESE]** Evento de cancelamento via outbox transacional (D5)
  [tecnologia, @bruno, 10:16].
- **RF-201 [HIPÓTESE]** Notificação ao paciente com consentimento de canal
  [tecnologia, @andre, 10:22].
- **RF-202 [HIPÓTESE]** Painel de métricas: taxa e tempo de reocupação, taxa de
  resposta a ofertas [produto, @pedro, 14:29].

## 10. Requisitos não funcionais

| ID | Origem | Requisito |
|---|---|---|
| RNF-001 [APROVADO] | [negócio, @fernanda, 09:38] | Registro de interesse em ≤ 30s / ≤ 5 interações na UI |
| RNF-002 [APROVADO] | [tecnologia, @camila, 10:21] | Dados da fila acessíveis somente a perfis autorizados (RBAC no backend) |
| RNF-003 [APROVADO] | [tecnologia, @camila, 10:21] | Retenção: interesse expirado/baixado expurgável; sem dado clínico em log/auditoria |
| RNF-004 [APROVADO] | [tecnologia, @bruno, 10:09] | Confirmações concorrentes (fase 2) resolvidas pelo mecanismo transacional existente; zero duplo agendamento |
| RNF-005 [APROVADO] | [tecnologia, @andre, 10:03] | Mutações idempotentes onde houver retry (chave de idempotência) |
| RNF-006 [APROVADO] | D2/D5 | Sem novos serviços de infraestrutura na fase 1; fase 2 no máximo outbox em tabela |
| RNF-007 [APROVADO] | D4 | Toda ordenação/elegibilidade da fila reproduzível por regra explícita (auditável) |

## 11. Regras de negócio

| ID | Regra |
|---|---|
| RN-001 [APROVADO] | Interesse ativo é único por (paciente, especialidade) — constraint no banco |
| RN-002 [APROVADO] | Ordem da fila: FIFO por data de criação do interesse |
| RN-003 [APROVADO] | Janela de disponibilidade: ao menos 1 dia da semana e 1 turno |
| RN-004 [APROVADO] | Baixa por desistência exige motivo (3–300 caracteres) |
| RN-005 [APROVADO] | Expiração: `ACTIVE` com `createdAt + prazo < hoje` torna-se `EXPIRED` |
| RN-006 [APROVADO] | `FULFILLED` exige vínculo com a consulta criada (rastreabilidade) |
| RN-007 [HIPÓTESE] | (Fase 2) Oferta expira no SLA; vaga só é da pessoa após confirmação efetivada |

## 12. Métricas

Ver OBJ-1…OBJ-4. Instrumentação mínima da fase 1: timestamps de criação/baixa/
expiração + vínculo interesse→consulta (base para taxa e tempo de reocupação).

## 13. Riscos

| Risco | Mitigação |
|---|---|
| Recepção não adotar (planilha é hábito) | RF-008 + RNF-001; piloto com acompanhamento [produto, @lucas, 14:32] |
| Fila crescer sem baixa (dados podres) | RF-005 expiração + RN-004 motivo |
| Vazamento de dado sensível | RNF-002/003; revisão de logs |
| Scope creep p/ fase 2 "de carona" | Disciplina de fase [tecnologia, @camila, 10:28]; PRs por história |

## 14. Dependências

- Nenhuma externa na fase 1 (sem serviço novo).
- Internas: módulos `patients`, `specialties`, `appointments`, `audit` do MedAgenda.
- Dados pendentes (não bloqueiam): Q1 e Q2.

## 15. Critérios de aceitação (fase 1 — nível PRD)

1. Dado um paciente cadastrado, quando a recepção registra interesse com
   especialidade e janela válidas, então o interesse fica `ACTIVE` e aparece na
   fila da especialidade em ordem FIFO.
2. Dado um interesse `ACTIVE` do paciente X em Cardiologia, quando se tenta
   registrar outro igual, então a API recusa com 409 e mensagem clara.
3. Dado um interesse `ACTIVE`, quando a recepção dá baixa como atendido
   vinculando a consulta criada, então o status vira `FULFILLED` e o vínculo é
   consultável.
4. Dado um interesse criado há mais de N dias, quando a fila é consultada,
   então ele aparece/filtra como `EXPIRED` e não conta como ativo.
5. Dado um usuário MEDICO, quando acessa qualquer endpoint da fila, então
   recebe 403.
6. Toda criação/baixa/expiração gera entrada de auditoria sem dados clínicos.

## 16. Rastreabilidade

Matriz completa em `output/backlog/` (história ↔ RF/RN ↔ evidência). Síntese:
RF-001↔P4/P6/H1 · RF-002↔Q6 · RF-003↔D4/P5 · RF-004↔jornada · RF-005↔H4/Q3 ·
RF-006/007↔privacidade (C4/camila 10:21) · RF-008↔C-recepção (fernanda 09:38,
bruno 10:29).
