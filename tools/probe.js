#!/usr/bin/env node
/* probe.js — instancia o pacote fora do navegador.
 *
 * Serve para pegar erro de render, de esquema do editor e de faixa de cor sem
 * depender de browser (que neste ambiente não abre o HA). Não substitui a
 * conferência de tela — essa é do dono (regra global 30).
 *
 *   node tools/probe.js
 */
"use strict";
const fs = require("fs");
const path = require("path");

/* --- mini-DOM: só o que o card toca --------------------------------------- */
class El {
  constructor(tag) {
    this.tag = tag; this.children = []; this.attrs = {}; this.props = {};
    this._text = ""; this.style = { setProperty: (k, v) => { this.props[k] = v; } };
  }
  setAttribute(k, v) { this.attrs[k] = v; }
  getAttribute(k) { return this.attrs[k]; }
  addEventListener() {}
  removeEventListener() {}
  appendChild(c) { this.children.push(c); return c; }
  set textContent(v) { this._text = v; }
  get textContent() { return this._text; }
}

// O shadow root guarda o HTML como texto e devolve um El por seletor pedido,
// sempre o mesmo objeto — é assim que o _paint acha o que o _build criou.
class Shadow {
  constructor() { this._html = ""; this._els = new Map(); }
  set innerHTML(v) { this._html = v; this._els = new Map(); }
  get innerHTML() { return this._html; }
  querySelector(sel) {
    if (!this._html.includes(sel.split(" ").pop().replace(/^\./, "").replace(/^ha-/, "ha-"))
      && !this._html.includes(sel)) {
      // o elemento pode existir mesmo assim (seletor composto) — segue o baile
    }
    if (!this._els.has(sel)) this._els.set(sel, new El(sel));
    return this._els.get(sel);
  }
  querySelectorAll() { return []; }
  getElementById() { return new El("x"); }
}

global.HTMLElement = class {
  constructor() { this.shadowRoot = null; this._listeners = {}; }
  attachShadow() { this.shadowRoot = new Shadow(); return this.shadowRoot; }
  dispatchEvent() { return true; }
  addEventListener() {}
  appendChild(c) { return c; }
  setAttribute() {}
};
const reg = {};
global.customElements = { define: (n, c) => { reg[n] = c; }, get: (n) => reg[n] };
global.document = { createElement: (t) => new El(t) };
global.window = { customCards: [] };
global.history = { pushState() {} };
global.CustomEvent = class { constructor(t, o) { this.type = t; Object.assign(this, o); } };
console.info = () => {};

const file = path.join(__dirname, "..", "dist", "mw-top-buttons-pack.js");
eval(fs.readFileSync(file, "utf8"));

/* --- estados de mentira --------------------------------------------------- */
const st = (state, attrs = {}) => ({ state: String(state), attributes: attrs });
const hass = {
  locale: { language: "pt-BR" },
  themes: { darkMode: false },
  states: {
    "sensor.sala_temp": st(23.4, { unit_of_measurement: "°C", device_class: "temperature", friendly_name: "Sala" }),
    "sensor.sala_umid": st(58, { unit_of_measurement: "%", device_class: "humidity" }),
    "sensor.sala_co2": st(1240, { unit_of_measurement: "ppm", device_class: "carbon_dioxide" }),
    "sensor.sala_pot": st(742.5, { unit_of_measurement: "W", device_class: "power" }),
    "sensor.tv_pot": st(1.2, { unit_of_measurement: "kW", device_class: "power" }),
    "sensor.sala_energia": st(12.34, { unit_of_measurement: "kWh", device_class: "energy" }),
    "sensor.morto": st("unavailable", { device_class: "temperature" }),
    "binary_sensor.porta": st("on", { device_class: "door", friendly_name: "Porta da sala" }),
    "binary_sensor.mov": st("off", { device_class: "motion" }),
  },
  entities: {
    "sensor.sala_pot": { device_id: "d1", area_id: null },
    "sensor.tv_pot": { device_id: "d2", area_id: "sala" },
    "sensor.sala_temp": { device_id: "d1", area_id: null },
  },
  devices: { d1: { id: "d1", area_id: "sala" }, d2: { id: "d2", area_id: "quarto" } },
  areas: { sala: { name: "Sala" } },
  callService() {},
};

const build = (tag, cfg) => {
  const el = new reg[tag]();
  el.setConfig(cfg);
  el.hass = hass;
  return el;
};
const dump = (nome, el) => {
  const card = el.shadowRoot.querySelector("ha-card");
  const v = el.shadowRoot.querySelector(".v");
  const u = el.shadowRoot.querySelector(".u");
  console.log(
    nome.padEnd(26),
    (v.textContent + " " + u.textContent).trim().padEnd(12),
    "papel:", String(card.props["--mw-paper"]).replace(/linear-gradient\(145deg, | |\)$/g, "").padEnd(30),
    "anel:", card.props["--mw-ring"],
  );
};

let fail = 0;
const check = (cond, msg) => { if (!cond) { fail++; console.log("  ✗", msg); } };

console.log("\n— cards registrados —");
const tags = Object.keys(reg).filter((t) => t.startsWith("mw-top-") && !t.endsWith("-editor"));
console.log(tags.join("\n"));
check(tags.length === 17, `esperava 17 tipos, achei ${tags.length}`);
check(global.window.customCards.length === 17, "customCards fora de sincronia com os tipos");

