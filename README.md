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

**O fundo é o estado — e a intensidade dele.** Não é enfeite fixo: a matiz diz
*o quê* (verde = bom, vermelho = ruim) e o tom diz *quanto*. Quarto no breu dá
papel escuro; varanda ao sol dá papel quase branco. CO₂ em 500 ppm é um verde
calmo; em 1500 ppm é um vermelho encardido. Cada grandeza já nasce com rampa,
limites e alcance próprios — e tudo é editável.

**A exceção são os estados conhecidos.** Porta/janela, ocupação e movimento não
têm gradação: aberta é **verde**, fechada é **vermelho**, e pronto — a mesma
convenção dos outros componentes MW da casa. Sensor que não respondeu ganha um
vermelho que se nota sem gritar.

**Temperatura e umidade usam a escala canônica da casa** (a mesma dos
`custom:button-card` dos dashboards): a **matiz** vem inteira da escala, e só a
saturação e a luminosidade são trazidas para a faixa do papel. Chapada, a
escala vira néon — 25 °C nela é amarelo puro. Amansada, continua sendo a escala
e volta a ser papel. A cor crua da escala fica no **anel** da borda.

**Potência e consumo somam.** Escolha as entidades **ou** um ambiente inteiro —
no ambiente, o card resolve sozinho quem entra na conta pelo registro do HA
(área da entidade vence a área do dispositivo, como no próprio HA) e **converte
as unidades** antes de somar: 742,5 W + 1,2 kW = 1,9 kW, não 743,7.

**Ação padrão «Nada».** Botão de leitura não deve virar botão de acidente. Se
quiser, ligue toque / toque longo / toque duplo com o seletor de ação padrão do
HA (more-info, navegar, chamar ação, URL…).

**Seis papéis, não dois.** Acompanha o tema do HA por padrão, ou trava em um
dos cinco degraus: papel de dia · dia puxado para o escuro · meio do caminho ·
noite puxado para o claro · papel de noite.

<!-- GALERIA:BEGIN — gerado por tools/galeria.js · não editar à mão -->
## Galeria

As duas imagens abaixo e todo o YAML desta seção saem da **mesma** fonte — as
filas da bancada (`docs/preview.html`), transcritas por `tools/galeria.js`.
Não existe aqui um card que a imagem mostre e o código não faça.

<table><tr>
<td width="50%"><img src="https://raw.githubusercontent.com/visaodeempresa/mw-ha-top-buttons-pack/main/docs/preview-dia.png" alt="MW Top Buttons Pack — papel de dia"><br><sub>papel de dia</sub></td>
<td width="50%"><img src="https://raw.githubusercontent.com/visaodeempresa/mw-ha-top-buttons-pack/main/docs/preview-noite.png" alt="MW Top Buttons Pack — papel de noite"><br><sub>papel de noite</sub></td>
</tr></table>

> As duas imagens são geradas em modo headless a partir da própria bancada —
> receita em [`docs/README-imagens.md`](docs/README-imagens.md). Depois de mexer
> nas filas, rode `node tools/galeria.js` para o YAML acompanhar.

### A mesma grandeza, três leituras — o papel É a leitura

```yaml
type: grid
columns: 7
square: false
cards:
  - type: custom:mw-top-temperature-card
    entity: sensor.varanda_temperatura
    show_label: true
  - type: custom:mw-top-temperature-card
    entity: sensor.sala_temperatura
    show_label: true
  - type: custom:mw-top-temperature-card
    entity: sensor.sotao_temperatura
    show_label: true
  - type: custom:mw-top-humidity-card
    entity: sensor.escritorio_umidade
    show_label: true
  - type: custom:mw-top-humidity-card
    entity: sensor.sala_umidade
    show_label: true
  - type: custom:mw-top-co2-card
    entity: sensor.sala_co2
    show_label: true
  - type: custom:mw-top-co2-card
    entity: sensor.quarto_co2
    show_label: true
```

### O fundo é o estado E a intensidade dele — luminosidade acende o papel

```yaml
type: grid
columns: 7
square: false
cards:
  - type: custom:mw-top-illuminance-card
    entity: sensor.quarto_luminosidade
    show_label: true
  - type: custom:mw-top-illuminance-card
    entity: sensor.sala_luminosidade
    show_label: true
  - type: custom:mw-top-illuminance-card
    entity: sensor.varanda_luminosidade
    show_label: true
  - type: custom:mw-top-battery-card
    entity: sensor.porta_sensor_bateria
    show_label: true
  - type: custom:mw-top-door-window-card
    entity: binary_sensor.porta_da_sala
    show_value: true
  - type: custom:mw-top-door-window-card
    entity: binary_sensor.janela_da_sala
    show_value: true
  - type: custom:mw-top-temperature-card
    entity: sensor.sensor_caido
    show_label: true
```

