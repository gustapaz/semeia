# Validação

## Modelo e interface

- 21 testes Node aprovados: distribuição imutável, conservação de sementes em partidas completas, salto do depósito rival, captura/oposta vazia/lado rival, turno extra, recolhimento, empate, limite defensivo de 200 jogadas, entradas inválidas, busca legal/determinística, save e estatísticas. Fluxo testado com relógio controlado para ordem, pausa/retomada, redução de movimento e callbacks antigos.
- Partidas completas pela UI, sem injetar estado: Casual 41–7 em 13 jogadas; Tático 33–15 em 43; dupla 12–36 em 10, com vitória explícita da pessoa 2. Estratégias derivadas do modelo e executadas por botões normais; isso não prova dificuldade/diversão humana ou jogo ótimo. Evidências `local-casual.png`, `local-tatico.png`, `local-dupla.png`.
- Distribuição inicial animada, pausa por P no meio da semeadura e retomada explícita conferidas. Restante dos percursos usou Menos movimento, que resolve os mesmos estados imediatamente. Capturas, turno extra do rival e recolhimento final exercitados nas partidas.
- Nove verificações no harness local: save corrompido, blur durante semeadura, pausa estável sem CPU avançar, retomada com turno extra, partida real com rival, estatística única, input final sem duplicação, teclado numérico e cancelamento ao reiniciar. Blur foi disparado por Event; não alegar troca física de aba como prova. Harness não entra no export.
- Build local também concluiu Casual em viewport 390 × 844 por controles normais. Documento útil 375 px, sem overflow horizontal; casas ~132,5 × 58 px. Indicador de turno móvel acima do tabuleiro. Override temporário restaurado. Evidência `mobile-victory.png`.
- Rival começando foi selecionado e executou suas duas jogadas iniciais antes de entregar a vez. Som, redução de movimento e histórico persistiram após reload; tentativa atual reinicia. Sem análise auditiva humana de qualidade do som. Vozes simultâneas limitadas a oito; redução de movimento toca apenas um feedback por jogada, evitando sobreposição de dezenas de sementes.

## Segurança e gratuidade

Mithril.js/JavaScript/Vite, sem backend, WebGL, API remota ou ativos/fontes externos. Som e arte procedurais. `npm audit` sem achados. Build gera aviso de licença e exporta só `dist/`, excluindo fontes, docs, testes, `.git` e configuração local. Não há credenciais ou dados pessoais de demonstração.

GitHub Pages de repositório público disponível no plano gratuito, conforme https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages. Não foi cadastrado cartão, ativado faturamento ou contratado trial/serviço de consumo.

## Publicação verificada em 02/11/2026

- Implementação `000e5c0d509e783eff9defbc53c6417fed45236b`; workflow 41464855948 concluiu testes, auditoria, build e deploy com sucesso.
- Casual completo na URL pública por oito escolhas reais, com Menos movimento: 41–7, 13 jogadas. Vitória e histórico único confirmados; reload preservou a preferência e o histórico, reiniciando a tentativa como documentado. Evidências `public-gameplay.png` e `public-victory.png`.
- Cinco arquivos do export público conferidos byte a byte com o build local: HTML, favicon, licença, JavaScript e CSS.
- Gitleaks sem achados no conteúdo preparado, histórico, export e clone remoto. Secret scanning, push protection e alertas de dependências ativados no repositório.
- API do GitHub confirmou somente `gustapaz` como contribuidor; autor e committer usam `96732649+gustapaz@users.noreply.github.com`. Nenhum coautor adicional.

## Limites

Sem telefone físico, Safari, gamepad ou auditoria completa de leitor de tela. Contagens e controles são DOM e têm rótulos, mas não prometemos acessibilidade integral. Empate/limite defensivo cobertos no modelo, sem alegar partida manual de empate no navegador. Sem garantia offline, competição online confiável, FPS universal ou ausência absoluta de vulnerabilidades. Estatísticas locais são modificáveis pelo usuário. Erros de extensões do navegador são separados de erros do jogo.
