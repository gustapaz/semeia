# Semeia

**Cada escolha deixa sementes.**

[Jogar gratuitamente](https://gustapaz.github.io/semeia/)

Um jogo de estratégia da família mancala, usando uma variante do tipo Kalah. Tabuleiro vertical de madeira, distribuição animada, capturas e turnos extras. Duas dificuldades de adversário calculado no próprio navegador e modo para duas pessoas no mesmo dispositivo.

## Regras desta variante

- Cada lado começa com seis casas de quatro sementes: 48 no total.
- Escolha uma casa própria não vazia e distribua uma semente por vez no sentido indicado. Inclua seu depósito e pule o depósito adversário.
- Última semente no depósito próprio: jogue novamente.
- Última em casa própria antes vazia: capture essa semente e as da casa oposta, **se a oposta não estiver vazia**.
- Um lado vazio encerra a partida. O outro recolhe as sementes restantes. Depósito maior vence; empate é possível.
- Limite defensivo de 200 jogadas: ambos recolhem e o resultado compara depósitos. Não há cronômetro.

Esta é uma variante específica; não pretendemos representar todas as regras e tradições da família mancala.

## Jogar

Clique/toque numa casa disponível ou use **1–6** com o tabuleiro focado. Em dupla, os números escolhem as casas do jogador da vez. **Tab/Enter** navegam; **P** pausa e **Escape** retoma/fecha regras.

Você/pessoa 1 semeia para baixo à esquerda, com depósito embaixo. Rival/pessoa 2 semeia para cima à direita, com depósito no topo. Contagens em texto acompanham as sementes, inclusive as temporariamente na mão durante a distribuição.

Casual usa busca de profundidade 1; Tático, até 5 níveis com orçamento de 12.000 nós por decisão. Busca alfa-beta determinística, sem serviço remoto de IA. Escolha quem começa antes da primeira jogada. Mudar configuração ou reiniciar começa uma nova partida; estatísticas permanecem. Menos movimento executa os mesmos estados imediatamente; áudio procedural é opcional e desligado inicialmente.

## Desenvolver

**Mithril.js 2.3.8 + JavaScript + CSS + Vite 8.** Modelo puro separado da interface, fluxo de semeadura pausável/cancelável e timers do adversário protegidos contra callbacks antigos. Sem Canvas/WebGL, engine, loop contínuo, fonte ou imagem externa.

Node 24:

```sh
npm ci
npm test
npm run build
npm run preview
```

Abra `http://127.0.0.1:4183/`. Para desenvolver: `npm run dev`. O build gera avisos de licença e exporta só `dist/`, com caminhos relativos para `/semeia/`. Harness local `/tests/browser.html` no servidor de desenvolvimento: testa ciclo de vida usando a chave de armazenamento desta origem local; fica fora do export.

## Privacidade, custos e licença

Histórico por modo e preferências ficam no `localStorage`. Save inválido é descartado; indisponibilidade de armazenamento não impede jogar. A tentativa atual não persiste ao recarregar. Histórico local é modificável pelo usuário; não é ranking online. Sem contas, telemetria, compras, API de consumo ou backend. Não há garantia de cache offline; GitHub Pages mantém seus próprios logs de acesso.

Demo estática em repositório público pelo [GitHub Pages gratuito](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages), sem cartão, faturamento ou trial contratado.

Veja [design](docs/game-design.md), [validação](docs/validation.md) e [assets](docs/assets.md). Código/arte originais: [MIT](LICENSE), © 2026 Gustavo Paz. Licença MIT do Mithril preservada em `public/third-party.txt` e no export.
