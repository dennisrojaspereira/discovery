# Reunião 3 — Tecnologia: modalidade de consulta e entrega de link

**Data:** 2026-11-21, 10:00–11:05
**Participantes:**
- **Rafael** — CTO
- **Bruno** — Software Architect
- **Camila** — Tech Lead
- **André** — Backend Engineer

---

**[10:00] Rafael:** Telemedicina. O produto trouxe quatro questões: custo da modalidade no modelo de agenda, link — armazenamento e envio —, consentimento, e o pré-requisito de diferenciar retorno de primeira consulta. Começo pelo que o código é hoje. Camila?

**[10:02] Camila:** O modelo atual é agnóstico de lugar, o que é bom e ruim. `Appointment` tem médico, paciente, início, fim e status — nenhum conceito de modalidade ou de tipo de consulta. `AvailabilityRule` define dia da semana, janela, duração e intervalo — também sem modalidade. O motor de slots não precisa mudar nada para suportar vídeo; ele nem sabe o que é uma sala.

**[10:03] André:** O que significa que a mudança mínima é pequena: um campo `modality` na consulta — presencial ou vídeo — com default presencial para todo o histórico. Zero migração dolorosa.

**[10:04] Bruno:** A consulta é a parte fácil. A discussão de verdade é a disponibilidade, por causa da divergência bloco versus misto. Se a modalidade for só da consulta, qualquer slot aceita qualquer modalidade — é o modelo "misto" imposto a todos. Se a `AvailabilityRule` declarar modalidade — presencial, vídeo ou ambas —, cada médico configura seu modelo: a Dra. Paula cria regra de sexta à tarde só vídeo, o Dr. Miguel deixa tudo "ambas". A configuração resolve a briga da diretoria sem a gente escolher um lado.

**[10:06] Camila:** Concordo com modalidade na regra, com um alerta de complexidade: o cálculo de slots passa a filtrar por modalidade solicitada, e a validação de agendamento também — consulta de vídeo só em slot que aceite vídeo. É um parâmetro novo atravessando o motor. Pequeno, mas atravessa tudo; os testes de slot dobram de casos.

**[10:07] Rafael:** Aceitável. E o tipo de consulta — primeira versus retorno?

**[10:08] André:** Mesmo padrão: enum `consultationType` na consulta. A regra de negócio "vídeo só para retorno" vira validação explícita e configurável — hoje o parecer diz retorno, amanhã pode mudar, então regra parametrizada, não hard-code.

**[10:09] Bruno:** E registro: esse campo serve aos três casos — cancelamento, no-show e tele — como o Roberto intuiu. É o tipo de requisito transversal que eu gosto de implementar uma vez só, cedo.

**[10:10] Rafael:** Agora o vídeo em si. Posições?

**[10:11] Bruno:** Inegociável para mim: não construímos nem hospedamos vídeo. WebRTC em produção é um ofício próprio — TURN, qualidade adaptativa, eco. Usamos um provedor de salas prontas com API: criar sala, obter link, expirar sala. O MedAgenda orquestra; o vídeo é commodity contratada.

**[10:12] Camila:** De acordo, com o critério de escolha vindo da privacidade: o provedor precisa de salas efêmeras com nome não enumerável, sem conta para o paciente, e contrato com confidencialidade adequada a saúde — isso descarta usar link de ferramenta de reunião genérica da conta corporativa, que mistura dado de paciente com operação da empresa.

**[10:14] André:** Sobre o link como dado: o link denuncia que fulano consulta tal especialidade em tal data — é dado pessoal sensível por inferência. Então: guardado na consulta com acesso restrito aos perfis que já veem a agenda, nunca em log, nunca em URL de redirect do nosso lado, e com expiração — sala criada pouco antes, destruída depois. Link eterno é vazamento esperando data.

**[10:15] Rafael:** E a geração? Na criação da consulta ou na véspera?

**[10:16] André:** Véspera, por job — e aqui o desenho dos casos anteriores paga dividendo: o outbox da lista de espera e o gatilho de lembrete do no-show são o mesmo mecanismo. Um job diário que materializa "consultas de vídeo de amanhã": cria sala, guarda link, dispara notificação. Idempotente por consulta — reprocessar não cria sala duplicada.

**[10:17] Camila:** O que nos leva à dependência incômoda: notificação. Terceiro caso que esbarra nela. Minha leitura técnica: parem de tratá-la como "fase 3 de cada caso" e tratem como componente próprio — um serviço interno de mensagens com consentimento por canal, template e trilha de envio. Tele é o caso de negócio que o financia, como a Mariana disse.

**[10:19] Bruno:** Apoio formalizar, com escopo contido: componente interno no monolito, tabela de mensagens com estado, canal e-mail primeiro — nada de microsserviço de notificação, pelos mesmos motivos de sempre.

**[10:20] Rafael:** Consentimento?

**[10:21] Camila:** Dois consentimentos distintos, aliás: o do canal — "posso te mandar e-mail?" —, que o no-show já precisava, e o do atendimento remoto, exigido pela regulamentação, com versão do termo e timestamp. Modelagem simples, mas jurídica define o texto e o momento do aceite. Sem parecer, não há o que codificar — concordo que ele trava o resto.

**[10:22] André:** E a interseção com no-show, que o produto perguntou: nenhuma mudança estrutural. Paciente não conectou, recepção marca a falta igual ao presencial — a transição de estado é a mesma. No máximo, o motivo ganha uma opção "não conectou". De graça.

**[10:23] Rafael:** Gravação de consulta — alguém vai pedir.

**[10:24] Bruno:** Resposta curta: não, por default. Gravação de ato médico é passivo jurídico e de armazenamento gigantesco para benefício duvidoso. Se um dia for requisito, entra com consentimento específico, criptografia e política de retenção — projeto próprio. Registro em ADR para a pergunta morrer documentada.

**[10:25] Rafael:** Riscos de fechamento?

**[10:26] Camila:** Dependência externa nova — o provedor de vídeo cai, consultas caem: precisa de plano B operacional, nem que seja "liga por telefone e reagenda". Scope creep triplo, porque este caso toca agenda, notificação e consentimento ao mesmo tempo — faseamento rígido ou vira um trimestre. E o de sempre: piloto com link manual primeiro valida o fluxo sem construir o job.

**[10:27] Bruno:** Resumo então: fase 1 — campos `modality` e `consultationType`, modalidade na regra de disponibilidade, filtro no motor de slots, link em campo restrito com reenvio manual pela recepção. Fase 2 — provedor de vídeo via API com salas efêmeras e job de véspera sobre o outbox existente. Fase 3 — notificação como componente formal com os dois consentimentos. Jurídico correndo em paralelo desde já.

**[10:28] Rafael:** Fechado. Bruno documenta a decisão do vídeo como commodity e a modalidade na regra; Camila escreve a nota sobre notificação como componente; André estima o impacto no motor de slots. Devolvo à Juliana: viável, incremental, com uma dependência externa nova e o jurídico no caminho crítico. Terceira vez seguida que o desenho anterior nos poupa trabalho — ou estamos ficando bons nisso, ou sortudos.

**[10:29] Camila:** Vou torcer por bons. Fecho a nota amanhã.