### Temperatura e umidade: o papel É a escala canônica da casa

```yaml
type: grid
columns: 7
square: false
cards:
  - type: custom:mw-top-temperature-card
    entity: sensor.freezer_temperatura
    show_label: true
  - type: custom:mw-top-temperature-card
    entity: sensor.varanda_temperatura
    show_label: true
  - type: custom:mw-top-temperature-card
    entity: sensor.sala_temperatura
    show_label: true
  - type: custom:mw-top-temperature-card
    entity: sensor.sotao_temperatura
    show_label: true
  - type: custom:mw-top-humidity-card
    entity: sensor.escritorio_umidade
    show_label: true
  - type: custom:mw-top-humidity-card
    entity: sensor.sala_umidade
    show_label: true
  - type: custom:mw-top-humidity-card
    entity: sensor.banheiro_umidade
    show_label: true
```

### Os cinco degraus de papel (o mesmo CO₂ de 1240 ppm)

```yaml
type: grid
columns: 7
square: false
cards:
  - type: custom:mw-top-co2-card
    entity: sensor.quarto_co2
    paper_theme: claro
  - type: custom:mw-top-co2-card
    entity: sensor.quarto_co2
    paper_theme: claro-medio
  - type: custom:mw-top-co2-card
    entity: sensor.quarto_co2
    paper_theme: medio
  - type: custom:mw-top-co2-card
    entity: sensor.quarto_co2
    paper_theme: escuro-medio
  - type: custom:mw-top-co2-card
    entity: sensor.quarto_co2
    paper_theme: escuro
  - type: custom:mw-top-aqi-card
    entity: sensor.purificador_qualidade_do_ar
    show_label: true
  - type: custom:mw-top-voc-card
    entity: sensor.escritorio_cov
    show_label: true
```

### O pacote inteiro (quadrado de cantos arredondados)

```yaml
type: grid
columns: 7
square: false
cards:
  - type: custom:mw-top-temperature-card
    entity: sensor.sala_temperatura
  - type: custom:mw-top-humidity-card
    entity: sensor.sala_umidade
  - type: custom:mw-top-door-window-card
    entity: binary_sensor.porta_da_sala
  - type: custom:mw-top-door-window-card
    entity: binary_sensor.janela_da_sala
  - type: custom:mw-top-occupancy-card
    entity: binary_sensor.escritorio_ocupacao
  - type: custom:mw-top-motion-card
    entity: binary_sensor.corredor_movimento
  - type: custom:mw-top-illuminance-card
    entity: sensor.corredor_luminosidade
  - type: custom:mw-top-power-card
    entities:
      - sensor.tomada_rack_potencia
      - sensor.chuveiro_potencia
  - type: custom:mw-top-energy-card
    entity: sensor.casa_consumo
  - type: custom:mw-top-co2-card
    entity: sensor.quarto_co2
  - type: custom:mw-top-formaldehyde-card
    entity: sensor.sala_formaldeido
  - type: custom:mw-top-voc-card
    entity: sensor.sala_cov
  - type: custom:mw-top-pm25-card
    entity: sensor.sala_pm25
  - type: custom:mw-top-pm10-card
    entity: sensor.sala_pm10
  - type: custom:mw-top-aqi-card
    entity: sensor.casa_qualidade_do_ar
  - type: custom:mw-top-battery-card
    entity: sensor.porta_sensor_bateria
  - type: custom:mw-top-noise-card
    entity: sensor.sala_ruido
  - type: custom:mw-top-temperature-card
    entity: sensor.sensor_caido
```

### Círculo, com rótulo

```yaml
type: grid
columns: 6
square: false
cards:
  - type: custom:mw-top-temperature-card
    entity: sensor.sala_temperatura
    shape: circle
    show_label: true
  - type: custom:mw-top-humidity-card
    entity: sensor.sala_umidade
    shape: circle
    show_label: true
  - type: custom:mw-top-co2-card
    entity: sensor.quarto_co2
    shape: circle
    show_label: true
  - type: custom:mw-top-power-card
    entities:
      - sensor.tomada_rack_potencia
      - sensor.chuveiro_potencia
    shape: circle
    show_label: true
    name: Sala
  - type: custom:mw-top-occupancy-card
    entity: binary_sensor.escritorio_ocupacao
    shape: circle
    show_label: true
  - type: custom:mw-top-battery-card
    entity: sensor.porta_sensor_bateria
    shape: circle
    show_label: true
```

### Ícone como marca d'água — o valor fica sozinho e maior

