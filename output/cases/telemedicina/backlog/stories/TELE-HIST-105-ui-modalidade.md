# TELE-HIST-105 — UI: seletor de modalidade, badge e link na agenda do dia

**Fase:** 1 · **Tamanho:** M · **Requisitos:** TELE-RF-007; TELE-RNF-003
**Evidência de origem:** [produto-telemedicina, @lucas, 14:12; @fernanda, 14:05/14:08]

## Narrativa
Como **recepcionista**, quero escolher a modalidade no fluxo de agendamento que
já uso, enxergar de forma inconfundível o que é vídeo na agenda, e copiar o
link em um clique quando o paciente ligar.

## Escopo técnico (apps/medagenda-web)
- Diálogo "Agendar consulta": seletor presencial/vídeo + tipo de consulta;
  vídeo desabilitado (com explicação) quando flag desligada, médico sem regra
  compatível ou tipo inelegível; slots recarregam por modalidade.
- Listagem/agenda: badge `VIDEO` de alto contraste; coluna/ação de link
  (ver + copiar) só para consultas de vídeo.
- Nenhuma tela nova: tudo nos fluxos existentes (lição da lista de espera).
- Depende de TELE-HIST-101…104.

## Critérios de aceitação (Gherkin)

```gherkin
Funcionalidade: Modalidade na interface

  Cenário: Seleção no fluxo existente
    Dado flag ligada e médico com regra BOTH
    Quando a recepção abre "Agendar consulta" e escolhe modalidade Vídeo e tipo Retorno
    Então os slots exibidos são os de vídeo e a confirmação mostra badge VIDEO

  Cenário: Vídeo indisponível explicado
    Dado um médico sem regra de vídeo
    Quando a recepção seleciona modalidade Vídeo
    Então a opção aparece desabilitada com o motivo

  Cenário: Link em um clique
    Dado uma teleconsulta com link gravado
    Quando a recepção clica em copiar na agenda do dia
    Então o link vai para a área de transferência com feedback visual

  Cenário: Inconfundível
    Dado consultas das duas modalidades no mesmo dia
    Então toda ocorrência de vídeo exibe o badge em lista, diálogo e dashboard
```
