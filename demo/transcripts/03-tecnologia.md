# Reunião 3 — Tecnologia: viabilidade das melhorias de agenda

**Data:** 2026-11-03, 10:00–11:10
**Participantes:**
- **Rafael** — CTO
- **Bruno** — Software Architect
- **Camila** — Tech Lead
- **André** — Backend Engineer

---

**[10:00] Rafael:** Bom dia. O produto trouxe o problema da ociosidade por cancelamento e uma lista de questões abertas. Antes de opinar sobre solução, quero que a gente olhe o que o MedAgenda já faz hoje. Camila, o estado atual?

**[10:02] Camila:** A API de agendamento é REST, NestJS, Postgres via Prisma. O fluxo é direto: o cliente consulta os slots — calculados a partir das regras de disponibilidade do médico — e cria a consulta num slot válido. A criação roda em transação: checa sobreposição e insere. E tem uma exclusion constraint no Postgres como última linha de defesa contra duplo agendamento no mesmo horário.

**[10:03] André:** Complementando: existe idempotência no agendamento. O cliente pode mandar uma `idempotencyKey`; se a mesma chave vier duas vezes, retorna a consulta já criada em vez de duplicar. Foi pensado para retry de rede.

**[10:04] Rafael:** E os estados da consulta?

**[10:05] André:** `SCHEDULED`, `COMPLETED`, `CANCELLED`, `NO_SHOW`. O cancelamento grava motivo e timestamp e libera o slot — a constraint de não-sobreposição só vale para `SCHEDULED`, então o horário cancelado pode ser reocupado naturalmente.

**[10:06] Bruno:** O que o sistema **não** faz: nada acontece quando uma consulta é cancelada. Não existe noção de "horário liberado" como evento, não existe lista de espera, não existe notificação. O cancelamento é um UPDATE e fim.

**[10:07] Rafael:** Perfeito, esse é o gap. Agora, as questões do produto. A mais cabeluda: duas confirmações simultâneas para a mesma vaga. Bruno?

**[10:09] Bruno:** Na verdade é o problema que o agendamento já resolve. Se a confirmação da oferta criar a consulta pelo mesmo caminho — transação mais exclusion constraint — a segunda confirmação toma 409 e pronto. Não precisamos inventar mecanismo novo; precisamos **reusar** o que existe.

**[10:10] Camila:** Com um adendo: a oferta em si precisa de estado próprio. Se oferecemos a vaga para o paciente A com quinze minutos para responder, essa reserva temporária é um conceito novo. Pergunta: a oferta *trava* a vaga, ou a vaga continua livre e o primeiro que confirmar leva?

**[10:11] André:** Se travar, um paciente lento bloqueia a vaga por quinze minutos — e se ele não responder, perdemos quinze minutos preciosos de um horário que já era para hoje. Se não travar, o paciente pode confirmar e receber "já foi ocupada", frustrante.

**[10:12] Bruno:** Eu começaria sem trava: oferta não reserva, confirmação cria a consulta atomicamente, quem chegar segundo recebe uma resposta honesta. É o modelo mais simples e o banco já garante a consistência. Trava com expiração é otimização para depois, se os dados mostrarem frustração relevante.

**[10:13] Rafael:** Registra como decisão proposta, com a alternativa documentada. Agora: precisamos de eventos? Fila, mensageria, worker?

**[10:14] Camila:** Depende do acoplamento que aceitamos. O gatilho é "consulta cancelada". Podemos: um, processar na própria requisição de cancelamento — síncrono; dois, outbox com worker; três, mensageria de verdade.

**[10:15] André:** Mensageria para o nosso volume é matar mosca com canhão. São dezenas de cancelamentos por dia, não milhares por segundo.

**[10:16] Bruno:** Concordo com o André no diagnóstico e discordo da conclusão síncrona pura. Se o pós-cancelamento — achar interessados, criar ofertas, futuramente notificar — rodar dentro do request, qualquer falha ou lentidão ali degrada o cancelamento, que é a operação que a recepção faz com o paciente na linha. Eu separaria com um outbox simples: o cancelamento grava o evento na mesma transação, um job processa depois. Sem RabbitMQ, sem Kafka — uma tabela e um loop.

