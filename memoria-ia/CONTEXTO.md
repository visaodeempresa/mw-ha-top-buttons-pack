# Contexto para a próxima sessão de IA

**O que é:** pacote HACS (categoria Dashboard) com 17 cards de leitura para o
topo dos dashboards. Um arquivo, 17 `customElements`, um motor só.

**Onde mexer:**

| Quero | Vou em |
|---|---|
| grandeza nova | tabela `KINDS` — uma linha (o registro no fim do arquivo é automático) |
| cor de fundo por faixa | `RAMPS` + `stops` da grandeza + `_skin()` |
| o que aparece dentro do botão | `_build()` (estrutura/CSS, roda 1× por config) |
| valor/cor a cada leitura | `_paint()` (só variáveis CSS e textContent) |
| campo do editor | `_schema()` + `LABELS` |

**Armadilhas já pagas:**

- `rampKey()` reamostra a rampa para o número de faixas. Se a rampa tem 8
  entradas e as faixas são 7, o arredondamento **pula** uma cor (a verde
  sumia da temperatura). Regra: manter `len(RAMPS[x]) == len(stops) + 1`.
- A escala canônica de clima como cor de **texto** é ilegível (25 °C = amarelo
  puro). Ela vive no anel; o número usa a tinta derivada do papel.
- Somar potência sem converter unidade dá número plausível e errado
  (742,5 W + 1,2 kW = 743,7 em vez de 1942,5). `F_POWER` / `F_ENERGY`.
- Área da **entidade** vence a área do **dispositivo** na resolução por
  ambiente — é a regra do próprio HA, e o `probe.js` trava isso.
- O tag usa hífen e a chave de `KINDS` usa sublinhado
  (`door_window` → `mw-top-door-window-card`); o editor traduz de volta em
  `_typeKind()`. Regex com `[a-z0-9_]+` no meio do tag **não** casa.

**Verificar:** `node --check dist/…`, `node tools/probe.js`,
`IA/tools/check-embeds.sh`. Conferência de tela é do dono (regra global 30).

**DevOps:** ainda **não** aplicado — o dono pediu para padronizar só depois da
validação visual. Quando for: `IA/tools/mw-devops.sh apply mw-ha-top-buttons-pack`
e a skill `mw-devops-repo`.
