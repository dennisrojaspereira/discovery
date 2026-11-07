# Roteiro de demonstração — 20 minutos

**Mensagem central:** *"Da conversa de negócio ao Pull Request, com discovery
estruturado, decisões rastreáveis e engenharia assistida por agentes."*

Antes de começar: `./lab.sh start && ./lab.sh status` (tudo verde).
Abas abertas no navegador: `localhost:3001` (MedAgenda), `localhost:8065`
(Mattermost), `localhost:8080` (Plane), `localhost:3000` (Forgejo).
Terminal com Claude Code aberto na raiz do repo.

---

## Ato 1 — O produto funcionando (3 min)

1. Abra http://localhost:3001 → login `admin@medagenda.local / admin123`.
2. Dashboard: consultas do dia, médicos ativos, horários livres, cancelamentos
   — **dados vindos do backend real**, não mockados.
3. **Médicos → Novo médico**: cadastre "Dra. Beatriz Nogueira", CRM 765432/SP,
   Dermatologia.
4. **Disponibilidade**: selecione a Dra. Beatriz → Nova regra: segunda, 09:00–12:00,
   consultas de 30 min.
5. **Agendamentos → Agendar consulta**: Dermatologia → Dra. Beatriz → próxima
   segunda → escolha um slot → paciente Maria Oliveira → confirmar.
   *Mostre o slot ficando indisponível ao reabrir.*

> Ponto da narrativa: um sistema de agendamento competente, mas **sem** lista de
> espera: quando alguém cancela, o horário morre. É o problema que o negócio viu.

## Ato 2 — As conversas (2 min)

1. Abra http://localhost:8065 (`sysadmin / Sysadmin123!`), time **MedAgenda**.
2. Canal **negocio-medagenda**: a CEO, o diretor de operações e o atendimento
   discutindo cancelamentos — com divergências reais (Roberto quer atacar causa,
   Fernanda quer reaproveitar horário; ninguém decidiu solução).
