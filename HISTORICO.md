# HISTÓRICO

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
