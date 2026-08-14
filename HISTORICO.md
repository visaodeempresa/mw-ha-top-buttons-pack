# HISTÓRICO

## 0.2.0 — 2026-08-14

Rodada de ajuste visual pedida pelo dono, toda conferida na bancada:

- **o fundo virou estado + intensidade**: a matiz diz o quê, o tom diz quanto.
  Quarto no breu dá papel escuro de verdade (L≈44 no tema claro, não 85);
  varanda ao sol dá papel quase branco — nos dois temas, porque o empurrão do
  tom é simétrico. Alcance por rampa, editável em `intensity`
- **estados conhecidos são exceção**, como pedido: porta/janela aberta =
  **verde**, fechada = **vermelho** (convenção dos outros componentes MW);
  ocupação e movimento com papel próprio por estado
- **indisponível/desconhecido**: vermelho que se nota sem gritar
- **temperatura e umidade agora são a escala canônica no PAPEL**, não só no
  anel — com a matiz intacta e saturação/luminosidade trazidas para a faixa do
  papel. Chapada, a escala vira néon; amansada, continua sendo a escala
- **cinco degraus de papel** além do `auto`: dia · dia puxado para o escuro ·
  meio do caminho · noite puxado para o claro · noite. Um só código: a rampa
  clara e a escura interpoladas
- **anel concêntrico**: o raio do anel é o do card menos o recuo — herdar o
  raio desenhava canto grande dentro de canto pequeno (o defeito do botão de
  ruído)
- **sensores teimosos**: seletor em cascata (classe → unidade → nome pt-BR)
  para achar COV em ppm, formaldeído em mg/m³ e PM2.5 sem unidade; limites por
  unidade; estado textual (`great` → `Ótima`)
- 0,4 ppm não vira mais `0`: valor abaixo de 1 ganha casas decimais

## 0.1.1 — 2026-08-14

Conferido na bancada (`docs/preview.html`), papel de dia e de noite:

- valor longo (`0,042 mg/m³`) encostava nas duas bordas — o corpo do número
  agora encolhe conforme o comprimento do texto (piso em 0,5×)
- círculo ganhou folga interna (14 % → 19 %): o texto tocava a curva
- bancada offline com os 17 tipos, três leituras da mesma grandeza e os três
  níveis de 3D lado a lado

## 0.1.0 — 2026-08-14

Nascimento do pacote. 17 tipos de card num arquivo só:

- temperatura, umidade, porta/janela, ocupação, movimento, luminosidade,
  potência (soma), consumo (soma), CO₂, formaldeído, COV, PM2.5, PM10,
  qualidade do ar, bateria, ruído e um genérico
- papel neumórfico 3D em três níveis de custo (`alta` · `equilibrada` · `plana`)
- fundo dinâmico: a faixa do valor escolhe o papel, pela rampa da grandeza
- escala canônica de clima (regra global 40) no anel de borda
- soma por lista de entidades **ou** por ambiente, com conversão de unidade
- editor visual completo, ações no padrão do HA, todas em «Nada» por padrão
- 1:1 sempre; quadrado de cantos arredondados ou círculo
