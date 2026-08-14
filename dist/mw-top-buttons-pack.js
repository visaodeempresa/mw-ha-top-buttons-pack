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

  const VERSION = "0.1.1";

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

  /* ---------------- papel: claro/escuro, matiz e tinta de destaque ------- */

  const paperOf = (key, dark) => (dark ? paperDarkGradient(key) : paperGradient(key));
  const paperOptionsFor = (dark) => (dark ? paperDarkOptions() : paperOptions());

  const paperHue = (key) => {
    const m = /^([a-z]+)-([1-7])$/.exec(String(key || "").trim());
    const h = m && PAPER_HUES.find((x) => x[0] === m[1]);
    return h ? h[2] : null;
  };
  // A tinta de destaque (número e ícone) sai da MESMA matiz do papel, só que
  // saturada e no extremo oposto de luminosidade. Assim o botão nunca precisa
  // de uma segunda tabela de cores para combinar consigo mesmo — e o contraste
  // é garantido por construção, não por sorte.
  const accentOf = (key, dark) => {
    const h = paperHue(key);
    if (h === null) return dark ? "rgba(247, 244, 236, 0.92)" : "rgba(28, 25, 20, 0.90)";
    return dark ? `hsl(${h}, 62%, 70%)` : `hsl(${h}, 72%, 29%)`;
  };

  // Rampas de papel: a lista de papéis por onde o botão caminha conforme o
  // estado. O número de faixas vem dos limites (`stops`) do card — a rampa é
  // reamostrada para caber, então mudar os limites não exige mexer na rampa.
  const RAMPS = {
    frio_quente: ["indigo-5", "blue-4", "blue-2", "green-2", "yellow-2", "orange-3", "red-5"],
    seco_umido: ["red-4", "orange-3", "yellow-2", "green-2", "blue-2", "blue-4", "indigo-5"],
    bom_ruim: ["green-1", "green-2", "yellow-3", "orange-4", "red-6"],
    ruim_bom: ["red-6", "orange-4", "yellow-3", "green-2", "green-1"],
    escuro_claro: ["indigo-6", "indigo-4", "blue-2", "yellow-3", "yellow-1"],
    vazio_cheio: ["red-5", "orange-4", "yellow-3", "green-2", "green-1"],
    neutro: ["paper"],
  };
  const RAMP_LABELS = {
    frio_quente: "Frio → quente (anil · azul · verde · amarelo · vermelho)",
    seco_umido: "Seco → úmido (vermelho · amarelo · verde · azul)",
    bom_ruim: "Bom → ruim (verde · amarelo · laranja · vermelho)",
    ruim_bom: "Ruim → bom (vermelho · laranja · amarelo · verde)",
    escuro_claro: "Escuro → claro (anil · azul · amarelo)",
    vazio_cheio: "Vazio → cheio (vermelho · amarelo · verde)",
    neutro: "Neutro (papel original, sem dinâmica)",
  };
  const rampKey = (name, i, n) => {
    const r = RAMPS[name] || RAMPS.bom_ruim;
    if (r.length === 1 || n <= 1) return r[0];
    return r[Math.round((i * (r.length - 1)) / (n - 1))];
  };
  // Faixa do valor: índice da primeira parada não ultrapassada (igual ao
  // algoritmo do button-card e da escala de clima).
  const bandOf = (v, stops) => {
    const i = stops.findIndex((s) => v <= s);
    return i === -1 ? stops.length : i;
  };

  /* ---------------- as grandezas do pacote ------------------------------- */

  // dc     device_class aceitos (filtro do seletor e da soma por ambiente)
  // stops  limites padrão das faixas, na unidade canônica da grandeza
  // ramp   rampa de papel padrão
  // sum    "power" | "energy" — grandeza que se soma (entidades ou ambiente)
  // binary estado liga/desliga em vez de número
  const KINDS = {
    temperature: {
      label: "Temperatura", card: "Temperatura", icon: "mdi:thermometer",
      domain: ["sensor"], dc: ["temperature"], unit: "°C", dec: 1,
      stops: [10, 16, 20, 24, 27, 31], ramp: "frio_quente",
      accent: (v) => mwClimateColor("temp", v, 1),
    },
    humidity: {
      label: "Umidade", card: "Umidade", icon: "mdi:water-percent",
      domain: ["sensor"], dc: ["humidity"], unit: "%", dec: 0,
      stops: [25, 35, 45, 55, 65, 75], ramp: "seco_umido",
      accent: (v) => mwClimateColor("hum", v, 1),
    },
    door_window: {
      label: "Porta / Janela", card: "Porta / Janela", icon: "mdi:door",
      domain: ["binary_sensor"], dc: ["door", "window", "garage_door", "opening"], binary: true,
      on: { icon: "mdi:door-open", text: "Aberta", paper: "orange-3" },
      off: { icon: "mdi:door-closed", text: "Fechada", paper: "green-2" },
    },
    occupancy: {
      label: "Ocupação Humana", card: "Ocupação", icon: "mdi:home-account",
      domain: ["binary_sensor"], dc: ["occupancy", "presence"], binary: true,
      on: { icon: "mdi:home-account", text: "Ocupado", paper: "yellow-2" },
      off: { icon: "mdi:home-outline", text: "Livre", paper: "blue-1" },
    },
    motion: {
      label: "Movimento", card: "Movimento", icon: "mdi:motion-sensor",
      domain: ["binary_sensor"], dc: ["motion", "moving", "vibration"], binary: true,
      on: { icon: "mdi:motion-sensor", text: "Movimento", paper: "orange-2" },
      off: { icon: "mdi:motion-sensor-off", text: "Parado", paper: "blue-1" },
    },
    illuminance: {
      label: "Luminosidade", card: "Luminosidade", icon: "mdi:brightness-5",
      domain: ["sensor"], dc: ["illuminance"], unit: "lx", dec: 0,
      stops: [5, 50, 200, 1000], ramp: "escuro_claro",
    },
    power: {
      label: "Potência", card: "Potência", icon: "mdi:flash",
      domain: ["sensor"], dc: ["power", "apparent_power"], unit: "W", dec: 1, sum: "power",
      stops: [50, 300, 1000, 3000], ramp: "bom_ruim",
    },
    energy: {
      label: "Consumo", card: "Consumo", icon: "mdi:lightning-bolt",
      domain: ["sensor"], dc: ["energy"], unit: "kWh", dec: 2, sum: "energy",
      stops: [1, 5, 20, 50], ramp: "bom_ruim",
    },
    co2: {
      label: "Dióxido de Carbono", card: "CO₂", icon: "mdi:molecule-co2",
      domain: ["sensor"], dc: ["carbon_dioxide"], unit: "ppm", dec: 0,
      stops: [600, 800, 1000, 1500], ramp: "bom_ruim",
    },
    formaldehyde: {
      label: "Formaldeído", card: "Formaldeído", icon: "mdi:flask-outline",
      domain: ["sensor"], dc: ["volatile_organic_compounds", "volatile_organic_compounds_parts"],
      unit: "mg/m³", dec: 3,
      stops: [0.03, 0.06, 0.1, 0.2], ramp: "bom_ruim",
    },
    voc: {
      label: "Compostos Orgânicos Voláteis", card: "COV", icon: "mdi:air-filter",
      domain: ["sensor"], dc: ["volatile_organic_compounds", "volatile_organic_compounds_parts"],
      unit: "ppb", dec: 0,
      stops: [100, 300, 1000, 3000], ramp: "bom_ruim",
    },
    pm25: {
      label: "PM2.5", card: "PM2.5", icon: "mdi:blur",
      domain: ["sensor"], dc: ["pm25"], unit: "µg/m³", dec: 0,
      stops: [12, 35, 55, 150], ramp: "bom_ruim",
    },
    pm10: {
      label: "PM10", card: "PM10", icon: "mdi:blur-linear",
      domain: ["sensor"], dc: ["pm10"], unit: "µg/m³", dec: 0,
      stops: [54, 154, 254, 354], ramp: "bom_ruim",
    },
    aqi: {
      label: "Qualidade do Ar", card: "Qualidade do Ar", icon: "mdi:weather-hazy",
      domain: ["sensor"], dc: ["aqi"], unit: "AQI", dec: 0,
      stops: [50, 100, 150, 200], ramp: "bom_ruim",
    },
    battery: {
      label: "Bateria", card: "Bateria", icon: "mdi:battery",
      domain: ["sensor"], dc: ["battery"], unit: "%", dec: 0,
      stops: [10, 20, 50, 80], ramp: "vazio_cheio",
    },
    noise: {
      label: "Ruído", card: "Ruído", icon: "mdi:volume-high",
      domain: ["sensor"], dc: ["sound_pressure"], unit: "dB", dec: 0,
      stops: [35, 45, 55, 70], ramp: "bom_ruim",
    },
    generic: {
      label: "Sensor (genérico)", card: "Sensor", icon: "mdi:gauge",
      domain: ["sensor", "binary_sensor", "input_number", "number", "counter"],
      unit: "", dec: 1,
      stops: [20, 40, 60, 80], ramp: "bom_ruim",
    },
  };
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
    paper_theme: "auto",       // auto | claro | escuro
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
    icon_size: null,           // % do lado; null = automático
    value_size: null,
    tap_action: { action: "none" },
    hold_action: { action: "none" },
    double_tap_action: { action: "none" },
  };

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
      return {
        ok: true,
        value: num(st.state),
        unit: c.unit || st.attributes.unit_of_measurement || k.unit || "",
        state: st.state,
      };
    }

    _dark() {
      const t = this._config.paper_theme;
      if (t === "claro") return false;
      if (t === "escuro") return true;
      return !!(this._hass?.themes?.darkMode);
    }

    // Papel + tinta do estado atual. É AQUI que mora a dinâmica pedida: o fundo
    // não é decoração fixa, é a leitura do sensor traduzida em papel.
    _skin(r) {
      const c = this._config, k = this._kind, dark = this._dark();
      if (!r.ok) {
        const a = dark ? "rgba(255, 150, 150, 0.72)" : "rgba(150, 40, 40, 0.72)";
        return {
          paper: dark ? "linear-gradient(145deg, #2a2724, #171512)" : "linear-gradient(145deg, #ecebe7, #d8d6d0)",
          accent: a, ring: a, dark,
        };
      }
      if (c.paper_mode === "fixo") {
        const key = c.paper_color || "paper";
        const a = accentOf(key, dark);
        return { paper: paperOf(key, dark), accent: a, ring: a, dark };
      }
      if (k.binary) {
        const side = r.on ? k.on : k.off;
        const key = (r.on ? c.paper_on : c.paper_off) || side.paper;
        const a = accentOf(key, dark);
        return { paper: paperOf(key, dark), accent: a, ring: a, dark };
      }
      const stops = this._stops();
      const ramp = c.ramp || k.ramp;
      const v = Number.isFinite(r.value) ? r.value : 0;
      const key = rampKey(ramp, bandOf(v, stops), stops.length + 1);
      const a = accentOf(key, dark);
      // Temperatura e umidade têm escala canônica da casa (regra global 40).
      // Ela vive no ANEL, não no número: amarelo puro (25 °C) sobre papel claro
      // é ilegível em 22 px, mas num anel de 1 cqi é exatamente o sinal certo.
      return { paper: paperOf(key, dark), accent: a, ring: (k.accent && k.accent(v)) || a, dark };
    }

    _stops() {
      const raw = String(this._config.stops || "").trim();
      if (raw) {
        const list = raw.split(/[,;\s]+/).map(Number).filter(Number.isFinite).sort((a, b) => a - b);
        if (list.length) return list;
      }
      return this._kind.stops || [];
    }

    /* --- desenho ---------------------------------------------------------- */

    _update(force) {
      const r = this._read();
      const key = JSON.stringify([r.ok, r.on, r.value, r.count, r.partial, this._dark()]);
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
      const radius = c.shape === "circle" ? "50%" : `${Math.max(0, Math.min(50, Number(c.corner) || 26))}%`;
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
      const pad = c.shape === "circle" ? 19 : 10;
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
          .ring{position:absolute;inset:5%;border-radius:inherit;pointer-events:none;z-index:0;
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
      const ink = paperInk(skin.dark);
      const q = this._quality;
      const card = el.card;
      card.style.setProperty("--mw-paper", skin.paper);
      card.style.setProperty("--mw-accent", skin.accent);
      card.style.setProperty("--mw-ring", skin.ring || skin.accent);
      card.style.setProperty("--mw-ink", ink.text);
      card.style.setProperty("--mw-ink-dim", ink.dim);
      card.style.setProperty("--mw-border", ink.line);
      card.style.setProperty("--mw-shadow", SHADOWS[q](skin.dark));
      card.style.setProperty("--mw-icon-shadow", ICON_SHADOW[q](skin.dark));
      card.style.setProperty("--mw-text-shadow",
        q === "plana" || skin.dark ? "none" : "0 1px 0 rgba(255,255,255,0.55)");

      if (el.icon) {
        let icon = c.icon;
        if (!icon && k.binary) icon = r.ok ? (r.on ? k.on.icon : k.off.icon) : k.icon;
        if (!icon) icon = this._entityIcon() || k.icon;
        el.icon.setAttribute("icon", r.ok ? icon : (c.icon_unavailable || "mdi:help-rhombus-outline"));
      }

      if (this._showValue) {
        let value = NO_READING, unit = "";
        if (r.ok && k.binary) {
          value = r.on ? (c.text_on || k.on.text) : (c.text_off || k.off.text);
        } else if (r.ok) {
          const dec = c.decimals === null || c.decimals === undefined
            ? (Math.abs(r.value) >= 100 ? 0 : (k.dec ?? 1))
            : Number(c.decimals);
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
    _src() { return this._config?.area && !(this._config?.entities || []).length ? "area" : "entities"; }

    _schema() {
      const kk = this._kindKey();
      const k = kindOf(kk);
      const c = this._config || {};
      const dark = c.paper_theme === "escuro";
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
        else s.push({ name: "entities", selector: { entity: { multiple: true, domain: k.domain, device_class: k.dc } } });
      } else {
        s.push({
          name: "entity", required: true,
          selector: { entity: k.dc ? { domain: k.domain, device_class: k.dc } : { domain: k.domain } },
        });
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
          { value: "claro", label: "Sempre papel claro" },
          { value: "escuro", label: "Sempre papel de noite" },
        ] } } },
        { name: "paper_mode", selector: { select: { mode: "dropdown", options: [
          { value: "dinamico", label: "Dinâmica — muda com o estado" },
          { value: "fixo", label: "Fixa — sempre a mesma" },
        ] } } },
      );
      const mode = c.paper_mode || "dinamico";
      if (mode === "fixo") {
        look.push({ name: "paper_color", selector: { select: { mode: "dropdown", options: paperOptionsFor(dark) } } });
      } else if (k.binary) {
        look.push(
          { name: "paper_on", selector: { select: { mode: "dropdown", options: paperOptionsFor(dark) } } },
          { name: "paper_off", selector: { select: { mode: "dropdown", options: paperOptionsFor(dark) } } },
        );
      } else {
        look.push(
          { name: "ramp", selector: { select: { mode: "dropdown", options: Object.keys(RAMPS).map((r) => ({ value: r, label: RAMP_LABELS[r] })) } } },
          { name: "stops", selector: { text: {} } },
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
