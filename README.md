<!-- MW-BRAND:BEGIN — gerado por IA/tools/mw-brand.sh · não editar à mão -->
<p align="center">
  <a href="https://github.com/visaodeempresa">
    <img src="docs/brand/logo.png" alt="Visão de Empresa — MAYCON WILLIAN OLIVEIRA" width="96">
  </a>
  <br>
  <sub><b>Visão de Empresa</b> · componente de Home Assistant por MAYCON WILLIAN OLIVEIRA</sub>
</p>
<!-- MW-BRAND:END -->

# MW Top Buttons Pack

[![HACS](https://img.shields.io/badge/HACS-Dashboard-41BDF5.svg)](https://hacs.xyz)

A fileira de botões que fica no **topo** do dashboard: um botão por grandeza,
quadrado ou redondo, papel neumórfico 3D, e o **fundo mudando de cor conforme
o estado do sensor**.

```
   ╭─────╮   ╭─────╮   ╭─────╮   ╭─────╮   ╭─────╮
   │  🌡  │   │  💧  │   │ CO₂ │   │  ⚡  │   │  🚪 │
   │23,4 │   │ 58  │   │1240 │   │1,9  │   │     │
   │ °C  │   │  %  │   │ ppm │   │ kW  │   │     │
   ╰─────╯   ╰─────╯   ╰─────╯   ╰─────╯   ╰─────╯
    verde     azul     laranja   laranja   laranja
     └── o papel É a leitura: mudou o sensor, mudou o papel ──┘
```

Um arquivo, **17 tipos de card**. Todos desenhados pelo mesmo motor, todos com
editor visual completo, todos 1:1 (largura = altura), todos com ação padrão
**«Nada»**.

| Tipo | Grandeza | Tipo | Grandeza |
|---|---|---|---|
| `mw-top-temperature-card` | Temperatura | `mw-top-co2-card` | Dióxido de carbono |
| `mw-top-humidity-card` | Umidade | `mw-top-formaldehyde-card` | Formaldeído |
| `mw-top-door-window-card` | Porta / janela | `mw-top-voc-card` | Compostos orgânicos voláteis |
| `mw-top-occupancy-card` | Ocupação humana | `mw-top-pm25-card` | PM2.5 |
| `mw-top-motion-card` | Movimento | `mw-top-pm10-card` | PM10 |
| `mw-top-illuminance-card` | Luminosidade | `mw-top-aqi-card` | Qualidade do ar |
| `mw-top-power-card` | Potência (soma) | `mw-top-battery-card` | Bateria |
| `mw-top-energy-card` | Consumo (soma) | `mw-top-noise-card` | Ruído |
| | | `mw-top-button-card` | Genérico (escolhe no editor) |

## O que ele faz de diferente

**O papel segue o estado.** Não é enfeite fixo: o fundo é a leitura traduzida
em papel. 23 °C dá papel verde, 34 °C dá papel vermelho, CO₂ em 1240 ppm dá
papel laranja. A rampa de cor e os limites das faixas são configuráveis no
editor — sem YAML, sem template.

**Temperatura e umidade obedecem à escala canônica da casa** (a mesma dos
`custom:button-card` dos dashboards). Ela vive no **anel** da borda, não no
número: amarelo puro de 25 °C é ilegível como texto sobre papel claro, mas num
anel fino é exatamente o sinal certo.

**Potência e consumo somam.** Escolha as entidades **ou** um ambiente inteiro —
no ambiente, o card resolve sozinho quem entra na conta pelo registro do HA
(área da entidade vence a área do dispositivo, como no próprio HA) e **converte
as unidades** antes de somar: 742,5 W + 1,2 kW = 1,9 kW, não 743,7.

**Ação padrão «Nada».** Botão de leitura não deve virar botão de acidente. Se
quiser, ligue toque / toque longo / toque duplo com o seletor de ação padrão do
HA (more-info, navegar, chamar ação, URL…).

**Papel claro e papel de noite.** Acompanha o tema do HA por padrão; dá para
travar num dos dois.

## Instalação

### HACS (recomendado)

1. HACS → **⋮** → **Repositórios personalizados**
2. URL: `https://github.com/visaodeempresa/mw-ha-top-buttons-pack` ·
   Categoria: **Dashboard**
3. Instalar **MW Top Buttons Pack** e recarregar a página (⌘⇧R).

### Manual

`dist/mw-top-buttons-pack.js` em `/config/www/` e o recurso
`/local/mw-top-buttons-pack.js` (Módulo JavaScript) em
**Configurações → Painéis → ⋮ → Recursos**.

## Uso

O mínimo:

```yaml
type: custom:mw-top-temperature-card
entity: sensor.sala_temperatura
```

A fileira de topo, numa view de seções:

```yaml
type: grid
columns: 5
square: false
cards:
  - { type: "custom:mw-top-temperature-card", entity: sensor.sala_temperatura }
  - { type: "custom:mw-top-humidity-card",    entity: sensor.sala_umidade }
  - { type: "custom:mw-top-co2-card",         entity: sensor.sala_co2 }
  - { type: "custom:mw-top-power-card",       area: sala }
  - { type: "custom:mw-top-door-window-card", entity: binary_sensor.porta_sala }
```

Soma por entidades, em círculo, com rótulo e toque abrindo o histórico:

```yaml
type: custom:mw-top-power-card
entities:
  - sensor.tomada_tv_potencia
  - sensor.tomada_rack_potencia
name: Sala
shape: circle
show_label: true
tap_action:
  action: more-info
```

Mais receitas em [`examples/`](examples/).

## Opções

| Chave | Padrão | O que é |
|---|---|---|
| `entity` | — | a entidade (grandezas de leitura única) |
| `entities` | — | lista que entra na soma (potência / consumo) |
| `area` | — | soma o ambiente inteiro (potência / consumo) |
| `kind` | — | grandeza, **só** no `mw-top-button-card` genérico |
| `name` | nome da entidade | rótulo |
| `icon` | automático | ícone fixo |
| `shape` | `rounded` | `rounded` (quadrado de cantos arredondados) ou `circle` |
| `corner` | `26` | arredondamento, em % do lado |
| `quality` | `alta` | `alta` · `equilibrada` · `plana` — ver *Desempenho* |
| `paper_theme` | `auto` | `auto` (segue o tema) · `claro` · `escuro` |
| `paper_mode` | `dinamico` | `dinamico` (muda com o estado) ou `fixo` |
| `paper_color` | `paper` | o papel, no modo fixo (49 tons + creme) |
| `paper_on` / `paper_off` | por grandeza | o papel de cada estado, nas grandezas liga/desliga |
| `ramp` | por grandeza | rampa de papel: `frio_quente`, `seco_umido`, `bom_ruim`, `ruim_bom`, `escuro_claro`, `vazio_cheio`, `neutro` |
| `stops` | por grandeza | limites das faixas: `"600,800,1000,1500"` |
| `unit` | a da entidade | unidade mostrada |
| `decimals` | automático | casas decimais (≥ 100 arredonda sozinho) |
| `show_icon` / `show_value` / `show_unit` / `show_label` / `show_ring` | `true`/`true`/`true`/`false`/`true` | o que aparece |
| `text_on` / `text_off` | por grandeza | texto das grandezas liga/desliga |
| `icon_size` / `value_size` | automático | tamanho em % do lado do botão |
| `tap_action` / `hold_action` / `double_tap_action` | `none` | ações no padrão do HA |

Os limites padrão de cada grandeza (`stops`) saem de referências públicas
(CO₂ ASHRAE/Anvisa, PM2.5 e AQI da EPA) e são **ponto de partida** — o editor
existe justamente para você ajustar à sua casa.

## Desempenho

O 3D é feito de camadas de sombra, e cada camada é uma passada de composição
do navegador. Num topo com 12 botões isso aparece em celular antigo. Por isso:

- **`quality: alta`** (padrão) — papel completo: 3 sombras projetadas, 2 de luz
  interna, brilho de canto.
- **`quality: equilibrada`** — 1 sombra projetada + 2 internas. Mesma
  linguagem, metade das camadas.
- **`quality: plana`** — sem relevo, para telas fracas ou muito botão junto.

Além disso o card **não reescreve o HTML a cada leitura**: estrutura e CSS são
montados uma vez por configuração e cada atualização de sensor só troca
variáveis CSS e texto. Tamanhos em `cqi` (unidade de container), então não há
uma linha de JS de medição.

## Verificação

```bash
node --check dist/mw-top-buttons-pack.js
node tools/probe.js
```

O `probe.js` instancia os 17 tipos fora do navegador e confere soma com
unidades misturadas, soma por ambiente, leitura morta, dinâmica do papel,
formato 1:1 e ação padrão «Nada».

## Licença

MIT © MAYCON WILLIAN OLIVEIRA