console.log("\n— leituras —");
dump("temperatura 23,4 °C", build("mw-top-temperature-card", { entity: "sensor.sala_temp" }));
dump("umidade 58 %", build("mw-top-humidity-card", { entity: "sensor.sala_umid" }));
dump("co2 1240 ppm", build("mw-top-co2-card", { entity: "sensor.sala_co2" }));
dump("porta aberta", build("mw-top-door-window-card", { entity: "binary_sensor.porta", show_value: true }));
dump("movimento parado", build("mw-top-motion-card", { entity: "binary_sensor.mov", show_value: true }));
dump("indisponível", build("mw-top-temperature-card", { entity: "sensor.morto" }));
dump("soma 742,5 W + 1,2 kW", build("mw-top-power-card", { entities: ["sensor.sala_pot", "sensor.tv_pot"] }));
dump("soma por ambiente", build("mw-top-power-card", { area: "sala" }));
dump("consumo 12,34 kWh", build("mw-top-energy-card", { entity: "sensor.sala_energia" }));
dump("genérico + kind", build("mw-top-button-card", { kind: "co2", entity: "sensor.sala_co2" }));

console.log("\n— conferências —");
{
  const el = build("mw-top-power-card", { entities: ["sensor.sala_pot", "sensor.tv_pot"] });
  // 742,5 W + 1,2 kW = 1942,5 W — se a conversão de unidade falhar, dá 743,7
  check(el.shadowRoot.querySelector(".v").textContent.startsWith("1.94"),
    `soma com unidades diferentes: ${el.shadowRoot.querySelector(".v").textContent}`);
}
{
  // sala_pot herda a área do dispositivo (d1 = sala); tv_pot tem área PRÓPRIA
  // "sala" mesmo o dispositivo dele sendo do quarto — a área da entidade vence,
  // que é a regra do próprio HA. Os dois entram: 742,5 W + 1,2 kW.
  const el = build("mw-top-power-card", { area: "sala" });
  check(el.shadowRoot.querySelector(".v").textContent.startsWith("1.94"),
    `soma por ambiente: ${el.shadowRoot.querySelector(".v").textContent}`);
  const el2 = build("mw-top-power-card", { area: "quarto" });
  check(el2.shadowRoot.querySelector(".v").textContent === "—",
    "ambiente sem sensor devia dar travessão");
}
{
  const el = build("mw-top-temperature-card", { entity: "sensor.morto" });
  check(el.shadowRoot.querySelector(".v").textContent === "—", "leitura morta não virou travessão");
  check(el.shadowRoot.querySelector(".u").textContent === "", "unidade sobreviveu à leitura morta");
}
{
  const frio = build("mw-top-temperature-card", { entity: "sensor.sala_temp" });
  const quente = new reg["mw-top-temperature-card"]();
  quente.setConfig({ entity: "sensor.sala_temp" });
  quente.hass = { ...hass, states: { ...hass.states, "sensor.sala_temp": st(34, { unit_of_measurement: "°C" }) } };
  const a = frio.shadowRoot.querySelector("ha-card").props["--mw-paper"];
  const b = quente.shadowRoot.querySelector("ha-card").props["--mw-paper"];
  check(a !== b, "papel não mudou entre 23 °C e 34 °C — a dinâmica morreu");
  console.log("  23,4 °C →", a, "\n  34,0 °C →", b);
}
{
  // ação padrão é «Nada»: o card não pode ficar com cursor de clique
  const el = build("mw-top-co2-card", { entity: "sensor.sala_co2" });
  check(el.shadowRoot.innerHTML.includes("cursor:default"), "ação padrão não é «Nada»");
  const el2 = build("mw-top-co2-card", { entity: "sensor.sala_co2", tap_action: { action: "more-info" } });
  check(el2.shadowRoot.innerHTML.includes("cursor:pointer"), "ação configurada não virou cursor de clique");
}
{
  // 1:1 e formato
  const q = build("mw-top-co2-card", { entity: "sensor.sala_co2" });
  check(q.shadowRoot.innerHTML.includes("aspect-ratio:1/1"), "perdeu o 1:1");
  check(/border-radius:26%/.test(q.shadowRoot.innerHTML), "arredondamento padrão sumiu");
  const c = build("mw-top-co2-card", { entity: "sensor.sala_co2", shape: "circle" });
  check(/border-radius:50%/.test(c.shadowRoot.innerHTML), "círculo não ficou redondo");
}

console.log("\n— editor —");
for (const [tipo, cfg] of [
  ["custom:mw-top-temperature-card", { entity: "sensor.sala_temp" }],
  ["custom:mw-top-door-window-card", { entity: "binary_sensor.porta" }],
  ["custom:mw-top-power-card", { entities: ["sensor.sala_pot"] }],
  ["custom:mw-top-power-card", { area: "sala" }],
  ["custom:mw-top-button-card", { kind: "pm25", entity: "sensor.sala_co2" }],
]) {
  const ed = new reg["mw-top-button-card-editor"]();
  ed._config = { type: tipo, ...cfg };
  const s = ed._schema();
  const nomes = s.map((f) => f.name || `[${f.title}]`);
  console.log(tipo.padEnd(34), ed._kindKey().padEnd(13), nomes.join(" "));
  check(s.some((f) => f.type === "expandable" && f.title === "Ações"), "seção de ações sumiu");
  const acoes = s.find((f) => f.title === "Ações").schema;
  check(acoes.every((f) => f.selector.ui_action.default_action === "none"),
    "ação do editor não abre em «Nada»");
}

console.log(fail ? `\n✗ ${fail} conferência(s) falharam\n` : "\n✓ tudo certo\n");
process.exit(fail ? 1 : 0);