**[10:18] Camila:** Transação garante que não perdemos evento, e o processamento é assíncrono sem infraestrutura nova. Razoável. Mas para a fase 1 do que o produto descreveu — registrar interesse e dar visibilidade para a recepção — nem isso precisa. É CRUD honesto.

**[10:19] Rafael:** Bom ponto. Faseamento técnico casa com o do produto: fase 1 sem evento nenhum; outbox entra quando houver oferta automática. Segurança e privacidade — o que muda com lista de espera?

**[10:21] Camila:** A lista de espera cria um dado novo: "fulano quer consulta de cardiologia". Preferência de especialidade é informação de saúde, sensível. Precisa de controle de acesso por perfil — recepção e admin veem, outros não —, trilha de auditoria de quem viu e mexeu, e retenção definida: interesse expirado deveria ser expurgado, não acumulado para sempre.

**[10:22] André:** E consentimento. Se um dia notificarmos por WhatsApp ou SMS, o paciente precisa ter autorizado o canal. Por isso também defendo a fase 1 sem notificação: o consentimento vira problema real só na fase 2.

**[10:23] Rafael:** O produto perguntou de IA — ranqueamento inteligente da fila, sugestão de remarcação por LLM. Opiniões?

**[10:24] Bruno:** Contra, com convicção. Ordenar fila é regra determinística: data de entrada, urgência declarada, compatibilidade de janela com o horário vago. Isso é um `ORDER BY`, não um modelo. LLM aqui adiciona custo, latência e imprevisibilidade num fluxo que precisa ser auditável — imagina explicar para o paciente que ele perdeu a vaga porque o modelo achou que sim.

**[10:25] Camila:** Concordo. Regra explícita, documentada, auditável. IA generativa neste produto faz sentido no discovery — análise de conversas, geração de documentação — não na regra de negócio do agendamento.

**[10:26] Rafael:** Unânime, registra como ADR. Riscos técnicos que vocês veem na fase 1?

**[10:27] André:** Duplicidade de interesse — mesmo paciente, mesma especialidade, duas vezes na fila. Resolve com unique constraint parcial, mas precisa definir a regra: pode ter interesse em duas especialidades? Eu diria sim; na mesma, não.

**[10:28] Camila:** Migração de schema em produção, baixo risco porque é tabela nova. E o risco de produto virar scope creep: se a fase 1 crescer para incluir notificação "porque já estamos lá", estoura o orçamento que o Roberto deu. A disciplina de fase é mais gerencial que técnica, mas sou eu que vou dizer não.

**[10:29] Bruno:** E uma dívida honesta: o front da recepção. A fila precisa aparecer na tela de agendamento, não numa página escondida. Se a recepcionista tiver que navegar três telas, voltamos para a planilha.

**[10:30] Rafael:** Verdade. Fica como requisito de UX da fase 1, junto com o alerta da Fernanda. Pendências que ficam em aberto: política exata de expiração do interesse — produto decide o prazo; canal de notificação da fase 2 — nem discutimos custo; e SLA da oferta, os tais quinze minutos, que é chute do produto e precisa de dado real do piloto.

**[10:32] Camila:** Resumo técnico então: fase 1 é tabela nova, CRUD com autorização por perfil, auditoria e integração na tela da recepção. Zero infra nova, zero evento, zero IA. Estimativa de dias, não semanas. Fases seguintes dependem do piloto.

**[10:33] Rafael:** Fechado. Bruno documenta as decisões de arquitetura com as alternativas rejeitadas; Camila prepara o AS-IS do módulo de agendamento para o time de produto rastrear requisito contra código. Devolvo para a Juliana com o parecer: viável, incremental, sem dependência externa na fase 1. Obrigado, time.
