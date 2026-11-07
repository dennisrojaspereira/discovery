# Reunião 2 — Produto: jornada da teleconsulta

**Data:** 2026-11-19, 14:00–15:05
**Participantes:**
- **Juliana** — Product Manager
- **Lucas** — UX Designer
- **Fernanda** — Atendimento
- **Pedro** — Analista de Produto

---

**[14:00] Juliana:** Caso telemedicina. A diretoria delimitou bem: retorno primeiro, parecer regulatório como pré-requisito, nada de construir vídeo. Nossa lição de casa é a jornada. Pedro, demanda?

**[14:02] Pedro:** Fiz duas sondagens. Com os médicos: dos oito ativos, cinco topariam atender retorno por vídeo, dois são contra, um em cima do muro. Com pacientes, aproveitei a fila do balcão numa tarde — amostra enviesada, admito: de 31 perguntados, 19 disseram que prefeririam o retorno por vídeo "se funcionar direito". O "se funcionar direito" apareceu espontaneamente umas dez vezes.

**[14:03] Lucas:** Esse "se funcionar direito" é o produto inteiro. A consulta em si é o médico; o que a gente entrega é todo o resto: saber que é por vídeo, receber o link, conseguir entrar, ter plano B quando não entra.

**[14:04] Juliana:** Então vamos desenhar a jornada feliz e depois quebrá-la. Fernanda, do agendamento ao fim da consulta.

**[14:05] Fernanda:** Agendamento: igual ao de hoje, mais a escolha "presencial ou vídeo" — e só aparecer vídeo quando o médico e o tipo de consulta permitirem, senão o balcão vira tribunal de exceções. Véspera: paciente recebe lembrete com o link. Hora da consulta: paciente clica, médico clica, consulta acontece. Fim: registro normal.

**[14:06] Lucas:** Agora quebrando. Quebra um: paciente aparece na clínica achando que era presencial. Quebra dois: paciente não recebe o link — e-mail errado, caixa de spam. Quebra três: não consegue entrar na hora — aí liga para o balcão, que precisa ter o link na tela para reenviar ou orientar. Quebra quatro: médico atrasa e o paciente fica olhando uma tela vazia sem saber se espera.

**[14:08] Fernanda:** A quebra três é a que me assusta. Reforço o que disse na diretoria: se o balcão não enxergar o link e o status da teleconsulta na agenda do dia, o suporte vira caos. E detalhe: a recepcionista precisa poder reenviar o link em um clique.

**[14:09] Pedro:** Sobre a quebra dois, há um fato duro: hoje o MedAgenda não envia nada a paciente. A notificação é a dependência crítica do caso — sem ela, teleconsulta funciona só se a recepção mandar link manualmente pelo WhatsApp do balcão, que é o que a Santa Luzia faz, aliás. Sabemos porque a prima da nossa recepcionista trabalha lá.

**[14:10] Juliana:** Inteligência competitiva de balcão vale ouro. E manda link manual é opção de piloto, inclusive — valida a mecânica antes de automatizar, igual fizemos com a lista de espera. Anota como alternativa de MVP: link manual pela recepção, automação depois.

**[14:12] Lucas:** Sobre a escolha de modalidade: defendo que seja atributo da consulta, não agenda separada. O paciente pensa "consulta com a Dra. Paula", não "consulta virtual". Na UI: um seletor presencial/vídeo no fluxo que já existe, com o vídeo desabilitado quando não se aplica, e badge visual bem forte na agenda — ninguém pode confundir.

**[14:13] Fernanda:** Concordo com o seletor. Mas a divergência da diretoria continua: a agenda do médico aceita vídeo em qualquer horário, ou só em blocos? Os médicos que o Pedro ouviu falaram algo?

**[14:14] Pedro:** Dividido ao meio. Dra. Paula quer bloco fechado — "sexta à tarde em casa". Dr. Miguel quer misto — "retorno de dez minutos entre dois presenciais me poupa buraco". Não é escolha nossa: é configuração por médico. O que mata as duas pontas é impor um modelo único.

**[14:15] Juliana:** Então hipótese de requisito: a disponibilidade declara modalidade — presencial, vídeo ou ambas — por regra de horário, por médico. Vai para a conversa técnica: quanto custa isso no modelo de agenda atual?

**[14:17] Lucas:** Outra decisão de jornada: consentimento. O parecer vai exigir aceite do paciente para atendimento remoto. Onde isso entra sem virar burocracia? Minha proposta: no primeiro agendamento de vídeo, o balcão lê e registra o aceite verbal, e o termo vai junto com o link para aceite digital. Mas quero validar o fluxo com o jurídico, não desenhar sozinho.

**[14:18] Pedro:** E tem a interseção com o caso no-show: paciente que não conecta é falta? O médico esperou dez minutos na sala virtual, é no-show igualzinho. A marcação de falta que está sendo construída precisa funcionar para tele também — senão criamos um buraco de medição novo no dia um.

**[14:19] Juliana:** Boa — requisito de coerência entre casos. Métricas então?

**[14:20] Pedro:** Taxa de adoção: percentual de retornos elegíveis agendados como vídeo. Taxa de sucesso técnico: consultas de vídeo concluídas sem reagendar por problema de conexão — o "funcionar direito" virando número. Comparativo de no-show entre vídeo e presencial, que a literatura diz ser menor no vídeo, quero ver aqui. E recuperação de retorno: se a Fernanda está certa, retorno por vídeo deve reduzir o abandono de tratamento.

**[14:22] Fernanda:** Para medir recuperação de retorno vocês vão precisar daquilo que o Roberto pediu: o sistema saber o que é retorno. Hoje não sabe.

**[14:23] Juliana:** Vira requisito do caso, possivelmente até pré-requisito. Riscos para fechar: paciente sem letramento digital — o filtro é oferecer, nunca empurrar, e o presencial continua sempre disponível; médico resistente — piloto só com voluntários; suporte de primeira hora sobrecarregando o balcão — janela de piloto pequena, uma especialidade; e o jurídico atrasar — por isso ele começa primeiro.

**[14:25] Lucas:** Acrescento um de design: a tentação de esconder a complexidade do link atrás de "manda por WhatsApp e pronto". Canal de mensagem para dado de saúde tem implicação de privacidade — o link da consulta identifica que fulano consulta tal especialidade. Vai para a conversa técnica também.

**[14:26] Juliana:** Fechando: nada decidido sobre bloco versus misto (vira configuração, hipótese), preço (negócio), canal do link (técnica + jurídico). Consenso a validar: começar por retorno, com voluntários, link possivelmente manual no piloto, modalidade como atributo da consulta, e falta funcionando igual nas duas modalidades. Pedro, marca com o Rafael. Levamos as questões: custo da modalidade no modelo de agenda, armazenamento e envio do link, consentimento, e o pré-requisito do tipo de consulta.

**[14:28] Fernanda:** E me incluam no teste piloto do fluxo do balcão, por favor. Dessa vez quero quebrar o protótipo antes dos pacientes.

**[14:29] Juliana:** Combinado. Obrigada, time.
