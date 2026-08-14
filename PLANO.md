# PLANO — MW Top Buttons Pack

## O que é

Um pacote de cards de **leitura** para o topo dos dashboards: 17 tipos, um por
grandeza, desenhados pelo mesmo motor. Arquivo único, sem build:
`dist/mw-top-buttons-pack.js` é fonte **e** artefato.

## Decisões (e o que foi descartado)

**Um arquivo, N tipos de card — não N repositórios.** O HACS instala um
`filename` por repositório; um pacote com 17 repositórios seria 17 instalações
para o dono manter em dia. Um arquivo que registra 17 `customElements` custa
uma instalação e aparece com 17 entradas no seletor de cards, que é
exatamente o que se quer de um *pack*.

**Motor único, grandeza como descritor.** Cada grandeza é uma linha na tabela
`KINDS` (ícone, `device_class`, unidade, casas, limites, rampa). Card novo é
uma linha, não um arquivo. Descartado: uma classe por grandeza — dava 17 cópias
do mesmo `_paint` para manter em sincronia.

**O papel é a leitura.** A cor de fundo sai da faixa em que o valor caiu, pela
rampa de papel da grandeza. Sem isto o pacote seria 17 mostradores de número
com fundo bege.

**A escala canônica de clima vive no anel, não no número** (regra global 40).
A escala é feita para pintar áreas grandes; como cor de texto ela reprova —
25 °C é amarelo puro, ilegível sobre papel claro em 22 px. O anel de borda
mostra a mesma cor sem custar legibilidade.

**Ação padrão «Nada».** Pedido do dono e a escolha certa: botão de leitura no
topo é alvo fácil de toque acidental. As três ações usam o seletor `ui_action`
do próprio HA, então o editor é o mesmo que o das outras cards.

**Pintura por variável CSS, não por `innerHTML`.** Estrutura e CSS são montados
uma vez por configuração; cada leitura nova troca `--mw-paper`, `--mw-accent`,
`--mw-ring` e dois `textContent`. Doze botões no topo de um dashboard
atualizando a cada leitura de sensor não podem recriar doze shadow roots.

**Tamanhos em `cqi`.** O botão é proporcional em qualquer grade sem uma linha
de JS de medição. Há fallback em px dentro de `@supports` para navegador velho.

## Estado

- [x] Motor, 17 grandezas, editor visual, ações, papel claro/escuro
- [x] `probe.js` — 17 tipos instanciados fora do navegador, 12 conferências
- [x] Blocos canônicos (`paper-palette`, `paper-dark-palette`,
      `mw-climate-scale`) embutidos e conferidos pelo `check-embeds.sh`
- [x] Instalação no HA por HACS (repositório personalizado)
- [ ] **Validação de tela pelo dono** ← estamos aqui
- [ ] DevOps padrão (`IA/tools/mw-devops.sh apply`) — só depois do OK
- [ ] Marca no README pela `mw-brand.sh` (o bloco já está posto à mão)

## Próximos passos possíveis (não fazer sem pedido)

- Faixas com histerese (evitar o papel piscar entre duas cores num sensor ruidoso)
- Mini-gráfico de 24 h no fundo do botão (`sensor` com histórico)
- Elemento de picture-elements irmão, para a planta (skill `mw-picture-element`)
