#!/usr/bin/env node
/* galeria.js — gera a seção «Galeria» do README a partir da BANCADA.
 *
 * A imagem do README e o YAML do README saem da MESMA fonte (as filas do
 * docs/preview.html), então não existe README que mostre um card e ensine
 * outro. Roda depois de mexer na bancada:
 *
 *   node tools/galeria.js            # escreve entre os marcadores do README
 *   node tools/galeria.js --check    # falha se o README estiver desatualizado
 */
"use strict";
const fs = require("fs");
const path = require("path");

const raiz = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(raiz, "docs", "preview.html"), "utf8");
const m = /const FILAS = (\[[\s\S]*?\n\];)/.exec(html);
if (!m) { console.error("não achei a const FILAS na bancada"); process.exit(1); }
// eslint-disable-next-line no-eval
const FILAS = eval(m[1].replace(/;$/, ""));

const RAW = "https://raw.githubusercontent.com/visaodeempresa/mw-ha-top-buttons-pack/main";

// YAML curtinho: só o que estes cards usam (escalar, lista de strings)
const yaml = (v, ind) => {
  if (Array.isArray(v)) return "\n" + v.map((x) => `${ind}  - ${x}`).join("\n");
  if (typeof v === "string") return /^[\w.:/ ,°%-]+$/.test(v) && !/^\d/.test(v) ? ` ${v}` : ` "${v}"`;
  return ` ${v}`;
};
const cardYaml = (tag, cfg, ind) => {
  const linhas = [`${ind}- type: custom:${tag}`];
  for (const [k, v] of Object.entries(cfg)) linhas.push(`${ind}  ${k}:${yaml(v, ind + "  ")}`);
  return linhas.join("\n");
};

let out = [
  "## Galeria",
  "",
  "As duas imagens abaixo e todo o YAML desta seção saem da **mesma** fonte — as",
  "filas da bancada (`docs/preview.html`), transcritas por `tools/galeria.js`.",
  "Não existe aqui um card que a imagem mostre e o código não faça.",
  "",
  "<table><tr>",
  `<td width="50%"><img src="${RAW}/docs/preview-dia.png" alt="MW Top Buttons Pack — papel de dia"><br><sub>papel de dia</sub></td>`,
  `<td width="50%"><img src="${RAW}/docs/preview-noite.png" alt="MW Top Buttons Pack — papel de noite"><br><sub>papel de noite</sub></td>`,
  "</tr></table>",
  "",
  "> As duas imagens são geradas em modo headless a partir da própria bancada —",
  "> receita em [`docs/README-imagens.md`](docs/README-imagens.md). Depois de mexer",
  "> nas filas, rode `node tools/galeria.js` para o YAML acompanhar.",
  "",
];

for (const [titulo, itens] of FILAS) {
  const t = titulo.charAt(0).toUpperCase() + titulo.slice(1);
  out.push(`### ${t}`, "", "```yaml", "type: grid", `columns: ${Math.min(itens.length, 7)}`,
    "square: false", "cards:");
  for (const [tag, cfg] of itens) out.push(cardYaml(tag, cfg, "  "));
  out.push("```", "");
}

const bloco = out.join("\n").trimEnd() + "\n";
const readme = path.join(raiz, "README.md");
const src = fs.readFileSync(readme, "utf8");
const pat = /<!-- GALERIA:BEGIN[\s\S]*?<!-- GALERIA:END -->/;
const novo = `<!-- GALERIA:BEGIN — gerado por tools/galeria.js · não editar à mão -->\n${bloco}\n<!-- GALERIA:END -->`;
if (!pat.test(src)) { console.error("marcadores GALERIA:BEGIN/END não estão no README"); process.exit(1); }
const saida = src.replace(pat, novo);

if (process.argv.includes("--check")) {
  if (saida !== src) { console.error("✗ README desatualizado — rode: node tools/galeria.js"); process.exit(1); }
  console.log("✓ galeria do README em dia");
} else {
  fs.writeFileSync(readme, saida);
  console.log(`✓ galeria escrita: ${FILAS.length} filas, ${FILAS.reduce((n, f) => n + f[1].length, 0)} cards`);
}
