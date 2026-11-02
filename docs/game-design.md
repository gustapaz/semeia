# Semeia — cada escolha deixa sementes

Estratégia local em uma variante de semeadura do tipo Kalah, da família mancala. Tabuleiro, arte e implementação próprios; regras são apresentadas como esta variante, sem alegar representar todas as tradições de mancala. Não copiamos um jogo pronto, marcas ou assets comerciais.

## Produto completo

Doze casas, dois depósitos e 48 sementes (quatro por casa). Jogador 0 à esquerda semeia para baixo, depósito próprio embaixo; jogador 1 à direita semeia para cima, depósito próprio no topo. Escolher uma casa própria não vazia retira todas as sementes e distribui uma por casa, incluindo depósito próprio e pulando o adversário. Última no depósito próprio concede turno extra. Última em casa própria antes vazia captura ela e as sementes da oposta se a oposta não estiver vazia. Ao esvaziar um lado, o outro recolhe suas restantes; maior depósito vence, empate possível. Limite defensivo explícito de 200 jogadas recolhe os dois lados e encerra.

Modos: casual (adversário local por busca de profundidade 1), tático (profundidade 5, orçamento de 12.000 nós por decisão), dupla no mesmo dispositivo. Sem IA remota/API, contas, ranking global ou backend. Configuração de quem começa e modo antes da primeira jogada. Sem cronômetro; uma partida completa é o conteúdo, não uma campanha fragmentada. Estatísticas locais por modo; dupla identifica vitórias da pessoa 1, não competição online.

## Visual e técnica

Mithril.js + JavaScript + Vite; regras e busca independentes da UI. Tabuleiro vertical de madeira escura, cavidades profundas e sementes marfim; fundo mineral claro, título monumental em três linhas à esquerda e controles discretos à direita. Evitar o placar esportivo/grama do Tacada, teclas de Síncope ou mapas de Furtivo. Arte por CSS, sem fotos/texturas/fontes externas.

Animação distribui contagens passo a passo, realça a cavidade atual e mostra captura/recolhimento; sementes têm pequenos movimentos locais. Fluxo cancelável e pausável, sem loop contínuo. Redução de movimento resolve os mesmos estados imediatamente; som procedural opcional desligado inicialmente. Pausa em perda de foco/visibilidade, retomada explícita, restart limpa fluxo e timer do adversário.

Controles: clique/toque em casa disponível; números 1–6 no tabuleiro focado escolhem a casa do jogador da vez, Tab/Enter navegam; P pausa e Escape retoma/fecha regras. Contagens e instruções em DOM, sem depender só da cor/áudio. Botões grandes no móvel, ordem/sentido indicados no próprio tabuleiro.

## Conclusão

Testar conservação de 48 sementes, distribuição com salto, captura, turno extra, recolhimento, empate, limite, busca legal/determinística, estado final único, save e cancelamento/pausa. Completar partidas reais local/pública, testar modo de dupla e tático, teclado/resize/preferências e fluxo animado. Declarar uso de movimento reduzido e de estratégias calculadas nos testes. Demo GitHub Pages gratuita, sem cartão/faturamento, commits noreply e proprietário único contribuidor; scanners e licenças antes de publicar.
