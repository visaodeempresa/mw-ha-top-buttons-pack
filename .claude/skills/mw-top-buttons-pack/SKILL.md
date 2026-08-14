---
name: mw-top-buttons-pack
description: Mexer no MW Top Buttons Pack — a fileira de botões de leitura do topo dos dashboards (custom:mw-top-temperature-card, mw-top-co2-card, mw-top-power-card e os outros 14). Use quando o Maycon falar em "botões do topo", "os botõezinhos de sensor", "o quadradinho de CO₂/PM2.5/temperatura", "somar a potência do ambiente", "o papel não muda de cor", "quero uma grandeza nova no pack", ou quando pedir card redondo/quadrado 1:1 com papel 3D para mostrar sensor.
---

# MW Top Buttons Pack

Pacote HACS (categoria **Dashboard**) com 17 cards de leitura num arquivo só:
`dist/mw-top-buttons-pack.js` é fonte **e** artefato. JS puro + `<ha-form>`.

## Pré-condições

| Preciso de | Como obter | Se faltar |
|---|---|---|
| Node | `node --version` | sem `probe.js` |
| HTTP no HA | `curl -s -o /dev/null -w '%{http_code}' http://192.168.1.71:8123/` → `200` | verificar pela Nabu Casa |
| `HA_TOKEN` | `PROJECTS/ha-dashboards/.env` | sem instalar/atualizar por WebSocket |
| `gh` | `gh auth status` | PR/release pelo navegador |

## Onde mexer (mapa de 30 segundos)

| Quero | Vou em |
|---|---|
| grandeza nova | uma linha na tabela `KINDS` — o registro do `customElement` no fim do arquivo é automático |
| cor de fundo por faixa | `RAMPS`, o `stops` da grandeza, `_skin()` |
| estrutura/CSS do botão | `_build()` — roda **1× por configuração** |
| o que muda a cada leitura | `_paint()` — só variáveis CSS e `textContent` |
| campo do editor | `_schema()` + `LABELS` |
| soma de potência/consumo | `_ids()` (lista ou ambiente) e `F_POWER`/`F_ENERGY` |

**Nunca** volte a escrever `innerHTML` no caminho de atualização: doze botões
no topo de um dashboard recriariam doze shadow roots a cada leitura de sensor.

## Armadilhas (com sintoma observável)

| Sintoma | Causa | Correção |
|---|---|---|
| Uma cor da rampa nunca aparece (ex.: verde some da temperatura) | `rampKey()` reamostra por arredondamento; rampa com 8 entradas e 7 faixas pula uma | manter `len(RAMPS[x]) == len(stops) + 1` |
| Número ilegível em temperatura/umidade | escala canônica de clima usada como cor de texto (25 °C = amarelo puro) | escala no **anel** (`--mw-ring`); o número usa `accentOf()` do papel |
| Soma de potência ~40 % menor que o esperado | medidor em kW somado como W | `F_POWER`/`F_ENERGY` convertem antes de somar |
| Card do tipo `mw-top-door-window-card` abre o editor como «genérico» | regex `[a-z0-9_]+` não casa hífen no meio do tag | `_typeKind()` traduz hífen → sublinhado |
| Botão nasce clicável sem ação configurada | `_clickable()` só olha as três ações; qualquer default ≠ `none` estraga | ação padrão do pacote é `{action:"none"}` |
| YAML ganha `stops: null` ou perde campo escondido | editor devolvendo campo que o esquema tirou | `_onChange` ignora vazio/nulo e recopia o que sumiu do `v` |
| `check-embeds.sh` reprova | bloco canônico editado no card em vez da fonte | editar `IA/lib/…` e rodar `check-embeds.sh --fix` |

## Verificação (o que faz a tarefa estar pronta)

```bash
node --check dist/mw-top-buttons-pack.js
node tools/probe.js                      # 17 tipos + 12 conferências → "✓ tudo certo"
/Volumes/SSD-T1-01/CLAUDE-SSD/IA/tools/check-embeds.sh
curl -s http://192.168.1.71:8123/hacsfiles/mw-ha-top-buttons-pack/mw-top-buttons-pack.js | grep -o '%c [0-9.]*'
git log -1 --pretty='%G? %an'            # G + MAYCON WILLIAN OLIVEIRA
```

Conferência **de tela** é do dono (regra global 30) — relatar o que não foi
visto em vez de deixar implícito que foi.

## Instalar / atualizar no HA sem tocar na tela

`IA/runbooks/instalar-card-no-hacs-por-websocket.md`. Resumo: `hacs/repositories/add`
(plural!) com `category="plugin"`, depois `hacs/repository/download` com a
**versão explícita** — o `available_version` do HACS demora a atualizar.

Sem release publicada no GitHub o HACS não baixa nada: para teste rápido, o
caminho é o deploy por SSH (`IA/runbooks/deploy-card-hacs-ssh.md`), lembrando
de subir `.js` **e** `.js.gz`.
