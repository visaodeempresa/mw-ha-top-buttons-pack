/* mw-ha-top-buttons-pack — a família de botões de topo (custom:mw-top-*-card)
 *
 * Um arquivo, N cards: cada grandeza da casa (temperatura, umidade, porta,
 * ocupação, movimento, luminosidade, potência, consumo, CO₂, formaldeído,
 * COV, PM2.5, PM10, qualidade do ar, bateria, ruído + um genérico) vira um
 * tipo próprio no seletor de cards do Lovelace, todos desenhados pelo MESMO
 * motor. Quadrado 1:1 ou círculo, papel neumórfico 3D, cor do papel seguindo
 * o estado, editor visual completo, ação padrão «Nada».
 *
 * Repo: https://github.com/visaodeempresa/mw-ha-top-buttons-pack
 * Sem build, sem dependências: JS puro + <ha-form> do próprio HA.
 */
(() => {
  "use strict";

  const VERSION = "0.2.2";

  // Leitura morta: a entidade existe mas não tem valor. Escrever "unavailable"
  // dentro de um botão de 90 px é ilegível e não informa nada — fica o
  // travessão, que segura a linha no lugar sem mentir um número.
  const NO_READING = "—";
  const isDead = (s) => s === undefined || s === null || s === "" ||
    s === "unavailable" || s === "unknown" || s === "none";
  const num = (v) => { const n = Number.parseFloat(v); return Number.isFinite(n) ? n : null; };

  // >>> paper-palette v1 — fonte canônica: /Volumes/SSD-T1-01/CLAUDE-SSD/IA/lib/paper-palette/paper-palette.js
  // 49 papéis encardidos: 7 matizes do arco-íris × 7 tons (1 = quase branco,
  // 7 = mais encardido). Saturação baixa de propósito — papel descansa a vista.
  const PAPER_HUES = [
    ["red", "Vermelho", 6], ["orange", "Laranja", 27], ["yellow", "Amarelo", 47],
    ["green", "Verde", 96], ["blue", "Azul", 203], ["indigo", "Anil", 236],
    ["violet", "Violeta", 283],
  ];
  const PAPER_TONES = [[97, 6], [96, 9], [94, 12], [92, 15], [90, 18], [88, 21], [85, 24]];
  const PAPER_DEFAULT = "linear-gradient(145deg, #fdfaf3, #e8e3d8)";
  const paperGradient = (key) => {
    const m = /^([a-z]+)-([1-7])$/.exec(String(key || "").trim());
    if (!m) return PAPER_DEFAULT;
    const hue = PAPER_HUES.find((h) => h[0] === m[1]);
    if (!hue) return PAPER_DEFAULT;
    const [l, s] = PAPER_TONES[+m[2] - 1];
    return `linear-gradient(145deg, hsl(${hue[2]}, ${s}%, ${l}%), hsl(${hue[2]}, ${s + 4}%, ${l - 7}%))`;
  };
  const paperOptions = () => [{ value: "paper", label: "Papel original (creme)" }].concat(
    ...PAPER_HUES.map((h) => PAPER_TONES.map((t, i) => ({
      value: `${h[0]}-${i + 1}`,
      label: `${h[1]} · tom ${i + 1}${i === 0 ? " (mais claro)" : i === 6 ? " (mais encardido)" : ""}`,
    }))));
  // <<< paper-palette v1

  // >>> paper-dark-palette v1 — fonte canônica: /Volumes/SSD-T1-01/CLAUDE-SSD/IA/lib/paper-dark-palette/paper-dark-palette.js
  // 49 papéis de noite: as mesmas 7 matizes do paper-palette v1 × 7 tons
  // (1 = papel escuro mais claro, 7 = mais encardido). A saturação sobe mais
  // rápido que na rampa clara porque matiz em luminosidade baixa desaparece.
  const PAPER_DARK_HUES = [
    ["red", "Vermelho", 6], ["orange", "Laranja", 27], ["yellow", "Amarelo", 47],
    ["green", "Verde", 96], ["blue", "Azul", 203], ["indigo", "Anil", 236],
    ["violet", "Violeta", 283],
  ];
  const PAPER_DARK_TONES = [[26, 10], [24, 13], [21, 16], [19, 19], [16, 22], [14, 25], [11, 28]];
  const PAPER_DARK_DEFAULT = "linear-gradient(145deg, #2b2825, #161411)";
  const paperDarkGradient = (key) => {
    const m = /^([a-z]+)-([1-7])$/.exec(String(key || "").trim());
    if (!m) return PAPER_DARK_DEFAULT;
    const hue = PAPER_DARK_HUES.find((h) => h[0] === m[1]);
    if (!hue) return PAPER_DARK_DEFAULT;
    const [l, s] = PAPER_DARK_TONES[+m[2] - 1];
    return `linear-gradient(145deg, hsl(${hue[2]}, ${s}%, ${l}%), hsl(${hue[2]}, ${s + 6}%, ${Math.max(4, l - 6)}%))`;
  };
  const paperDarkOptions = () => [{ value: "paper", label: "Papel de noite (grafite)" }].concat(
    ...PAPER_DARK_HUES.map((h) => PAPER_DARK_TONES.map((t, i) => ({
      value: `${h[0]}-${i + 1}`,
      label: `${h[1]} · tom ${i + 1}${i === 0 ? " (mais claro)" : i === 6 ? " (mais escuro)" : ""}`,
    }))));
  // Tinta que se lê sobre o papel do modo pedido. Não é contraste calculado:
  // é o par fixo que a casa usa, para dois cards lado a lado combinarem.
  const paperInk = (dark) => (dark
    ? { text: "rgba(247, 244, 236, 0.94)", dim: "rgba(247, 244, 236, 0.62)", line: "rgba(255, 255, 255, 0.14)" }
    : { text: "rgba(28, 25, 20, 0.92)", dim: "rgba(28, 25, 20, 0.58)", line: "rgba(0, 0, 0, 0.14)" });
  // <<< paper-dark-palette v1

  // >>> mw-climate-scale v1 — fonte canônica: /Volumes/SSD-T1-01/CLAUDE-SSD/IA/lib/mw-climate-scale/mw-climate-scale.js
  // Escala canônica de cor por temperatura (°C) e umidade relativa (%).
  // Regra: IA/rules/global/40-cores-de-temperatura-e-umidade.md.
  const MW_CLIMATE_SCALE_ALPHA = 0.5;

  // 19 limites superiores inclusivos → 20 cores (a última vale de 46 °C para cima).
  const MW_TEMP_STOPS = [
    3.99, 6.99, 8.99, 13.99, 15.99, 17.99, 18.99, 20.99, 21.99, 22.99,
    23.99, 24.99, 25.99, 26.99, 29.99, 32.99, 35.99, 39.99, 45.99,
  ];
  const MW_TEMP_RGB = (
    "0,0,0 0,0,139 0,0,255 70,130,180 0,206,209 64,224,208 0,255,255 144,238,144 0,255,0 50,205,50 " +
    "127,255,0 154,205,50 255,255,0 255,215,0 255,165,0 255,99,71 255,69,0 178,34,34 139,0,0 139,0,0"
  ).split(" ");

  // Uma faixa por ponto percentual: índice n cobre [n, n+1); 100 é faixa própria.
  // O template original fecha a faixa em n.99 e deixa (n.99, n+1) sem dono — o
  // laço cai no fallback, que é a cor de 100% (preto). Sensor que reporte
  // 58,995 % pisca preto. Aqui o vão é fechado de propósito.
  const MW_HUM_RGB = (
    "0,0,0 51,0,0 102,0,0 153,0,0 204,0,0 255,0,0 255,11,0 255,22,0 255,33,0 255,45,0 " +
    "255,56,0 255,67,0 255,78,0 255,89,0 255,100,0 255,111,0 255,122,0 255,133,0 255,144,0 255,155,0 " +
    "255,165,0 255,170,0 255,174,0 255,179,0 255,183,0 255,188,0 255,192,0 255,197,0 255,201,0 255,206,0 " +
    "255,210,0 255,215,0 255,219,0 255,224,0 255,228,0 255,233,0 255,237,0 255,242,0 255,246,0 255,251,0 " +
    "255,255,0 170,255,85 85,255,170 0,255,255 12,252,253 24,249,251 36,246,249 48,243,247 60,240,245 72,237,243 " +
    "84,234,241 96,231,239 108,228,237 120,225,235 132,222,234 144,219,231 156,216,229 173,216,230 115,144,238 58,72,246 " +
    "0,0,255 0,0,249 0,0,243 0,0,237 0,0,231 0,0,225 0,0,219 0,0,213 0,0,207 0,0,201 " +
    "0,0,195 0,0,189 0,0,183 0,0,177 0,0,171 0,0,165 0,0,159 0,0,153 0,0,147 0,0,141 " +
    "0,0,139 0,0,132 0,0,125 0,0,118 0,0,111 0,0,104 0,0,97 0,0,90 0,0,83 0,0,76 " +
    "0,0,69 0,0,62 0,0,55 0,0,48 0,0,41 0,0,34 0,0,27 0,0,20 0,0,13 0,0,6 " +
    "0,0,0"
  ).split(" ");
  const MW_HUM_STOPS = MW_HUM_RGB.slice(1).map((_, i) => i + 0.99);

  const mwClimateRgba = (triplet, alpha) => `rgba(${triplet.split(",").join(", ")}, ${alpha})`;

  // Faixas + cores no formato do algoritmo de faixa comum: a cor é a primeira
  // cujo limite superior não foi ultrapassado. `clamp` existe porque umidade
  // fora de 0..100 é ruído de sensor, não frio.
  const mwClimateScale = (kind, alpha) => {
    const a = Number.isFinite(Number(alpha)) ? Number(alpha) : MW_CLIMATE_SCALE_ALPHA;
    const hum = kind === "hum" || kind === "humidity" || kind === "umidade";
    return {
      stops: hum ? MW_HUM_STOPS : MW_TEMP_STOPS,
      colors: (hum ? MW_HUM_RGB : MW_TEMP_RGB).map((t) => mwClimateRgba(t, a)),
      clamp: hum ? [0, 100] : null,
    };
  };

  // Cor seca (sem degradê), do jeito que o button-card faz.
  const mwClimateColor = (kind, value, alpha) => {
    const s = mwClimateScale(kind, alpha);
    let v = Number(value);
    if (!Number.isFinite(v)) return null;
    if (s.clamp) v = Math.min(s.clamp[1], Math.max(s.clamp[0], v));
    const i = s.stops.findIndex((stop) => v <= stop);
    return s.colors[i === -1 ? s.stops.length : i];
  };
  // <<< mw-climate-scale v1

  /* ---------------- papel: uma superfície contínua ----------------------- */

  // O papel do pacote é a MESMA rampa canônica embutida acima, só que contínua
  // em dois eixos:
  //   nivel  0..1  intensidade do estado — 0 = calmo/aceso, 1 = alarme/apagado
  //   tom    0..1  claridade do papel     — 0 = papel de dia, 1 = papel de noite
  // Em tom 0, `nivel = k/6` devolve exatamente o papel `<matiz>-<k+1>` da rampa
  // clara; em tom 1, o da rampa escura. Os três meios-termos que o dono pediu
  // (claro-médio, médio, escuro-médio) são a interpolação entre as duas — não
  // uma terceira tabela para manter em sincronia.
  const HUE_OF = {};
  for (const h of PAPER_HUES) HUE_OF[h[0]] = h[2];
  const lerp = (a, b, t) => a + (b - a) * t;
  const luma = (r, g, b) => (0.299 * r + 0.587 * g + 0.114 * b) / 2.55;

  const CREME = [[253, 250, 243], [232, 227, 216]];
  const GRAFITE = [[43, 40, 37], [22, 20, 17]];
  const mixRgb = (a, b, t) => a.map((c, i) => Math.round(lerp(c, b[i], t)));

  // Devolve { bg, L }: o fundo e a luminosidade do papel resultante. É o L que
  // decide a tinta — nada aqui adivinha contraste.
  const paperSurface = (hueName, nivel, tom) => {
    const k = Math.max(0, Math.min(6, Math.round(nivel * 6)));
    if (!hueName || HUE_OF[hueName] === undefined) {
      // sem matiz: creme ↔ grafite, com o nível dando só uma encardida
      const d = 1 - nivel * 0.07;
      const st = (i) => mixRgb(CREME[i], GRAFITE[i], tom).map((c) => Math.round(c * d));
      const a = st(0), b = st(1);
      return {
        bg: `linear-gradient(145deg, rgb(${a.join(", ")}), rgb(${b.join(", ")}))`,
        L: luma(a[0], a[1], a[2]),
      };
    }
    const h = HUE_OF[hueName];
    const [lL, lS] = PAPER_TONES[k];
    const [dL, dS] = PAPER_DARK_TONES[k];
    const L = lerp(lL, dL, tom), S = lerp(lS, dS, tom);
    const L2 = lerp(lL - 7, Math.max(4, dL - 6), tom), S2 = lerp(lS + 4, dS + 6, tom);
    return {
      bg: `linear-gradient(145deg, hsl(${h}, ${S.toFixed(1)}%, ${L.toFixed(1)}%), hsl(${h}, ${S2.toFixed(1)}%, ${L2.toFixed(1)}%))`,
      L,
    };
  };

  // Temperatura e umidade não escolhem matiz: o papel **é** a escala canônica
  // da casa (regra global 40), pousada como camada sobre o papel neutro. Duas
  // camadas de fundo em vez de uma cor chapada — assim o papel continua papel,
  // com o mesmo degradê de 145°, e a escala continua sendo a escala.
  const rgbOf = (str) => {
    const m = /(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/.exec(String(str || ""));
    return m ? [+m[1], +m[2], +m[3]] : null;
  };
  const rgb2hsl = (r, g, b) => {
    r /= 255; g /= 255; b /= 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
    const l = (mx + mn) / 2;
    if (!d) return [0, 0, l * 100];
    const s = d / (1 - Math.abs(2 * l - 1));
    const h = mx === r ? ((g - b) / d + (g < b ? 6 : 0))
      : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return [h * 60, s * 100, l * 100];
  };

  // A escala canônica foi feita para pintar área com força total: 25 °C nela é
  // amarelo PURO. Chapada num botão de 90 px vira néon, e néon não é papel.
  // Aqui a MATIZ — que é o que a regra 40 realmente define — passa intacta, e
  // só a saturação e a luminosidade são trazidas para a faixa do papel. O tom
  // relativo da escala sobrevive (2 °C continua mais escuro que 25 °C), então
  // a intensidade continua se lendo no fundo.
  const paperTinted = (rgb, tom) => {
    const [h, s0, l0] = rgb2hsl(rgb[0], rgb[1], rgb[2]);
    const S = Math.min(s0, lerp(52, 46, tom));
    const L = lerp(lerp(32, 88, l0 / 100), lerp(9, 34, l0 / 100), tom);
    const L2 = Math.max(4, L - lerp(7, 6, tom));
    return {
      bg: `linear-gradient(145deg, hsl(${h.toFixed(0)}, ${S.toFixed(1)}%, ${L.toFixed(1)}%), hsl(${h.toFixed(0)}, ${(S + lerp(4, 6, tom)).toFixed(1)}%, ${L2.toFixed(1)}%))`,
      L,
    };
  };

  // Tinta e destaque saem do L do papel, não do tema: um papel vermelho escuro
  // no tema claro pede letra clara igual, e a conta é a mesma.
  const ESCURO = (L) => L < 52;
  const inkOn = (L) => paperInk(ESCURO(L));
  const accentOn = (hueName, L) => {
    const h = HUE_OF[hueName];
    if (h === undefined) return ESCURO(L) ? "rgba(247, 244, 236, 0.94)" : "rgba(28, 25, 20, 0.90)";
    return ESCURO(L) ? `hsl(${h}, 62%, 74%)` : `hsl(${h}, 74%, 27%)`;
  };

  // Opções de papel para um lado de um estado binário: a primeira é o padrão
  // da grandeza (verde para aberta, vermelho para fechada), e só depois vêm os
  // 49 papéis, para quem quiser fugir da convenção da casa.
  const NOME_MATIZ = {};
  for (const h of PAPER_HUES) NOME_MATIZ[h[0]] = h[1];
  const paperEstadoOptions = (lado) => [{
    value: "",
    label: `Padrão da grandeza (${(NOME_MATIZ[lado.hue] || "neutro").toLowerCase()} · intensidade ${Math.round(lado.nivel * 6) + 1})`,
  }].concat(paperOptions());

  // Rampas: a matiz conta **o quê** (verde = bom, vermelho = ruim) e o nível
  // conta **quanto** — que é a regra do dono: o fundo é o estado E a
  // intensidade dele. `dir` diz para que lado o valor alto empurra o nível:
  //   "up"   valor alto = mais intenso/encardido (poluente, consumo, ruído)
  //   "down" valor alto = mais aceso/claro (luminosidade, bateria)
  // `alcance` é o quanto o nível pode empurrar o próprio TOM do papel, além da
  // matiz. Sem ele a rampa clara varia só 12 pontos de luminosidade (97 → 85) e
  // «quarto no breu» fica quase igual a «quarto aceso» — que é justamente o que
  // o dono não quer. Com alcance 0,55, o breu vai parar em L≈44: escuro de
  // verdade, no tema claro. Estado conhecido (porta, ocupação) não usa isto —
  // lá o papel é fixo por estado, de propósito.
  const RAMPS = {
    bom_ruim: { hues: ["green", "green", "yellow", "orange", "red"], dir: "up", alcance: 0.28 },
    ruim_bom: { hues: ["red", "orange", "yellow", "green", "green"], dir: "down", alcance: 0.28 },
    escuro_claro: { hues: ["indigo", "indigo", "blue", "yellow", "yellow"], dir: "down", alcance: 0.55 },
    claro_escuro: { hues: ["yellow", "yellow", "blue", "indigo", "indigo"], dir: "up", alcance: 0.55 },
    vazio_cheio: { hues: ["red", "orange", "yellow", "green", "green"], dir: "down", alcance: 0.3 },
    frio_quente: { hues: ["indigo", "blue", "green", "yellow", "orange", "red", "red"], dir: "up", alcance: 0.25 },
    seco_umido: { hues: ["red", "orange", "yellow", "green", "blue", "blue", "indigo"], dir: "up", alcance: 0.25 },
    neutro: { hues: [], dir: "up", alcance: 0.35 },
  };
  const RAMP_LABELS = {
    bom_ruim: "Bom → ruim (verde · amarelo · laranja · vermelho, escurecendo)",
    ruim_bom: "Ruim → bom (vermelho · amarelo · verde, clareando)",
    escuro_claro: "Escuro → claro (anil · azul · amarelo, acendendo)",
    claro_escuro: "Claro → escuro (amarelo · azul · anil, apagando)",
    vazio_cheio: "Vazio → cheio (vermelho · amarelo · verde, clareando)",
    frio_quente: "Frio → quente (anil · azul · verde · amarelo · vermelho)",
    seco_umido: "Seco → úmido (vermelho · amarelo · verde · azul)",
    neutro: "Neutro (papel sem matiz, só a intensidade)",
  };
  const rampPaper = (name, banda, n) => {
    const r = RAMPS[name] || RAMPS.bom_ruim;
    const f = n <= 1 ? 0 : banda / (n - 1);
    const hue = r.hues.length
      ? r.hues[Math.min(r.hues.length - 1, Math.round(f * (r.hues.length - 1)))]
      : null;
    return { hue, nivel: r.dir === "down" ? 1 - f : f, alcance: r.alcance ?? 0.28 };
  };

  // O nível empurra o tom para o lado que ele já está indo: nível alto escurece
  // o papel claro, nível baixo clareia o papel de noite. Simétrico de
  // propósito — o botão tem que ler «aceso/apagado» nos dois temas.
  const tomComNivel = (tom, nivel, alcance) => {
    const puxa = alcance * (2 * nivel - 1) * (nivel > 0.5 ? 1 - tom : tom);
    return Math.max(0, Math.min(1, tom + puxa));
  };

  // Faixa do valor: índice da primeira parada não ultrapassada (igual ao
  // algoritmo do button-card e da escala de clima).
  const bandOf = (v, stops) => {
    const i = stops.findIndex((s) => v <= s);
    return i === -1 ? stops.length : i;
  };

  /* ---------------- as grandezas do pacote ------------------------------- */

  // dc      device_class aceitos (o filtro preferido do editor)
  // units   unidades que também servem, quando a integração não põe device_class
  // words   pedaço do nome, em pt-BR, para o editor achar o sensor teimoso
  // escala  "temp" | "hum" — o papel É a escala canônica da casa (regra 40)
  // ramp    matiz + direção da intensidade quando não há escala canônica
  // stops   limites padrão; stopsByUnit troca os limites conforme a unidade
  // sum     "power" | "energy" — grandeza que se soma (entidades ou ambiente)
  // binary  estado liga/desliga: papel próprio de cada lado, sem rampa
  // texts   estado textual (o purificador diz "great", não um número)
  const KINDS = {
    temperature: {
      label: "Temperatura", card: "Temperatura", icon: "mdi:thermometer",
      domain: ["sensor"], dc: ["temperature"], units: ["°c", "°f", "k"],
      words: /temperat/i, unit: "°C", dec: 1, escala: "temp",
      stops: [10, 16, 20, 24, 27, 31], ramp: "frio_quente",
    },
    humidity: {
      label: "Umidade", card: "Umidade", icon: "mdi:water-percent",
      domain: ["sensor"], dc: ["humidity"], units: ["%"],
      words: /umidade|humid/i, unit: "%", dec: 0, escala: "hum",
      stops: [25, 35, 45, 55, 65, 75], ramp: "seco_umido",
    },
    door_window: {
      label: "Porta / Janela", card: "Porta / Janela", icon: "mdi:door",
      domain: ["binary_sensor"], dc: ["door", "window", "garage_door", "opening"],
      words: /porta|janela|portao|portão|door|window/i, binary: true,
      on: { icon: "mdi:door-open", text: "Aberta", hue: "green", nivel: 0.45 },
      off: { icon: "mdi:door-closed", text: "Fechada", hue: "red", nivel: 0.5 },
    },
    occupancy: {
      label: "Ocupação Humana", card: "Ocupação", icon: "mdi:home-account",
      domain: ["binary_sensor"], dc: ["occupancy", "presence"],
      words: /ocupa|presen/i, binary: true,
      on: { icon: "mdi:home-account", text: "Ocupado", hue: "orange", nivel: 0.5 },
      off: { icon: "mdi:home-outline", text: "Livre", hue: "blue", nivel: 0.2 },
    },
    motion: {
      label: "Movimento", card: "Movimento", icon: "mdi:motion-sensor",
      domain: ["binary_sensor"], dc: ["motion", "moving", "vibration"],
      words: /movimento|motion|vibra/i, binary: true,
      on: { icon: "mdi:motion-sensor", text: "Movimento", hue: "orange", nivel: 0.55 },
      off: { icon: "mdi:motion-sensor-off", text: "Parado", hue: "blue", nivel: 0.2 },
    },
    illuminance: {
      label: "Luminosidade", card: "Luminosidade", icon: "mdi:brightness-5",
      domain: ["sensor"], dc: ["illuminance"], units: ["lx", "lm"],
      words: /lumin|ilumin|lux|bright/i, unit: "lx", dec: 0,
      stops: [5, 50, 200, 1000], ramp: "escuro_claro",
    },
    power: {
      label: "Potência", card: "Potência", icon: "mdi:flash",
      domain: ["sensor"], dc: ["power", "apparent_power"], units: ["w", "kw", "va", "kva"],
      words: /pot[eê]ncia|power|watt/i, unit: "W", dec: 1, sum: "power",
      stops: [50, 300, 1000, 3000], ramp: "bom_ruim",
    },
    energy: {
      label: "Consumo", card: "Consumo", icon: "mdi:lightning-bolt",
      domain: ["sensor"], dc: ["energy"], units: ["wh", "kwh", "mwh"],
      words: /consumo|energia|energy/i, unit: "kWh", dec: 2, sum: "energy",
      stops: [1, 5, 20, 50], ramp: "bom_ruim",
    },
    co2: {
      label: "Dióxido de Carbono", card: "CO₂", icon: "mdi:molecule-co2",
      domain: ["sensor"], dc: ["carbon_dioxide"], units: ["ppm"],
      words: /co2|di[oó]xido|carbono/i, unit: "ppm", dec: 0,
      stops: [600, 800, 1000, 1500], ramp: "bom_ruim",
    },
    formaldehyde: {
      label: "Formaldeído", card: "Formaldeído", icon: "mdi:flask-outline",
      domain: ["sensor"], dc: ["volatile_organic_compounds", "volatile_organic_compounds_parts"],
      units: ["mg/m³", "µg/m³", "ppm", "ppb"], words: /formalde|ch2o|hcho/i,
      unit: "mg/m³", dec: 3, stops: [0.03, 0.06, 0.1, 0.2], ramp: "bom_ruim",
      stopsByUnit: {
        "mg/m³": [0.03, 0.06, 0.1, 0.2], "µg/m³": [30, 60, 100, 200],
        ppm: [0.024, 0.05, 0.08, 0.16], ppb: [24, 50, 80, 160],
      },
    },
    voc: {
      label: "Compostos Orgânicos Voláteis", card: "COV", icon: "mdi:air-filter",
      domain: ["sensor"], dc: ["volatile_organic_compounds", "volatile_organic_compounds_parts"],
      units: ["ppb", "ppm", "µg/m³", "mg/m³"], words: /cov\b|voc|org[aâ]nico/i,
      unit: "ppb", dec: 0, stops: [100, 300, 1000, 3000], ramp: "bom_ruim",
      stopsByUnit: {
        ppb: [100, 300, 1000, 3000], ppm: [0.1, 0.3, 1, 3],
        "µg/m³": [220, 660, 2200, 5500], "mg/m³": [0.22, 0.66, 2.2, 5.5],
      },
    },
    pm25: {
      label: "PM2.5", card: "PM2.5", icon: "mdi:blur",
      domain: ["sensor"], dc: ["pm25"], units: ["µg/m³", "ug/m3"],
      words: /pm ?2[.,]?5/i, unit: "µg/m³", dec: 0,
      stops: [12, 35, 55, 150], ramp: "bom_ruim",
    },
    pm10: {
      label: "PM10", card: "PM10", icon: "mdi:blur-linear",
      domain: ["sensor"], dc: ["pm10"], units: ["µg/m³", "ug/m3"],
      words: /pm ?10/i, unit: "µg/m³", dec: 0,
      stops: [54, 154, 254, 354], ramp: "bom_ruim",
    },
    aqi: {
      label: "Qualidade do Ar", card: "Qualidade do Ar", icon: "mdi:weather-hazy",
      domain: ["sensor"], dc: ["aqi"], units: ["aqi"],
      words: /qualidade.*ar|air.*qual|aqi/i, unit: "AQI", dec: 0,
      stops: [50, 100, 150, 200], ramp: "bom_ruim",
      // purificador Tuya não devolve número: devolve "great". Cada texto vira
      // uma posição de 0 a 1 na mesma rampa, com rótulo em pt-BR.
      texts: {
        excellent: [0, "Excelente"], great: [0, "Ótima"], good: [0.25, "Boa"],
        mild: [0.5, "Média"], moderate: [0.5, "Média"], fair: [0.5, "Média"],
        poor: [0.75, "Ruim"], bad: [0.75, "Ruim"], unhealthy: [0.85, "Insalubre"],
        severe: [1, "Péssima"], hazardous: [1, "Perigosa"],
      },
    },
    battery: {
      label: "Bateria", card: "Bateria", icon: "mdi:battery",
      domain: ["sensor"], dc: ["battery"], units: ["%"],
      words: /bateria|battery/i, unit: "%", dec: 0,
      stops: [10, 20, 50, 80], ramp: "vazio_cheio",
    },
    noise: {
      label: "Ruído", card: "Ruído", icon: "mdi:volume-high",
      domain: ["sensor"], dc: ["sound_pressure"], units: ["db", "dba", "db(a)"],
      words: /ru[ií]do|noise|decib/i, unit: "dB", dec: 0,
      stops: [35, 45, 55, 70], ramp: "bom_ruim",
    },
    generic: {
      // sem `icon`: o genérico é o único que herda o ícone da entidade
      label: "Sensor (genérico)", card: "Sensor", iconFallback: "mdi:gauge",
      domain: ["sensor", "binary_sensor", "input_number", "number", "counter"],
      unit: "", dec: 1, stops: [20, 40, 60, 80], ramp: "bom_ruim",
    },
  };

  // Papel de quem não respondeu: um vermelho que se nota sem gritar.
  // nível alto E um empurrão no tom: no papel claro, tom 6 sozinho ainda dá um
  // rosa quase branco — e sensor caído que ninguém vê não avisa nada.
  const PAPEL_MORTO = { hue: "red", nivel: 0.8, alcance: 0.35 };

  const KIND_ORDER = Object.keys(KINDS);
  const kindOf = (k) => KINDS[k] || KINDS.generic;

  /* ---------------- unidades e formatação -------------------------------- */

  // Fator para a unidade canônica da soma (W para potência, kWh para consumo).
  // Somar 3 tomadas em W com um medidor em kW dá um número errado e plausível,
  // que é a pior espécie de número errado.
  const F_POWER = { w: 1, va: 1, kw: 1000, kva: 1000, mw: 1e6 };
  const F_ENERGY = { wh: 0.001, kwh: 1, mwh: 1000, gwh: 1e6 };

  // Degrau de unidade: passou de 9999, sobe (W → kW → MW) em vez de esticar o
  // número e estourar a largura do botão.
  const STEP_UP = { W: ["kW", 1000], kW: ["MW", 1000], kWh: ["MWh", 1000], MWh: ["GWh", 1000] };
  const stepUnit = (v, unit) => {
    let u = unit, x = v;
    while (Math.abs(x) >= 10000 && STEP_UP[u]) { x /= STEP_UP[u][1]; u = STEP_UP[u][0]; }
    return [x, u];
  };

  const fmtNum = (v, dec, lang) => {
    try {
      return new Intl.NumberFormat(lang || "pt-BR",
        { minimumFractionDigits: dec, maximumFractionDigits: dec }).format(v);
    } catch (_) { return String(Math.round(v * 10 ** dec) / 10 ** dec); }
  };

  /* ---------------- sombras: o 3D, em três níveis de custo --------------- */

  // «alta» é o papel completo: três camadas de sombra projetada + duas de luz
  // interna. Cada camada é uma passada de composição do navegador; num topo de
  // dashboard com 12 botões isso pesa em celular antigo. Daí os três níveis:
  // o desenho é o mesmo, o que muda é quantas camadas o botão paga.
  const SHADOWS = {
    alta: (d) => (d
      ? "0 2px 5px rgba(0,0,0,0.45), 0 6px 16px rgba(0,0,0,0.35), 0 14px 30px rgba(0,0,0,0.22), inset 3px 3px 6px rgba(255,255,255,0.10), inset -3px -3px 7px rgba(0,0,0,0.45)"
      : "0 2px 5px rgba(0,0,0,0.18), 0 6px 16px rgba(0,0,0,0.14), 0 14px 30px rgba(0,0,0,0.09), inset 3px 3px 6px rgba(255,252,240,0.92), inset -3px -3px 7px rgba(0,0,0,0.13)"),
    equilibrada: (d) => (d
      ? "0 3px 10px rgba(0,0,0,0.42), inset 2px 2px 5px rgba(255,255,255,0.09), inset -2px -2px 5px rgba(0,0,0,0.40)"
      : "0 3px 10px rgba(0,0,0,0.16), inset 2px 2px 5px rgba(255,252,240,0.88), inset -2px -2px 5px rgba(0,0,0,0.11)"),
    plana: (d) => (d ? "0 1px 3px rgba(0,0,0,0.35)" : "0 1px 3px rgba(0,0,0,0.14)"),
  };
  const ICON_SHADOW = {
    alta: (d) => (d
      ? "drop-shadow(0 1px 1px rgba(0,0,0,0.55)) drop-shadow(0 3px 6px rgba(0,0,0,0.35))"
      : "drop-shadow(1px 1px 1px rgba(0,0,0,0.30)) drop-shadow(2px 4px 6px rgba(0,0,0,0.18))"),
    equilibrada: (d) => (d ? "drop-shadow(0 1px 2px rgba(0,0,0,0.45))" : "drop-shadow(1px 2px 2px rgba(0,0,0,0.22))"),
    plana: () => "none",
  };

  /* ---------------- defaults --------------------------------------------- */

  const DEFAULTS = {
    name: "",
    icon: "",
    shape: "rounded",          // rounded | circle
    corner: 26,                // % do lado, só no rounded
    quality: "alta",           // alta | equilibrada | plana
    paper_theme: "auto",       // auto | claro | claro-medio | medio | escuro-medio | escuro
    paper_mode: "dinamico",    // dinamico | fixo
    paper_color: "paper",      // usado no modo fixo
    ramp: "",                  // vazio = a rampa padrão da grandeza
    stops: "",                 // vazio = os limites padrão da grandeza
    unit: "",                  // vazio = a unidade da entidade
    decimals: null,            // null = as casas padrão da grandeza
    show_icon: true,
    show_value: null,          // null = padrão da grandeza (número sim, binário não)
    show_unit: true,
    show_label: false,
    show_ring: true,
    intensity: null,           // null = o alcance padrão da rampa
    icon_size: null,           // % do lado; null = automático
    value_size: null,
    tap_action: { action: "none" },
    hold_action: { action: "none" },
    double_tap_action: { action: "none" },
  };

  // Os cinco degraus de papel. «auto» não está aqui: ele pergunta ao tema do HA.
  const TONS = { claro: 0, "claro-medio": 0.25, medio: 0.5, "escuro-medio": 0.75, escuro: 1 };

  const ACT_NONE = { action: "none" };
  const isNone = (a) => !a || !a.action || a.action === "none";

  /* ---------------- o card ------------------------------------------------ */

  class TopButtonCard extends HTMLElement {
    // A subclasse de cada grandeza sobrescreve isto; o genérico lê do config.
    static get fixedKind() { return ""; }

    setConfig(config) {
      const fixed = this.constructor.fixedKind;
      const kind = fixed || config?.kind || "generic";
      if (!KINDS[kind]) throw new Error(`mw-top-buttons-pack: grandeza desconhecida "${kind}"`);
      const k = KINDS[kind];
      const cfg = { ...DEFAULTS, ...config, kind };
      if (!k.sum && !cfg.entity) {
        throw new Error(`mw-top-buttons-pack: defina 'entity' para ${k.label}`);
      }
      if (k.sum && !cfg.entity && !cfg.area && !(cfg.entities || []).length) {
        throw new Error(`mw-top-buttons-pack: defina 'entities' (soma) ou 'area' para ${k.label}`);
      }
      this._config = cfg;
      this._kind = k;
      this._built = false;
      this._paintKey = null;
      if (this._hass) this._update();
    }

    set hass(hass) {
      const first = !this._hass;
      this._hass = hass;
      if (this._config) this._update(first);
    }

    getCardSize() { return 1; }
    // Seções: um quadrado ocupa 3 colunas de 12 e as 2 linhas que dão a altura.
    getGridOptions() { return { rows: 2, columns: 3, min_rows: 1, min_columns: 1 }; }

    static getConfigElement() { return document.createElement("mw-top-button-card-editor"); }

    static getStubConfig(hass) {
      const kind = this.fixedKind || "temperature";
      const k = KINDS[kind];
      const ok = (id) => {
        const st = hass?.states?.[id];
        if (!st) return false;
        if (!k.domain.includes(id.split(".")[0])) return false;
        return !k.dc || k.dc.includes(st.attributes?.device_class);
      };
      const first = Object.keys(hass?.states || {}).find(ok) || "";
      const base = this.fixedKind ? {} : { kind };
      if (k.sum) return { ...base, entities: first ? [first] : [] };
      return { ...base, entity: first };
    }

    /* --- leitura ---------------------------------------------------------- */

    // Entidades que entram na conta: a lista explícita, o ambiente, ou a
    // entidade única. Ambiente resolve pelo registro do frontend — entidade com
    // área própria vence a área do dispositivo, que é a regra do próprio HA.
    _ids() {
      const c = this._config, k = this._kind, hass = this._hass;
      if (Array.isArray(c.entities) && c.entities.length) return c.entities.filter(Boolean);
      if (c.area) {
        const areas = new Set([].concat(c.area));
        const devArea = {};
        for (const d of Object.values(hass.devices || {})) devArea[d.id] = d.area_id;
        const out = [];
        for (const [id, e] of Object.entries(hass.entities || {})) {
          if (!k.domain.includes(id.split(".")[0])) continue;
          if (e.hidden || e.disabled_by) continue;
          const a = e.area_id || devArea[e.device_id];
          if (!areas.has(a)) continue;
          const st = hass.states[id];
          if (!st) continue;
          if (k.dc && !k.dc.includes(st.attributes.device_class)) continue;
          out.push(id);
        }
        return out.sort();
      }
      return c.entity ? [c.entity] : [];
    }

    _primary() {
      const ids = this._ids();
      return this._config.entity || ids[0] || "";
    }

    _read() {
      const c = this._config, k = this._kind;
      if (k.sum) {
        const ids = this._ids();
        let total = 0, n = 0, partial = false;
        const factors = k.sum === "power" ? F_POWER : F_ENERGY;
        for (const id of ids) {
          const st = this._hass.states[id];
          const v = st && !isDead(st.state) ? num(st.state) : null;
          if (v === null) { partial = true; continue; }
          const u = String(st.attributes.unit_of_measurement || "").toLowerCase();
          total += v * (factors[u] ?? 1);
          n += 1;
        }
        if (!n) return { ok: false, count: ids.length };
        return { ok: true, value: total, unit: k.unit, count: n, of: ids.length, partial };
      }
      const st = this._hass.states[c.entity];
      if (!st || isDead(st.state)) return { ok: false, state: st ? st.state : "unavailable" };
      if (k.binary) return { ok: true, on: st.state === "on", state: st.state };
      const v = num(st.state);
      // Sensor que devolve palavra em vez de número (o purificador Tuya diz
      // "great"): a palavra vira rótulo em pt-BR e uma posição de 0 a 1 na
      // rampa — sem isto o card mostraria travessão num sensor que funciona.
      if (v === null && k.texts) {
        const t = k.texts[String(st.state).toLowerCase().replace(/[ _-]/g, "")]
          || k.texts[String(st.state).toLowerCase()];
        if (t) return { ok: true, texto: t[1], f: t[0], state: st.state, unit: "" };
      }
      return {
        ok: true,
        value: v,
        unit: c.unit || st.attributes.unit_of_measurement || k.unit || "",
        state: st.state,
      };
    }

    // Claridade do papel, de 0 (dia) a 1 (noite). Os três meios-termos existem
    // porque «claro» e «escuro» não davam conta: dashboard escuro com papel
    // branco fere a vista, e papel preto some no fundo preto.
    _tom() {
      const t = this._config.paper_theme;
      if (t in TONS) return TONS[t];
      return this._hass?.themes?.darkMode ? 1 : 0;
    }

    // Papel + tinta do estado atual. É AQUI que mora a regra do dono: o fundo
    // é o estado E a intensidade dele. Matiz diz o quê, nível diz quanto.
    _skin(r) {
      const c = this._config, k = this._kind, tom = this._tom();
      const monta = (hue, nivel, ring) => {
        const sup = paperSurface(hue, nivel, tom);
        const acc = accentOn(hue, sup.L);
        return { paper: sup.bg, accent: acc, ring: ring || acc, L: sup.L };
      };
      // não respondeu: vermelho que se nota sem gritar
      if (!r.ok) {
        const t = tomComNivel(tom, PAPEL_MORTO.nivel, PAPEL_MORTO.alcance);
        const sup = paperSurface(PAPEL_MORTO.hue, PAPEL_MORTO.nivel, t);
        const acc = accentOn(PAPEL_MORTO.hue, sup.L);
        return { paper: sup.bg, accent: acc, ring: acc, L: sup.L };
      }

      if (c.paper_mode === "fixo") {
        const m = /^([a-z]+)-([1-7])$/.exec(String(c.paper_color || "").trim());
        return monta(m ? m[1] : null, m ? (+m[2] - 1) / 6 : 0.15, null);
      }
      if (k.binary) {
        const lado = r.on ? k.on : k.off;
        const chave = r.on ? c.paper_on : c.paper_off;
        const m = /^([a-z]+)-([1-7])$/.exec(String(chave || "").trim());
        return monta(m ? m[1] : lado.hue, m ? (+m[2] - 1) / 6 : lado.nivel, null);
      }
      const stops = this._stops(r.unit);
      const n = stops.length + 1;
      const banda = r.texto !== undefined
        ? Math.round(r.f * (n - 1))
        : bandOf(Number.isFinite(r.value) ? r.value : 0, stops);

      // Temperatura e umidade: o papel É a escala canônica da casa (regra 40),
      // pousada sobre o papel neutro. Nada de rampa de matiz aqui — a escala
      // já carrega o quê e o quanto.
      if (k.escala && Number.isFinite(r.value)) {
        const rgb = rgbOf(mwClimateColor(k.escala, r.value, 1));
        if (rgb) {
          const sup = paperTinted(rgb, tom);
          const ink = inkOn(sup.L);
          return { paper: sup.bg, accent: ink.text, ring: `rgb(${rgb.join(", ")})`, L: sup.L };
        }
      }
      const p = rampPaper(c.ramp || k.ramp, banda, n);
      const alc = c.intensity === null || c.intensity === undefined
        ? p.alcance : Math.max(0, Math.min(1, Number(c.intensity) / 100));
      const sup = paperSurface(p.hue, p.nivel, tomComNivel(tom, p.nivel, alc));
      const acc = accentOn(p.hue, sup.L);
      return { paper: sup.bg, accent: acc, ring: acc, L: sup.L };
    }

    // Limites da faixa: o do dono vence; senão o da unidade (COV em ppm não é
    // COV em ppb); senão o padrão da grandeza.
    _stops(unidade) {
      const raw = String(this._config.stops || "").trim();
      if (raw) {
        const list = raw.split(/[,;\s]+/).map(Number).filter(Number.isFinite).sort((a, b) => a - b);
        if (list.length) return list;
      }
      const porUnidade = this._kind.stopsByUnit;
      if (porUnidade && unidade) {
        const u = String(unidade).trim().toLowerCase();
        for (const chave of Object.keys(porUnidade)) {
          if (chave.toLowerCase() === u) return porUnidade[chave];
        }
      }
      return this._kind.stops || [];
    }

    /* --- desenho ---------------------------------------------------------- */

    _update(force) {
      const r = this._read();
      const key = JSON.stringify([r.ok, r.on, r.value, r.count, r.partial, r.texto, this._tom()]);
      if (!force && key === this._paintKey && this._built) return;
      this._paintKey = key;
      if (!this._built) this._build();
      this._paint(r);
    }

    // Estrutura e CSS são montados UMA vez por configuração. Cada leitura nova
    // só troca variáveis CSS e textos — sem reescrever innerHTML, que num topo
    // de dashboard com 12 botões custa recriar 12 shadow roots a cada
    // atualização de sensor.
    _build() {
      const c = this._config, k = this._kind;
      if (!this.shadowRoot) this.attachShadow({ mode: "open" });
      const q = SHADOWS[c.quality] ? c.quality : "alta";
      const circulo = c.shape === "circle";
      const corner = Math.max(0, Math.min(50, Number(c.corner) ?? 26));
      const radius = circulo ? "50%" : `${corner}%`;
      // O anel fica 5 % para dentro, então a caixa dele tem 90 % do lado. Para
      // as duas curvas serem CONCÊNTRICAS, o raio do anel em px é o do card
      // menos o recuo — e, em % da caixa menor, isso é (corner − 5) ÷ 0,9.
      // Herdar o raio do card (o que estava aqui) desenha um anel de canto
      // grande demais dentro de um canto pequeno: foi o que apareceu no botão
      // de ruído.
      const recuo = 5;
      const ringRadius = circulo ? "50%"
        : `${Math.max(0, (corner - recuo) / (1 - 2 * recuo / 100)).toFixed(1)}%`;
      const showValue = c.show_value === null || c.show_value === undefined
        ? !k.binary : c.show_value !== false;
      const showIcon = c.show_icon !== false;
      const showLabel = c.show_label === true;
      const rows = (showIcon ? 1 : 0) + (showValue ? 1 : 0) + (showLabel ? 1 : 0);
      // O ícone cresce quando é o único morador do botão. Tamanhos em `cqi`
      // (1% da largura do container): o botão fica proporcional em qualquer
      // grade sem uma linha de JS de medição.
      const iconPct = Number(c.icon_size) || (rows === 1 ? 46 : showValue ? 26 : 34);
      const valuePct = Number(c.value_size) || (rows === 1 ? 34 : 26);
      const unitPct = Math.round(valuePct * 0.42);
      const labelPct = 10;
      // No círculo o conteúdo mora no quadrado inscrito (70,7 % do diâmetro),
      // então a folga tem que caber TUDO que for desenhado: com ícone, valor e
      // rótulo os 19 % deixavam o rótulo encostar na curva e ser cortado.
      const pad = c.shape === "circle" ? (rows >= 3 ? 13 : 19) : 10;
      const rim = q === "alta" ? `<div class="rim"></div>` : "";
      const ring = c.show_ring !== false ? `<div class="ring"></div>` : "";
      this._showValue = showValue;
      this._showLabel = showLabel;
      this._showIcon = showIcon;

      this.shadowRoot.innerHTML = `
        <style>
          :host{display:block;}
          ha-card{position:relative;box-sizing:border-box;width:100%;aspect-ratio:1/1;
            border-radius:${radius};background:var(--mw-paper);border:1px solid var(--mw-border);
            box-shadow:var(--mw-shadow);color:var(--mw-ink);overflow:hidden;
            display:flex;align-items:center;justify-content:center;
            container-type:inline-size;
            cursor:${this._clickable() ? "pointer" : "default"};
            -webkit-tap-highlight-color:transparent;touch-action:manipulation;user-select:none;
            transition:background .35s ease,box-shadow .25s ease,border-color .35s ease;}
          /* brilho de canto: gradiente estático, sem blur — é o que dá o
             relevo de papel sem custar filtro por quadro */
          .rim{position:absolute;inset:0;border-radius:inherit;pointer-events:none;z-index:0;
            background:radial-gradient(115% 85% at 28% 10%,
              rgba(255,255,255,0.42), rgba(255,255,255,0) 58%);
            mix-blend-mode:soft-light;}
          /* anel de estado: é ele que carrega a escala canônica de clima
             (regra global 40) sem obrigar o número a ser amarelo puro sobre
             papel claro. Nas demais grandezas repete a tinta de destaque. */
          .ring{position:absolute;inset:${recuo}%;border-radius:${ringRadius};pointer-events:none;z-index:0;
            border:2px solid var(--mw-ring);opacity:.6;transition:border-color .35s ease;}
          @supports (width:1cqi){ .ring{border-width:0.9cqi;} }
          .ct{position:relative;z-index:1;display:flex;flex-direction:column;
            align-items:center;justify-content:center;text-align:center;
            width:100%;height:100%;padding:${pad}%;box-sizing:border-box;gap:2%;}
          .ic{display:flex;align-items:center;justify-content:center;line-height:0;flex:none;}
          .ic ha-icon{display:block;color:var(--mw-accent);filter:var(--mw-icon-shadow);
            width:34px;height:34px;--mdc-icon-size:34px;transition:color .35s ease;}
          .vl{display:flex;align-items:baseline;justify-content:center;gap:0.25em;
            max-width:100%;line-height:1.02;}
          /* tabular-nums trava a largura do dígito: o número não dança a cada leitura */
          .v{font-weight:700;color:var(--mw-accent);font-size:calc(22px * var(--mw-vk, 1));letter-spacing:-0.02em;
            font-variant-numeric:tabular-nums;font-feature-settings:"tnum" 1;
            text-shadow:var(--mw-text-shadow);transition:color .35s ease;}
          .u{font-weight:600;color:var(--mw-accent);opacity:.7;font-size:calc(10px * var(--mw-vk, 1));}
          .lb{font-weight:600;color:var(--mw-ink-dim);font-size:9px;letter-spacing:.02em;
            max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
          @supports (width:1cqi){
            .ic ha-icon{width:${iconPct}cqi;height:${iconPct}cqi;--mdc-icon-size:${iconPct}cqi;}
            .v{font-size:calc(${valuePct}cqi * var(--mw-vk, 1));}
            .u{font-size:calc(${unitPct}cqi * var(--mw-vk, 1));}
            .lb{font-size:${labelPct}cqi;}
          }
        </style>
        <ha-card>
          ${rim}${ring}
          <div class="ct">
            ${showIcon ? `<div class="ic"><ha-icon></ha-icon></div>` : ""}
            ${showValue ? `<div class="vl"><span class="v"></span><span class="u"></span></div>` : ""}
            ${showLabel ? `<div class="lb"></div>` : ""}
          </div>
        </ha-card>`;

      this._el = {
        card: this.shadowRoot.querySelector("ha-card"),
        icon: this.shadowRoot.querySelector(".ic ha-icon"),
        v: this.shadowRoot.querySelector(".v"),
        u: this.shadowRoot.querySelector(".u"),
        lb: this.shadowRoot.querySelector(".lb"),
      };
      this._quality = q;
      this._wire();
      this._built = true;
    }

    _paint(r) {
      const c = this._config, k = this._kind, el = this._el;
      const skin = this._skin(r);
      const ink = inkOn(skin.L);
      const q = this._quality;
      const card = el.card;
      card.style.setProperty("--mw-paper", skin.paper);
      card.style.setProperty("--mw-accent", skin.accent);
      card.style.setProperty("--mw-ring", skin.ring || skin.accent);
      card.style.setProperty("--mw-ink", ink.text);
      card.style.setProperty("--mw-ink-dim", ink.dim);
      card.style.setProperty("--mw-border", ink.line);
      card.style.setProperty("--mw-shadow", SHADOWS[q](ESCURO(skin.L)));
      card.style.setProperty("--mw-icon-shadow", ICON_SHADOW[q](ESCURO(skin.L)));
      card.style.setProperty("--mw-text-shadow",
        q === "plana" || ESCURO(skin.L) ? "none" : "0 1px 0 rgba(255,255,255,0.55)");

      if (el.icon) {
        // O ícone da GRANDEZA vence o da entidade. Parece detalhe e não é: o
        // sensor «Temperatura da Sala de TV» carrega o ícone de televisão, e
        // um botão de temperatura com uma TV desenhada não se lê. Só o
        // genérico — que não tem grandeza própria — herda o ícone da entidade.
        let icon = c.icon;
        if (!icon && k.binary) icon = r.ok ? (r.on ? k.on.icon : k.off.icon) : k.icon;
        if (!icon) icon = k.icon || this._entityIcon() || k.iconFallback;
        el.icon.setAttribute("icon", r.ok ? icon : (c.icon_unavailable || "mdi:help-rhombus-outline"));
      }

      if (this._showValue) {
        let value = NO_READING, unit = "";
        if (r.ok && k.binary) {
          value = r.on ? (c.text_on || k.on.text) : (c.text_off || k.off.text);
        } else if (r.ok && r.texto !== undefined) {
          value = r.texto;                       // sensor que fala em vez de contar
        } else if (r.ok) {
          // COV em ppm chega como 0,4 — com as casas do ppb (zero) vira "0",
          // que é uma leitura errada com cara de leitura certa. Valor abaixo de
          // 1 ganha casas até mostrar alguma coisa.
          const abs = Math.abs(r.value);
          let dec = c.decimals === null || c.decimals === undefined
            ? (abs >= 100 ? 0 : (k.dec ?? 1))
            : Number(c.decimals);
          if (c.decimals === null || c.decimals === undefined) {
            if (abs > 0 && abs < 0.1) dec = Math.max(dec, 3);
            else if (abs > 0 && abs < 1) dec = Math.max(dec, 2);
          }
          const [x, u] = k.sum ? stepUnit(r.value, k.unit) : [r.value, r.unit];
          value = fmtNum(x, Math.max(0, Math.min(4, dec)), this._hass?.locale?.language);
          unit = c.show_unit === false ? "" : (c.unit || u || "");
        }
        el.v.textContent = value;
        // sem leitura some também a unidade: "— °C" sugere um valor que não existe
        el.u.textContent = r.ok ? unit : "";
        // «0,042 mg/m³» tem o dobro dos caracteres de «23,4 °C» e no mesmo corpo
        // encostaria nas duas bordas. A unidade pesa menos que o número porque
        // é desenhada menor. Piso em 0,5 para não virar letra de bula.
        const carga = value.length + 0.55 * unit.length;
        el.card.style.setProperty("--mw-vk",
          String(Math.max(0.5, Math.min(1, 5.2 / Math.max(1, carga))).toFixed(3)));
      }

      if (this._showLabel) el.lb.textContent = this._label(r);
      card.setAttribute("title", this._label(r) + (r.ok && r.of ? ` · ${r.count}/${r.of} sensores` : ""));
    }

    _entityIcon() {
      const st = this._hass?.states?.[this._config.entity];
      return st?.attributes?.icon || "";
    }

    _label(r) {
      const c = this._config;
      if (c.name) return c.name;
      if (c.area && !c.entity) {
        const a = this._hass?.areas?.[[].concat(c.area)[0]];
        if (a?.name) return a.name;
      }
      const st = this._hass?.states?.[this._primary()];
      return st?.attributes?.friendly_name || this._kind.label;
    }

    /* --- ações (padrão: Nada) ---------------------------------------------- */

    _clickable() {
      const c = this._config;
      return !(isNone(c.tap_action) && isNone(c.hold_action) && isNone(c.double_tap_action));
    }

    _fire(name, detail) {
      this.dispatchEvent(new CustomEvent(name, { bubbles: true, composed: true, detail }));
    }

    _run(a) {
      if (isNone(a)) return;
      const target = a.entity || this._primary();
      switch (a.action) {
        case "more-info":
          if (target) this._fire("hass-more-info", { entityId: target });
          return;
        case "toggle":
          if (target) this._hass.callService("homeassistant", "toggle", { entity_id: target });
          return;
        case "navigate":
          if (a.navigation_path) {
            history.pushState(null, "", a.navigation_path);
            this._fire("location-changed", { replace: false });
          }
          return;
        case "url":
          if (a.url_path) window.open(a.url_path, a.url_path.startsWith("/") ? "_self" : "_blank");
          return;
        case "assist":
          this._fire("show-dialog", {
            dialogTag: "ha-voice-command-dialog",
            dialogImport: () => {},
            dialogParams: { pipeline_id: a.pipeline_id, start_listening: a.start_listening },
          });
          return;
        case "perform-action":
        case "call-service": {
          const s = a.perform_action || a.service;
          if (!s) return;
          const [dom, srv] = String(s).split(".");
          if (!dom || !srv) return;
          this._hass.callService(dom, srv, a.data || a.service_data || {}, a.target);
          return;
        }
        default:
      }
    }

    _wire() {
      const c = this._config, card = this._el.card;
      if (!this._clickable()) return;
      let holdTimer = null, held = false, tapTimer = null;
      const clear = () => { if (holdTimer) { clearTimeout(holdTimer); holdTimer = null; } };
      card.addEventListener("pointerdown", () => {
        held = false;
        holdTimer = setTimeout(() => {
          held = true; holdTimer = null;
          this._run(c.hold_action);
        }, 500);
      });
      ["pointerleave", "pointercancel"].forEach((t) => card.addEventListener(t, clear));
      card.addEventListener("pointerup", () => {
        clear();
        if (held) return;
        // sem duplo toque configurado, o toque simples não espera ninguém
        if (isNone(c.double_tap_action)) { this._run(c.tap_action); return; }
        if (tapTimer) { clearTimeout(tapTimer); tapTimer = null; this._run(c.double_tap_action); return; }
        tapTimer = setTimeout(() => { tapTimer = null; this._run(c.tap_action); }, 250);
      });
    }
  }

  /* ---------------- EDITOR VISUAL ---------------------------------------- */

  const LABELS = {
    kind: "Grandeza",
    entity: "Entidade",
    __src: "Fonte da soma",
    entities: "Entidades da soma",
    area: "Ambiente",
    name: "Rótulo (vazio = nome da entidade)",
    icon: "Ícone (vazio = automático)",
    shape: "Formato",
    corner: "Arredondamento dos cantos",
    quality: "Qualidade do 3D",
    paper_theme: "Papel",
    paper_mode: "Cor do papel",
    paper_color: "Papel fixo",
    paper_on: "Papel quando ativo",
    paper_off: "Papel quando inativo",
    ramp: "Rampa de cor do papel",
    stops: "Limites das faixas (separados por vírgula)",
    unit: "Unidade (vazio = a da entidade)",
    decimals: "Casas decimais (vazio = automático)",
    text_on: "Texto quando ativo",
    text_off: "Texto quando inativo",
    show_icon: "Mostrar ícone",
    show_value: "Mostrar valor",
    show_unit: "Mostrar unidade",
    show_label: "Mostrar rótulo",
    show_ring: "Anel de estado na borda",
    intensity: "Alcance da intensidade (quanto o estado escurece/acende o papel)",
    icon_size: "Tamanho do ícone (% do lado)",
    value_size: "Tamanho do valor (% do lado)",
    tap_action: "Toque",
    hold_action: "Toque longo",
    double_tap_action: "Toque duplo",
  };

  class TopButtonCardEditor extends HTMLElement {
    setConfig(config) {
      this._config = { ...config };
      this._render();
    }
    set hass(hass) {
      this._hass = hass;
      if (this._form) { this._form.hass = hass; this._form.schema = this._schema(); }
    }

    // A grandeza vem do tipo do card (mw-top-door-window-card → door_window);
    // só o card genérico (mw-top-button-card) deixa escolher no formulário.
    // O tag usa hífen, a chave usa sublinhado — daí a tradução de volta.
    _typeKind() {
      const t = String(this._config?.type || "").replace(/^custom:/, "");
      const m = /^mw-top-(.+)-card$/.exec(t);
      const key = m ? m[1].replace(/-/g, "_") : "";
      return KINDS[key] ? key : "";
    }
    _kindKey() { return this._typeKind() || this._config?.kind || "generic"; }
    _fixed() { return !!this._typeKind(); }
    // Achar a entidade certa é o passo em que o editor mais decepciona. Aqui a
    // busca é em cascata: device_class (o jeito certo), depois a unidade,
    // depois o nome em pt-BR — porque integração Tuya entrega COV em ppm e
    // PM2.5 SEM unidade e SEM device_class, e um filtro só por device_class
    // devolveria lista vazia num sensor que existe e funciona.
    _sel(k, multiplo) {
      const hass = this._hass;
      const base = { entity: { domain: k.domain, multiple: !!multiplo } };
      if (!hass) return base;
      const dom = new Set(k.domain);
      const porClasse = [], porUnidade = [], porNome = [];
      for (const [id, st] of Object.entries(hass.states)) {
        if (!dom.has(id.split(".")[0])) continue;
        const a = st.attributes || {};
        if (k.dc && k.dc.includes(a.device_class)) { porClasse.push(id); continue; }
        const u = String(a.unit_of_measurement ?? "").trim().toLowerCase();
        if (k.units && k.units.includes(u) && !a.device_class) { porUnidade.push(id); continue; }
        if (k.words && (k.words.test(id) || k.words.test(String(a.friendly_name || "")))) porNome.push(id);
      }
      const lista = porClasse.concat(porUnidade, porNome);
      return lista.length
        ? { entity: { include_entities: lista, multiple: !!multiplo } }
        : base;
    }

    _src() { return this._config?.area && !(this._config?.entities || []).length ? "area" : "entities"; }

    _schema() {
      const kk = this._kindKey();
      const k = kindOf(kk);
      const c = this._config || {};
      const s = [];
      if (!this._fixed()) {
        s.push({
          name: "kind",
          selector: { select: { mode: "dropdown", options: KIND_ORDER.map((key) => ({ value: key, label: KINDS[key].label })) } },
        });
      }
      if (k.sum) {
        s.push({
          name: "__src",
          selector: { select: { mode: "dropdown", options: [
            { value: "entities", label: "Escolher as entidades" },
            { value: "area", label: "Somar um ambiente inteiro" },
          ] } },
        });
        if (this._src() === "area") s.push({ name: "area", selector: { area: {} } });
        else s.push({ name: "entities", selector: this._sel(k, true) });
      } else {
        s.push({ name: "entity", required: true, selector: this._sel(k) });
      }
      s.push({ name: "name", selector: { text: {} } });
      s.push({ name: "icon", selector: { icon: {} } });

      const look = [
        { name: "shape", selector: { select: { mode: "dropdown", options: [
          { value: "rounded", label: "Quadrado de cantos arredondados" },
          { value: "circle", label: "Círculo" },
        ] } } },
      ];
      if ((c.shape || "rounded") !== "circle") {
        look.push({ name: "corner", selector: { number: { min: 0, max: 50, step: 1, mode: "slider", unit_of_measurement: "%" } } });
      }
      look.push(
        { name: "quality", selector: { select: { mode: "dropdown", options: [
          { value: "alta", label: "Alta (papel completo)" },
          { value: "equilibrada", label: "Equilibrada (menos camadas)" },
          { value: "plana", label: "Plana (sem relevo)" },
        ] } } },
        { name: "paper_theme", selector: { select: { mode: "dropdown", options: [
          { value: "auto", label: "Acompanha o tema do HA" },
          { value: "claro", label: "Papel de dia" },
          { value: "claro-medio", label: "Papel de dia puxado para o escuro" },
          { value: "medio", label: "Meio do caminho" },
          { value: "escuro-medio", label: "Papel de noite puxado para o claro" },
          { value: "escuro", label: "Papel de noite" },
        ] } } },
        { name: "paper_mode", selector: { select: { mode: "dropdown", options: [
          { value: "dinamico", label: "Dinâmica — muda com o estado" },
          { value: "fixo", label: "Fixa — sempre a mesma" },
        ] } } },
      );
      const mode = c.paper_mode || "dinamico";
      if (mode === "fixo") {
        look.push({ name: "paper_color", selector: { select: { mode: "dropdown", options: paperOptions() } } });
      } else if (k.binary) {
        look.push(
          { name: "paper_on", selector: { select: { mode: "dropdown", options: paperEstadoOptions(k.on) } } },
          { name: "paper_off", selector: { select: { mode: "dropdown", options: paperEstadoOptions(k.off) } } },
        );
      } else {
        look.push(
          { name: "ramp", selector: { select: { mode: "dropdown", options: Object.keys(RAMPS).map((r) => ({ value: r, label: RAMP_LABELS[r] })) } } },
          { name: "stops", selector: { text: {} } },
          { name: "intensity", selector: { number: { min: 0, max: 100, step: 5, mode: "slider", unit_of_measurement: "%" } } },
        );
      }
      look.push(
        { name: "show_icon", selector: { boolean: {} } },
        { name: "show_value", selector: { boolean: {} } },
      );
      if (k.binary) {
        look.push({ name: "text_on", selector: { text: {} } }, { name: "text_off", selector: { text: {} } });
      } else {
        look.push(
          { name: "show_unit", selector: { boolean: {} } },
          { name: "unit", selector: { text: {} } },
          { name: "decimals", selector: { number: { min: 0, max: 4, step: 1, mode: "box" } } },
        );
      }
      look.push(
        { name: "show_label", selector: { boolean: {} } },
        { name: "show_ring", selector: { boolean: {} } },
        { name: "icon_size", selector: { number: { min: 8, max: 70, step: 1, mode: "box", unit_of_measurement: "%" } } },
        { name: "value_size", selector: { number: { min: 8, max: 60, step: 1, mode: "box", unit_of_measurement: "%" } } },
      );

      s.push({ type: "expandable", name: "", title: "Aparência", icon: "mdi:palette", schema: look });
      s.push({
        type: "expandable", name: "", title: "Ações", icon: "mdi:gesture-tap",
        schema: [
          { name: "tap_action", selector: { ui_action: { default_action: "none" } } },
          { name: "hold_action", selector: { ui_action: { default_action: "none" } } },
          { name: "double_tap_action", selector: { ui_action: { default_action: "none" } } },
        ],
      });
      return s;
    }

    _render() {
      if (!this._form) {
        this._form = document.createElement("ha-form");
        this._form.computeLabel = (f) => LABELS[f.name] || f.name;
        this._form.addEventListener("value-changed", (ev) => this._onChange(ev));
        this.appendChild(this._form);
      }
      this._form.hass = this._hass;
      this._form.schema = this._schema();
      const data = { ...DEFAULTS, ...this._config, __src: this._src() };
      // campo vazio (ex.: casas decimais = automático) não vai para o ha-form,
      // senão o seletor numérico mostra lixo em vez de caixa vazia
      for (const key of Object.keys(data)) {
        if (data[key] === "" || data[key] === null) delete data[key];
      }
      this._form.data = data;
    }

    _onChange(ev) {
      ev.stopPropagation();
      const v = { ...ev.detail.value };
      const src = v.__src;
      delete v.__src;                       // campo virtual do editor — nunca vai para o YAML
      if (src === "area") delete v.entities;
      else delete v.area;
      const clean = {};
      for (const [key, val] of Object.entries(v)) {
        if (val === undefined || val === null || val === "") continue;
        if (key === "entity" || key === "entities" || key === "area" || key === "kind") { clean[key] = val; continue; }
        // ação em «Nada» é o default do pacote: não suja o YAML
        if (/_action$/.test(key) && isNone(val)) continue;
        if (JSON.stringify(val) !== JSON.stringify(DEFAULTS[key])) clean[key] = val;
      }
      // campo escondido pelo esquema (ex.: `stops` com papel fixo) não aparece
      // no `v` — sem isto ele sumiria do YAML a cada mexida no formulário
      for (const [key, val] of Object.entries(this._config)) {
        if (!(key in v) && clean[key] === undefined && key !== "__src") clean[key] = val;
      }
      if (src === "area") delete clean.entities;
      else if (src === "entities") delete clean.area;
      this._config = clean;
      this.dispatchEvent(new CustomEvent("config-changed",
        { bubbles: true, composed: true, detail: { config: clean } }));
      this._render();
    }
  }

  /* ---------------- registro: um tipo por grandeza ------------------------ */

  customElements.define("mw-top-button-card-editor", TopButtonCardEditor);
  customElements.define("mw-top-button-card", TopButtonCard);

  window.customCards = window.customCards || [];
  window.customCards.push({
    type: "mw-top-button-card",
    name: "MW Top · Genérico",
    description: "Botão de topo papel 3D: escolha a grandeza no editor.",
    preview: true,
    documentationURL: "https://github.com/visaodeempresa/mw-ha-top-buttons-pack",
  });

  for (const key of KIND_ORDER) {
    if (key === "generic") continue;
    const k = KINDS[key];
    const tag = `mw-top-${key.replace(/_/g, "-")}-card`;
    // o editor lê a grandeza do `type` do card; o tag usa hífen, o KINDS usa
    // sublinhado (door_window → mw-top-door-window-card), então cada classe
    // carrega a chave em vez de deixar o editor adivinhar de volta
    const cls = class extends TopButtonCard { static get fixedKind() { return key; } };
    Object.defineProperty(cls, "name", { value: `MwTop_${key}` });
    customElements.define(tag, cls);
    window.customCards.push({
      type: tag,
      name: `MW Top · ${k.card}`,
      description: `Botão de topo papel 3D — ${k.label.toLowerCase()}.`,
      preview: true,
      documentationURL: "https://github.com/visaodeempresa/mw-ha-top-buttons-pack",
    });
  }

  console.info("%c MW-TOP-BUTTONS-PACK %c " + VERSION + " ",
    "background:#1a1a1a;color:#fdfaf3;font-weight:700;",
    "background:#e8e3d8;color:#1a1a1a;font-weight:700;");
})();
