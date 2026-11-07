# Reunião 2 — Produto: como melhorar a ocupação das agendas

**Data:** 2026-10-30, 14:00–15:05
**Participantes:**
- **Juliana** — Product Manager
- **Lucas** — UX Designer
- **Fernanda** — Responsável pelo Atendimento
- **Pedro** — Analista de Produto

---

**[14:00] Juliana:** Pessoal, contexto rápido: a diretoria nos pediu para investigar a ociosidade causada por cancelamentos. Importante — não viemos com solução pronta. A Mariana foi explícita: investigar antes de decidir. Pedro, você consolidou os dados da Fernanda?

**[14:02] Pedro:** Sim. Peguei a planilha da unidade centro, três meses. Em média, 14% das consultas agendadas são canceladas; dessas, pouco mais da metade com menos de 24 horas de antecedência. E a planilha de "me avisa se vagar" tem 63 pacientes ativos — só na unidade centro, só dos que pediram espontaneamente.

**[14:04] Lucas:** Sessenta e três pessoas esperando vaga numa planilha. Isso é uma lista de espera informal que já existe, a gente só não deu nome.

**[14:05] Juliana:** Cuidado, Lucas. Que existe demanda, existe. Mas antes de batizar a solução, quero entender a jornada. Fernanda, me guia: como é agendar hoje, do ponto de vista do paciente?

**[14:07] Fernanda:** O paciente liga ou chega no balcão. A recepcionista abre a agenda do médico, procura horário com a especialidade pedida. Se tem, agenda: nome, telefone, pronto. Se não tem nos próximos dias, oferece a data disponível — às vezes três semanas depois. Aí uns aceitam, outros desistem, e uns pedem o famoso "me avisa se vagar antes".

**[14:09] Juliana:** E o cancelamento?

**[14:10] Fernanda:** Liga ou manda WhatsApp no número da unidade. A recepcionista cancela no sistema e... acabou. O sistema não faz nada com aquele buraco. Se ela lembrar, abre a planilha e começa a ligar. Num dia movimentado, ninguém lembra.

**[14:11] Lucas:** E quando ela liga, o que acontece?

**[14:12] Fernanda:** A maioria não atende, é número desconhecido. Dos que atendem, uns já resolveram, outros não podem naquele horário. Ela gasta vinte, trinta minutos e na metade das vezes o horário fica vazio do mesmo jeito.

**[14:13] Pedro:** Isso bate com o dado: dos cancelamentos com menos de 24h, só 11% foram reocupados. Com mais de 48h de antecedência, a reocupação sobe para quase 60%, porque a recepção tem tempo de trabalhar a agenda.

**[14:15] Juliana:** Bom número para guardar. Então o problema central é: **horário liberado em cima da hora não encontra paciente disponível a tempo**. Caminhos possíveis — vamos listar sem casar com nenhum. Lucas?

**[14:16] Lucas:** Um: formalizar a lista de espera — o paciente registra interesse por especialidade, e quando vaga um horário o sistema avisa. Dois: antecipação ativa — o sistema olha quem tem consulta marcada para daqui a três semanas e oferece o horário que vagou amanhã. São parecidos mas não são a mesma coisa: no primeiro o paciente ainda não tem consulta; no segundo, tem e quer antecipar.

**[14:18] Pedro:** Três: confirmação prévia — 48h antes, o paciente confirma ou libera o horário. Atacaria a causa, como o Roberto defendeu. Quatro: overbooking controlado, tipo companhia aérea.

**[14:19] Fernanda:** Overbooking não, pelo amor. Quando dá errado, sou eu que explico para dois pacientes irritados no balcão.

**[14:20] Juliana:** Riscado por ora, mas fica no registro como alternativa descartada e por quê. Sobre o aviso ao paciente — como seria, na prática? Isso me preocupa.

**[14:21] Lucas:** O cenário ingênuo: vagou às 8h, sistema manda mensagem para os 63 da lista, os cinco primeiros respondem "aceito". Quem fica com a vaga?

**[14:22] Fernanda:** E os outros quatro ficam bravos. Já vi isso acontecer com sorteio de encaixe no WhatsApp. Briga feia.

**[14:23] Pedro:** Então precisa de ordem: oferece para um por vez, com tempo de resposta — tipo quinze minutos — e se não responder passa para o próximo. Ou oferta simultânea, mas o primeiro que confirmar leva, e a confirmação precisa travar a vaga na hora, sem dupla confirmação.

**[14:24] Juliana:** "Travar a vaga na hora" é frase que esconde complexidade técnica. Anota como questão aberta para a reunião com a engenharia: **como garantir que duas confirmações simultâneas não ocupem o mesmo horário**. Não vamos resolver isso aqui.

**[14:26] Lucas:** Outra questão de UX: o paciente da lista precisa dizer *quando pode*. Se ele só pode de manhã e a vaga é às 16h, avisar é spam. Interesse sem disponibilidade vira ruído.

**[14:27] Fernanda:** E tem paciente que pede para entrar na lista e esquece. Três semanas depois, recebe o aviso e nem lembra do que se trata. Talvez o interesse devesse expirar.

**[14:28] Juliana:** Boa — expiração do interesse. Pedro, e as métricas? Se a gente fizer qualquer coisa disso, como sabemos que funcionou?

**[14:29] Pedro:** Taxa de reocupação de horários cancelados, antes e depois — essa é a principal. Tempo entre cancelamento e reocupação. Taxa de resposta às ofertas. E uma de guarda: reclamações na recepção, para garantir que não pioramos a vida de ninguém.

**[14:31] Juliana:** Sobre validação com usuários: dá para testar antes de construir?

**[14:32] Lucas:** Dá. Protótipo de mensagem e fluxo de aceite, teste com dez pacientes da própria planilha. E um piloto manual: a recepção usa a lista formalizada no sistema, mas o aviso ainda é por telefone. Validamos a mecânica de fila antes de automatizar notificação.

**[14:33] Fernanda:** Isso a recepção topa, desde que a lista fique no sistema e não numa planilha paralela. O que não dá é para manter os dois.

**[14:34] Juliana:** Fechando o escopo da investigação: MVP versus solução completa. Minha leitura até aqui — e é hipótese, não decisão: a versão mínima formaliza o registro de interesse e dá visibilidade para a recepção; a notificação automática e a antecipação de quem já tem consulta vêm depois, se os números do piloto sustentarem. Mas quero a viabilidade técnica antes de qualquer promessa. Pedro, agenda com o Rafael e o time de tecnologia essa semana?

**[14:36] Pedro:** Agendo. Levo a lista de questões abertas: concorrência na confirmação, expiração, janela de disponibilidade do paciente, e o custo de notificar — canal, privacidade, essas coisas.

**[14:37] Juliana:** Perfeito. E deixo registrado o que NÃO está decidido: não escolhemos entre lista de espera e antecipação; não definimos canal de notificação; não definimos se confirmação prévia entra no escopo. Tudo isso depende da conversa técnica e do piloto. Obrigada, pessoal.

**[14:39] Lucas:** Mando o rascunho do fluxo amanhã para a gente rabiscar em cima.