3. Passe por **produto-medagenda** (jornadas, métricas, hipóteses) e
   **tecnologia-medagenda** (concorrência, idempotência, "LLM não entra em regra
   determinística").

> Ponto: o insumo do discovery são conversas reais, bagunçadas, com conflito.

## Ato 3 — BMAD: das conversas ao PRD (4 min)

No Claude Code:

```
/discovery-importar
```
Mostre `output/discovery/sintese-conversas.md`: cada problema/risco/questão com
**evidência** (canal, autor, timestamp).

```
/discovery-brief     → aprove
/discovery-prd       → aprove
```
Mostre no PRD: IDs estáveis (RF-xxx), `[APROVADO]` vs `[HIPÓTESE]`, fora de
escopo explícito, rastreabilidade para as falas.

> Ponto: o BMAD transforma conversa em requisito **auditável** — dá para
> responder "por que esse requisito existe?" com um link para a fala.

## Ato 4 — O agente analisa o código (2 min)

```
/discovery-arquitetura
```
Mostre `output/architecture/as-is.md` (diagramas C1/C2 e sequence do agendamento
gerados a partir do **código real**) e um ADR com alternativa rejeitada
(ex.: "oferta sem trava de vaga; mensageria rejeitada em favor de outbox").

> Ponto: o TO-BE respeita o que existe — reusa a exclusion constraint do
> Postgres em vez de inventar infraestrutura.

## Ato 5 — Backlog no Plane (3 min)

```
/discovery-backlog   → aprove
/discovery-publicar
```
Abra http://localhost:8080 (`discovery@medagenda.local / DiscoveryLab2026!`):
projeto MedAgenda com o épico **Otimização da agenda médica**, histórias da
fase 1 com critérios **Gherkin**, docs publicados.

> Ponto: produto e engenharia olham para o mesmo artefato, criado por API real.

## Ato 6 — Implementação com PR (4 min)

```
/discovery-implementar HIST-101
```
Acompanhe o agente: lê a história no Plane → localiza RF no PRD → analisa o
código → branch → implementa → **roda os testes e2e** (mostre o verde, inclusive
o teste de concorrência) → commit → push → **abre PR no Forgejo**.

Abra http://localhost:3000/labadmin/cto-discovery-lab/pulls: mostre o diff, o
corpo do PR citando HIST/RF e a evidência de testes. **Não faça merge** — revisão
é humana, por desenho.

## Ato 7 — Notificação (1 min)

Volte ao Mattermost, canal **entregas-medagenda**: o **Discovery Bot** postou o
resultado com link do PR.

> Fechamento: conversa → brief → PRD → arquitetura → backlog → código → PR →
> notificação. Cada elo rastreável, cada aprovação humana, tudo em localhost.

---

## Se algo falhar ao vivo

- `./lab.sh status` aponta o serviço fora do ar; `./lab.sh start` religa.
- Artefatos do discovery já gerados ficam em `output/` — dá para mostrar o
  resultado mesmo sem reexecutar a esteira.
- PR já aberto fica no Forgejo; a notificação fica no histórico do canal.

---

## Encore — criar um caso novo ao vivo (o golpe de misericórdia no ceticismo)

Se sobrar tempo (ou se alguém insinuar que a demo é decorada), rode:

```
/discovery-novo-caso no-show
```

O agente **gera na hora** três reuniões inéditas sobre outro tema (ele é a LLM —
sem API extra), publica nos canais `negocio-/produto-/tecnologia-<caso>` do
Mattermost com as mesmas personas, e a mesma esteira processa o caso novo com
saídas em `output/cases/<caso>/`. O caso `no-show` já vem pronto como exemplo:
faltas sem aviso, conectando com a hipótese de confirmação prévia do Roberto e
com um gancho real no código (o status `NO_SHOW` existe no schema, mas é um
estado órfão — sem endpoint nem tela).

> Diferença para "Reproduzir do zero" (botão do painel): o reset prova que a
> **infraestrutura** é reprodutível; o caso novo prova que a **esteira
> generaliza** — não há roteiro decorado.

## Perguntas frequentes de CTOs

### "Você está rodando vários agentes ou um agente por sessão?"

**Um agente por sessão.** Toda a esteira roda em uma única sessão do Claude
Code, agindo como agente orquestrador — não há enxame de agentes em paralelo.

- **Os "agentes" do BMAD são papéis, não processos.** Quando a esteira executa
  `/discovery-brief` (Analyst), `/discovery-prd` (PM) e `/discovery-arquitetura`
  (Architect), é o *mesmo* agente, na *mesma* sessão, assumindo cada papel em
  sequência — cada skill BMAD carrega as instruções, o template e a postura
  daquele papel. É troca de chapéu, não troca de processo. Vantagem: contexto
  contínuo (o PM conhece o que o Analyst concluiu, sem handoff) e custo de uma
  sessão só.
- **O que é separado de verdade são as integrações determinísticas.** Os
  scripts (`mm.mjs`, `plane.mjs`, `forgejo.mjs`) não são agentes — são CLIs que
  o agente invoca. O Discovery Bot do Mattermost também não é um agente; é uma
  identidade de API para postar notificações.
- **Multi-agente existe como opção, não como padrão.** O Claude Code suporta
  subagentes (paralelizar pesquisa, revisão com múltiplos revisores etc.) e o
  BMAD tem o `bmad-party-mode` para simular vários papéis debatendo. Para esta
  esteira, porém, o agente único é intencional: o fluxo é sequencial com pontos
  de aprovação humana entre as etapas, então paralelismo não compraria nada — e
  um agente só torna o processo mais rastreável, que é a mensagem central da
  demo.

**Frase pronta:** *"É um agente por sessão. Os 'agentes' do BMAD (Analyst, PM,
Architect) são papéis que o mesmo agente assume em sequência, com gates de
aprovação humana entre eles; as integrações com Mattermost, Plane e Forgejo são
scripts determinísticos que ele invoca. Multi-agente é suportado, mas aqui
seria complexidade sem ganho."*
