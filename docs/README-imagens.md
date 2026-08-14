# Como as imagens do README são feitas

As duas imagens da galeria (`preview-dia.png`, `preview-noite.png`) **não** são
prints tirados à mão: saem da bancada, em modo headless, com o mesmo
`dist/mw-top-buttons-pack.js` que o HACS entrega. Print à mão envelhece calado —
este comando não.

A bancada aceita três parâmetros só para isto:

| Parâmetro | O que faz |
|---|---|
| `?galeria=1` | esconde o botão de tema e aperta as margens |
| `?noite=1` | começa no papel de noite |
| `?cols=7` | trava o número de colunas (a imagem fica sempre com a mesma cara) |

## Receita

```bash
# 1. servir o repositório (a bancada carrega ../dist/…js por caminho relativo)
python3 -m http.server 8107 &

# 2. capturar as duas, em 2× para a imagem não ficar borrada em tela retina
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
for modo in dia noite; do
  q="galeria=1&cols=7"; [ "$modo" = "noite" ] && q="$q&noite=1"
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars \
    --force-device-scale-factor=2 --window-size=1160,2080 \
    --virtual-time-budget=9000 --screenshot="/tmp/preview-$modo.png" \
    "http://localhost:8107/docs/preview.html?$q"
  sips -Z 1160 "/tmp/preview-$modo.png" --out "docs/preview-$modo.png"
done

# 3. o YAML do README sai das MESMAS filas da bancada
node tools/galeria.js
```

## Armadilhas

- **A altura da janela tem que caber a página inteira.** O `--screenshot` do
  Chrome captura o *viewport*, não o documento: se a janela for mais baixa que
  a página, a imagem sai cortada sem avisar. Meça antes
  (`document.body.scrollHeight` com a mesma largura) e passe em
  `--window-size`.
- **`--virtual-time-budget` não é enfeite.** A bancada busca os ícones do
  `@mdi/js` na rede; sem tempo de sobra, a imagem sai com todos os ícones no
  losango de interrogação.
- **`--force-device-scale-factor=2` e depois `sips -Z 1160`**: captura no dobro
  e reduz. Sem isso o texto pequeno do rodapé fica serrilhado no GitHub.