```yaml
type: grid
columns: 7
square: false
cards:
  - type: custom:mw-top-temperature-card
    entity: sensor.sala_temperatura
    icon_background: true
  - type: custom:mw-top-humidity-card
    entity: sensor.sala_umidade
    icon_background: true
  - type: custom:mw-top-co2-card
    entity: sensor.quarto_co2
    icon_background: true
  - type: custom:mw-top-pm25-card
    entity: sensor.sala_pm25
    icon_background: true
  - type: custom:mw-top-power-card
    entities:
      - sensor.tomada_rack_potencia
      - sensor.chuveiro_potencia
    icon_background: true
  - type: custom:mw-top-illuminance-card
    entity: sensor.varanda_luminosidade
    icon_background: true
  - type: custom:mw-top-temperature-card
    entity: sensor.sala_temperatura
    icon_background: true
    icon_opacity: 0.4
```

### Os três níveis de 3D · e só o ícone

```yaml
type: grid
columns: 7
square: false
cards:
  - type: custom:mw-top-co2-card
    entity: sensor.quarto_co2
    quality: alta
  - type: custom:mw-top-co2-card
    entity: sensor.quarto_co2
    quality: equilibrada
  - type: custom:mw-top-co2-card
    entity: sensor.quarto_co2
    quality: plana
  - type: custom:mw-top-temperature-card
    entity: sensor.sotao_temperatura
    show_value: false
  - type: custom:mw-top-door-window-card
    entity: binary_sensor.porta_da_sala
    shape: circle
  - type: custom:mw-top-humidity-card
    entity: sensor.sala_umidade
    show_icon: false
  - type: custom:mw-top-temperature-card
    entity: sensor.sala_temperatura
    show_ring: false
  - type: custom:mw-top-temperature-card
    entity: sensor.sala_temperatura
    paper_mode: fixo
    paper_color: violet-3
```

<!-- GALERIA:END -->

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
| `paper_theme` | `auto` | `auto` (segue o tema do HA) · `claro` · `claro-medio` · `medio` · `escuro-medio` · `escuro` |
| `paper_mode` | `dinamico` | `dinamico` (muda com o estado) ou `fixo` |
| `paper_color` | `paper` | o papel, no modo fixo (49 tons + creme) |
| `paper_on` / `paper_off` | por grandeza | o papel de cada estado, nas grandezas liga/desliga |
| `ramp` | por grandeza | rampa de papel: `frio_quente`, `seco_umido`, `bom_ruim`, `ruim_bom`, `escuro_claro`, `vazio_cheio`, `neutro` |
| `stops` | por grandeza | limites das faixas: `"600,800,1000,1500"` |
| `intensity` | por rampa | 0–100 %: quanto o estado escurece ou acende o papel além da matiz |
| `unit` | a da entidade | unidade mostrada |
| `decimals` | automático | casas decimais (≥ 100 arredonda sozinho) |
| `show_icon` / `show_value` / `show_unit` / `show_label` / `show_ring` | `true`/`true`/`true`/`false`/`true` | o que aparece |
| `text_on` / `text_off` | por grandeza | texto das grandezas liga/desliga |
| `icon_size` / `value_size` | automático | tamanho em % do lado do botão |
| `tap_action` / `hold_action` / `double_tap_action` | `none` | ações no padrão do HA |

Os limites padrão de cada grandeza (`stops`) saem de referências públicas
(CO₂ ASHRAE/Anvisa, PM2.5 e AQI da EPA) e são **ponto de partida** — o editor
existe justamente para você ajustar à sua casa. Quando a unidade muda, os
limites mudam junto: COV em `ppm` não usa os mesmos números do COV em `ppb`.

## Sensores teimosos

Nem toda integração declara `device_class`. Tuya, por exemplo, entrega COV em
`ppm`, formaldeído em `mg/m³` e PM2.5 **sem unidade nenhuma** — um seletor que
filtrasse só por `device_class` devolveria lista vazia num sensor que existe e
funciona. Por isso o editor procura em cascata: **classe → unidade → nome em
pt-BR**, e só cai no domínio inteiro se as três falharem.

E há sensor que devolve palavra em vez de número: o purificador diz `great`.
O card de qualidade do ar traduz (`Ótima`, `Boa`, `Média`, `Ruim`, `Péssima`) e
usa a palavra para escolher o papel.

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
node tools/galeria.js --check
```

O `probe.js` instancia os 17 tipos fora do navegador e confere soma com
unidades misturadas, soma por ambiente, leitura morta, dinâmica do papel, os
cinco degraus, o anel concêntrico, os sensores sem `device_class`, o formato
1:1 e a ação padrão «Nada». O `galeria.js --check` reprova se o YAML do README
tiver saído de sincronia com a bancada que gerou as imagens.

## Licença

MIT © MAYCON WILLIAN OLIVEIRA
