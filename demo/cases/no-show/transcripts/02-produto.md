# Reunião 2 — Produto: jornada do paciente que falta

**Data:** 2026-11-12, 15:00–16:00
**Participantes:**
- **Juliana** — Product Manager
- **Lucas** — UX Designer
- **Fernanda** — Atendimento
- **Pedro** — Analista de Produto

---

**[15:00] Juliana:** Contexto: a diretoria pediu investigação sobre faltas sem aviso. Mesma regra do caso anterior — investigar antes de decidir. Pedro, conseguiu algum dado, mesmo sem o sistema registrar?

**[15:02] Pedro:** Improvisei: cruzei a agenda de duas semanas da unidade centro com o caderno da recepção. Amostra pequena, mas deu 7% de falta sem aviso. E dois padrões saltam: primeira consulta de paciente novo falta quase o dobro de retorno, e segunda-feira de manhã é o pior horário. Agendamentos feitos com mais de vinte dias de antecedência também faltam mais.

**[15:04] Lucas:** Faz sentido: quanto mais longe a data, mais o compromisso vira abstração. Ninguém esquece consulta de amanhã; esquece a de daqui a um mês.

**[15:05] Juliana:** Fernanda, me conta a jornada do dia da falta, do ponto de vista do balcão.

**[15:06] Fernanda:** O horário chega, o paciente não. A recepcionista espera uns dez, quinze minutos, porque tem atraso normal. Aí liga para o paciente: metade não atende. O médico pergunta se pode chamar o próximo. A consulta fica "agendada" no sistema para sempre — ninguém marca nada, porque não tem onde marcar.

**[15:08] Pedro:** Esse é o ponto que me incomoda como analista: o status "não compareceu" tecnicamente existe no MedAgenda, me disseram, mas não tem botão, não tem fluxo. Então o dado morre no caderno.

**[15:09] Juliana:** Então antes de qualquer lembrete, temos um problema de instrumentação. Lucas, como seria registrar a falta sem atrapalhar o balcão?

**[15:10] Lucas:** O momento natural é quando o médico chama o próximo. Na agenda do dia, a consulta que já passou do horário e segue agendada pode entrar num estado visual de atenção: aí a recepcionista marca "não compareceu" em um clique, com motivo opcional. Sem tela nova, sem modal de dez campos.

**[15:11] Fernanda:** Um clique eu compro. E preciso poder desfazer: paciente que chega quarenta minutos atrasado acontece toda semana. Se o médico ainda puder atender, a falta vira atendimento.

**[15:12] Juliana:** Anotado: reversão precisa existir. Agora as soluções para reduzir a falta em si. Lista aberta, sem casar com nenhuma.

**[15:13] Pedro:** Um: lembrete simples, 48 e 24 horas antes, sem pedir resposta. Dois: lembrete com confirmação — responda SIM para manter. Três: política de consequência — multa, caução ou bloqueio de novo agendamento depois de N faltas. Quatro: sobreagendamento dos horários estatisticamente piores.

**[15:14] Fernanda:** O quatro já foi vetado no caso dos cancelamentos e continuo contra: quem paga o erro da estatística é o balcão.

**[15:15] Juliana:** Mantido fora. Sobre o dois: a confirmação é poderosa justamente porque conecta com a lista de espera que já pilotamos — "não vou" libera horário que tem fila esperando. Mas e o silêncio? O negócio já avisou que não quer punição automática de quem não responde.

**[15:17] Lucas:** O silêncio tem gradação. Dá para desenhar assim: não respondeu até 24h antes, o sistema não cancela nada — só sinaliza o horário como "sem confirmação" para a recepção decidir se liga. Humano no circuito. Automatizar a liberação da vaga é tentador e perigoso.

**[15:18] Pedro:** Os números apoiam a cautela: em clínicas que estudei, taxa de resposta a lembrete fica entre 40 e 60%. Ou seja, metade do silêncio é gente que vem. Liberar vaga por silêncio criaria no-show reverso: a clínica falhando com o paciente.

**[15:19] Juliana:** Ótima formulação, vou roubar para o brief. E sobre o faltante crônico?

**[15:20] Fernanda:** No caderno da recepção, os reincidentes são conhecidos pelo nome. É uma minoria pequena que concentra falta. Para esses, talvez política de agendamento diferente: só encaixe no mesmo dia, ou pré-pagamento. Mas é régua fina — idoso que confunde data não é a mesma coisa que quem marca em três clínicas e vai na que der.

**[15:22] Pedro:** Para diferenciar, precisamos de histórico por paciente — o que volta à instrumentação: sem registrar falta, não existe "reincidente", existe fofoca de balcão.

**[15:23] Lucas:** Proposta de faseamento pelo lado de UX: primeiro, registrar e enxergar — botão de falta, contador no histórico do paciente, painel simples por especialidade e dia da semana. Depois, com um ciclo de dados, decidimos lembrete e confirmação com números nossos, não benchmark de artigo.

**[15:24] Juliana:** Métricas então. Pedro?

**[15:25] Pedro:** Taxa de no-show por especialidade, dia, antecedência do agendamento e tipo de consulta — essa é a métrica mãe. Depois: tempo entre horário e marcação da falta, taxa de reversão de falta marcada errada, e, quando houver lembrete, taxa de resposta e no-show de quem confirmou versus quem silenciou.

**[15:26] Juliana:** Riscos de produto que levo para o papel: recepção não adotar o botão — mitigação é o desenho de um clique do Lucas; marcação errada virando constrangimento com paciente — mitigação é a reversão; e ansiedade da diretoria por pular direto para multa sem dado.

**[15:28] Fernanda:** Acrescenta mais um: lembrete demais vira spam. Paciente com três consultas no mês não pode receber seis mensagens. Tem que haver bom senso de frequência.

**[15:29] Juliana:** Anotado. Fechando: nada decidido sobre lembrete, confirmação, multa ou bloqueio — tudo hipótese aguardando dado. O que parece consenso para validar com a tecnologia: registrar a falta no fluxo do dia, com reversão, e medir. Pedro, agenda com o Rafael essa semana. Levamos as questões abertas: janela de atraso antes de marcar falta, quem pode reverter e até quando, custo de canal de lembrete e privacidade de histórico de faltas.

**[15:31] Lucas:** Mando amanhã o rascunho da agenda do dia com o estado "aguardando/não compareceu" para validarmos com a Fernanda antes da conversa técnica.

**[15:32] Juliana:** Perfeito. Obrigada, time.
