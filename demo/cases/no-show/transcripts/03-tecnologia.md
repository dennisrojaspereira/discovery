# Reunião 3 — Tecnologia: registrar e reduzir no-show

**Data:** 2026-11-14, 10:00–11:00
**Participantes:**
- **Rafael** — CTO
- **Bruno** — Software Architect
- **Camila** — Tech Lead
- **André** — Backend Engineer

---

**[10:00] Rafael:** Caso novo do produto: faltas sem aviso. A boa notícia é que dessa vez o pedido da fase 1 é humilde — registrar a falta e medir. Camila, o que o código já tem?

**[10:02] Camila:** Curiosamente, metade do caminho: o enum de status da consulta já prevê `NO_SHOW` desde o início, junto com `SCHEDULED`, `COMPLETED` e `CANCELLED`. Mas é um estado órfão: não existe endpoint, não existe transição, nenhuma tela usa. Está no schema e em nenhum lugar mais.

**[10:03] André:** O cancelamento, por comparação, tem fluxo completo: endpoint, motivo obrigatório, timestamp, auditoria, e a constraint de não-sobreposição ignora cancelada. Dá para usar como gabarito: a marcação de falta é quase um espelho.

**[10:04] Bruno:** Quase. Tem uma diferença conceitual importante: cancelar é uma ação sobre o futuro — só faz sentido antes da consulta. Marcar falta é sobre o passado — só faz sentido *depois* do horário. A validação temporal é invertida. Se não travarmos isso, alguém marca falta às 9h da consulta das 10h e criamos um problema novo.

**[10:05] Rafael:** Qual seria a regra? Falta só depois do fim do horário?

**[10:06] Camila:** Produto sugeriu janela de tolerância de atraso, uns quinze minutos após o início. Eu faria simples: permitir a marcação a partir do horário de início mais uma tolerância configurável, e registrar o timestamp de quando foi marcada. A tolerância é política de negócio, não constante no código.

**[10:07] André:** E a reversão? A Fernanda foi enfática: paciente atrasado que acaba sendo atendido acontece toda semana.

**[10:08] Bruno:** Aqui eu quero cuidado com a máquina de estados. Proposta: `NO_SHOW` pode voltar para `SCHEDULED` enquanto o dia não acabou, e só isso. Nada de `NO_SHOW` para `COMPLETED` direto, senão criamos um atalho que esconde a falta de registro do atendimento. Reversão explícita, auditada, com motivo.

**[10:09] Camila:** Discordo do limite "até o fim do dia". Recepção fecha caixa no dia seguinte de manhã e é quando percebe erro de marcação. Eu daria uma janela maior, 24 ou 48 horas, parametrizável. Depois disso, correção vira caso de administrador, não de recepção.

**[10:10] Rafael:** Registrem as duas posições e o produto decide o prazo com a Fernanda. Não é decisão nossa. Concorrência: algum risco novo?

**[10:11] André:** Baixo. Marcar falta é um update de estado com pré-condições; a corrida clássica seria marcar falta ao mesmo tempo em que alguém cancela ou atende. Resolve com update condicional — só transiciona se o status atual for `SCHEDULED` — e quem perder a corrida recebe um 409 honesto. Mesmo padrão que já usamos, sem tabela nova, sem lock extra.

**[10:12] Bruno:** E explicitamente sem outbox nesta fase. O registro de falta não dispara nada automático por enquanto; é escrita e métrica. Quando lembrete entrar, aí sim o outbox desenhado no caso da lista de espera serve de base — um gatilho "consulta amanhã" em vez de "consulta cancelada". A infraestrutura converge, o que é bom sinal do desenho anterior.

**[10:14] Rafael:** Falando em lembrete: o produto vai perguntar da viabilidade. Opiniões rápidas, sem decidir.

**[10:15] André:** Canal é a parte cara e burocrática: SMS e WhatsApp têm custo por mensagem e exigem consentimento registrado — e consentimento hoje não existe no cadastro do paciente. Precisaria de campo novo, com data e origem do aceite. Isso é trabalho de LGPD antes de ser trabalho de código.

**[10:16] Camila:** E-mail é o canal barato para piloto, com taxa de abertura pior mas custo zero. Minha sugestão quando chegar a hora: começar por e-mail para medir mecânica, antes de pagar por mensagem.

**[10:17] Bruno:** Minha ressalva é outra: ouvi "podemos prever quem vai faltar com IA" no corredor. Mesma resposta do caso anterior, e quero isso em ADR de novo se preciso: as variáveis que importam — antecedência, primeira consulta, histórico — viram regra explícita e auditável. Score opaco decidindo se um paciente merece lembrete extra ou vaga é exatamente o tipo de caixa-preta que não vamos colocar em decisão sobre saúde.

**[10:18] Rafael:** De acordo, e o histórico de faltas em si é dado sensível. Camila, privacidade?

**[10:19] Camila:** Três pontos. Primeiro: contador de faltas visível para recepção e admin, não para qualquer perfil, e nunca em log. Segundo: motivo da falta é texto livre — campo perigoso; orientação de não registrar informação clínica, igual fizemos nas observações da lista de espera. Terceiro: se um dia houver política de consequência por reincidência, o paciente tem direito de saber o próprio histórico e contestar — mais um motivo para cada marcação ter autor, timestamp e reversão auditada.

**[10:21] André:** Métricas saem quase de graça: com `NO_SHOW` registrado com timestamp, a taxa por especialidade, dia da semana e antecedência é consulta SQL sobre o que já existe. Nenhuma tabela nova além de talvez materializar o contador por paciente, e mesmo isso dá para derivar.

**[10:22] Rafael:** Riscos para fechar?

**[10:23] Camila:** O de sempre: scope creep. A fase 1 é uma transição de estado, uma reversão, um botão na agenda do dia e consultas de métrica. Se lembrete, confirmação ou consentimento entrarem "de carona", viram três sprints. Fase 1 é dias, de novo — e vou defender esse limite.

**[10:24] Bruno:** E um risco de dado: as faltas anteriores à feature não existem no sistema. O painel vai começar do zero, e alguém vai perguntar "cadê o histórico". Melhor avisar desde já que a régua começa a valer no dia do deploy.

**[10:25] Rafael:** Bem lembrado — comunicação do produto. Resumo técnico: fase 1 é transição `SCHEDULED` para `NO_SHOW` com validação temporal e update condicional, reversão auditada com janela parametrizável a definir, botão na agenda do dia, métricas por consulta SQL, zero infra nova. Lembrete, confirmação e consentimento ficam desenhados mas fora. Bruno documenta a máquina de estados e as alternativas; Camila prepara a nota sobre o estado órfão `NO_SHOW` para o AS-IS. Devolvo para a Juliana com parecer: viável, pequeno, e pela primeira vez um caso em que o schema já estava pronto esperando o produto chegar.

**[10:27] Camila:** Quase poético. Fecho a nota hoje.
