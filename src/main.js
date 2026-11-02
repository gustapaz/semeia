import m from "mithril";
import {
  createGame,
  legalMoves,
  sow,
  chooseMove,
  readSave,
  record,
} from "./game.js";
import { SowFlow } from "./flow.js";
import "./style.css";
const KEY = "semeia.save.v1",
  root = document.querySelector("#app");
let save;
try {
  save = readSave(localStorage.getItem(KEY));
} catch {
  save = readSave(null);
}
let game = createGame(),
  visual = [...game.board],
  mode = "casual",
  starter = 0,
  busy = false,
  paused = false,
  active = -1,
  botTimer = null,
  epoch = 0,
  dialog,
  help = false,
  recorded = false,
  last = "Escolha uma casa do seu lado para começar.",
  audio;
const voices = new Set(),
  flow = new SowFlow(),
  media = matchMedia("(prefers-reduced-motion: reduce)");
const reduced = () => save.reduced || media.matches;
const playerName = (p) =>
  mode === "dupla" ? `Pessoa ${p + 1}` : p === 0 ? "Você" : "Rival";
const redraw = () => m.redraw();
const persist = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(save));
  } catch {
    /* Local persistence is optional. */
  }
};
function silence() {
  for (const o of voices) {
    try {
      o.stop();
    } catch {
      /* Already stopped. */
    }
  }
  voices.clear();
}
function sound(kind = "seed") {
  if (!save.sound) return;
  try {
    audio ??= new AudioContext();
    void audio.resume().catch(() => {});
    if (voices.size >= 8) {
      const oldest = voices.values().next().value;
      try {
        oldest.stop();
      } catch {}
      voices.delete(oldest);
    }
    const o = audio.createOscillator(),
      g = audio.createGain();
    o.frequency.value =
      kind === "capture" ? 470 : kind === "end" ? 660 : 250 + active * 14;
    g.gain.setValueAtTime(0.035, audio.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.09);
    o.connect(g);
    g.connect(audio.destination);
    voices.add(o);
    o.onended = () => {
      voices.delete(o);
      o.disconnect();
      g.disconnect();
    };
    o.start();
    o.stop(audio.currentTime + 0.1);
  } catch {
    /* The visual game works without sound. */
  }
}
function scheduleBot() {
  clearTimeout(botTimer);
  botTimer = null;
  if (
    game.status !== "playing" ||
    game.player !== 1 ||
    mode === "dupla" ||
    paused ||
    busy
  )
    return;
  const token = epoch;
  botTimer = setTimeout(
    () => {
      if (
        token !== epoch ||
        paused ||
        busy ||
        game.status !== "playing" ||
        game.player !== 1
      )
        return;
      const pit = chooseMove(game, mode === "tatico" ? 5 : 1);
      if (pit !== null) play(pit, true);
    },
    reduced() ? 0 : 450,
  );
}
function play(pit, computer = false) {
  if (
    paused ||
    busy ||
    dialog?.open ||
    game.status !== "playing" ||
    (!computer && mode !== "dupla" && game.player === 1)
  )
    return;
  const result = sow(game, pit);
  if (result.state === game) return;
  busy = true;
  document.querySelector("#board")?.focus({ preventScroll: true });
  clearTimeout(botTimer);
  botTimer = null;
  flow.run(
    result.steps,
    (step) => {
      visual = step.board;
      active = step.at;
      if (!reduced()) sound(step.kind === "capture" ? "capture" : "seed");
      redraw();
    },
    () => {
      game = result.state;
      visual = [...game.board];
      busy = false;
      active = -1;
      const s = result.summary;
      const nextMessage =
        game.player === 0 && mode !== "dupla"
          ? "Sua vez."
          : `Agora joga ${playerName(game.player).toLowerCase()}.`;
      last = `${playerName(s.player)} escolheu a casa ${s.pit < 6 ? s.pit + 1 : s.pit - 6}. ${s.captured ? `Captura de ${s.captured} sementes. ` : ""}${s.extra ? "Última no depósito: joga novamente." : s.ended ? (game.reason === "limit" ? "Limite de 200 jogadas: ambos recolheram suas sementes." : "As sementes restantes foram recolhidas.") : nextMessage}`;
      if (game.status === "over" && !recorded) {
        save = record(save, game, mode);
        persist();
        recorded = true;
        sound("end");
      } else if (reduced()) sound(s.captured ? "capture" : "seed");
      redraw();
      scheduleBot();
    },
    reduced(),
  );
  redraw();
}
function reset() {
  epoch++;
  clearTimeout(botTimer);
  botTimer = null;
  flow.cancel();
  silence();
  game = createGame(starter);
  visual = [...game.board];
  busy = false;
  paused = false;
  active = -1;
  recorded = false;
  last = "Nova partida. Escolha com calma.";
  redraw();
  scheduleBot();
}
function openDialog(isHelp = false) {
  if (dialog?.open) return;
  help = isHelp;
  paused = game.status === "playing";
  epoch++;
  clearTimeout(botTimer);
  botTimer = null;
  flow.pause();
  silence();
  m.redraw.sync();
  dialog.showModal();
  dialog.querySelector("button").focus();
}
function closeDialog() {
  dialog.close();
  paused = false;
  if (busy) flow.resume();
  else scheduleBot();
  redraw();
  document.querySelector("#board")?.focus({ preventScroll: true });
}
function toggleMotion() {
  save.reduced = !save.reduced;
  persist();
  if (reduced() && busy && !paused) flow.finish();
  redraw();
}
function key(e) {
  if (dialog?.open) return;
  const field = document.querySelector("#board");
  if (!field?.contains(e.target)) return;
  if (e.key.toLowerCase() === "p") {
    e.preventDefault();
    openDialog();
    return;
  }
  if (!e.repeat && /^[1-6]$/.test(e.key)) {
    e.preventDefault();
    play(Number(e.key) - 1 + (game.player === 1 ? 7 : 0));
  }
}
function seeds(n, store = false) {
  return Array.from({ length: Math.min(n, store ? 18 : 12) }, (_, i) =>
    m("i.seed", {
      key: i,
      style: {
        left: `${store ? 12 + (i % 9) * 9.5 : 50 + Math.cos(i * 2.4) * Math.sqrt(i + 1) * 7}%`,
        top: `${store ? 32 + Math.floor(i / 9) * 26 : 50 + Math.sin(i * 2.4) * Math.sqrt(i + 1) * 6}%`,
        transform: `translate(-50%,-50%) rotate(${((i * 51) % 180) - 90}deg)`,
      },
    }),
  );
}
function cup(index) {
  const owner = index < 6 ? 0 : 1,
    n = index < 6 ? index + 1 : index - 6,
    available =
      !busy &&
      !paused &&
      game.status === "playing" &&
      game.player === owner &&
      (mode === "dupla" || owner === 0) &&
      game.board[index] > 0;
  return m(
    `button#pit-${index}.pit`,
    {
      key: index,
      class: `${available ? "available" : ""} ${active === index ? "sowing" : ""} ${owner === 0 ? "south" : "north"}`,
      disabled: !available,
      "data-pit": index,
      "aria-label": `${playerName(owner)}, casa ${n}, ${visual[index]} ${visual[index] === 1 ? "semente" : "sementes"}`,
      onclick: () => play(index),
    },
    [
      m("span.pit-number", String(n).padStart(2, "0")),
      m("span.cavity", { "aria-hidden": "true" }, seeds(visual[index])),
      m("strong.pit-count", visual[index]),
      m("span.choose", available ? "ESCOLHER" : ""),
    ],
  );
}
function store(index) {
  const p = index === 6 ? 0 : 1;
  return m(
    `div.store#store-${index}`,
    {
      class: active === index ? "sowing" : "",
      "aria-label": `Depósito de ${playerName(p)}: ${visual[index]} ${visual[index] === 1 ? "semente" : "sementes"}`,
    },
    [
      m("div.store-label", [
        m("span", playerName(p)),
        m("strong", visual[index]),
      ]),
      m(
        "div.store-cavity",
        { "aria-hidden": "true" },
        seeds(visual[index], true),
      ),
    ],
  );
}
function stateTitle() {
  if (paused) return "O tempo é seu.";
  if (game.status === "over")
    return game.winner === -1
      ? "Uma colheita em equilíbrio."
      : game.winner === 0
        ? mode === "dupla"
          ? "Pessoa 1 venceu."
          : "Você colheu mais."
        : mode === "dupla"
          ? "Pessoa 2 venceu."
          : "O rival colheu mais.";
  if (busy) return "Uma por uma.";
  return game.player === 1 && mode !== "dupla"
    ? "O rival está escolhendo."
    : mode !== "dupla"
      ? "Sua vez."
      : `Vez da pessoa ${game.player + 1}.`;
}
const App = {
  oncreate() {
    window.addEventListener("blur", onBlur);
    document.addEventListener("visibilitychange", onVisibility);
    scheduleBot();
  },
  onremove() {
    epoch++;
    clearTimeout(botTimer);
    flow.cancel();
    silence();
    void audio?.close().catch(() => {});
    window.removeEventListener("blur", onBlur);
    document.removeEventListener("visibilitychange", onVisibility);
  },
  view() {
    const stats = save.stats[mode],
      finished = game.status === "over";
    return m(
      "div.app",
      { class: save.reduced ? "reduced" : "", onkeydown: key },
      [
        m("header", [
          m("a.brand", { href: "./", "aria-label": "Semeia início" }, [
            "s",
            m("span", "•"),
          ]),
          m("span.header-note", "ESTRATÉGIA QUE PASSA DE MÃO EM MÃO."),
          m("nav", [
            m("button", { onclick: () => openDialog(true) }, "Regras ?"),
            m(
              "button#sound",
              {
                "aria-pressed": String(save.sound),
                onclick: () => {
                  save.sound = !save.sound;
                  persist();
                  if (save.sound) sound();
                  else silence();
                },
              },
              `Som ${save.sound ? "ligado" : "desligado"}`,
            ),
            m(
              "button#motion",
              { "aria-pressed": String(save.reduced), onclick: toggleMotion },
              "Menos movimento",
            ),
          ]),
        ]),
        m("main", [
          m("section.identity", [
            m("p.eyebrow", "UM TABULEIRO. MUITAS POSSIBILIDADES."),
            m("h1", { "aria-label": "Semeia" }, [
              m("span", "se"),
              m("span", "me"),
              m("span", "ia"),
              m("i", "48"),
            ]),
            m("p.tagline", ["Cada escolha", m("br"), " deixa sementes."]),
            m("div.edition", [
              m("span", "KALAH / VARIANTE LOCAL"),
              m("span", "12 CASAS · 48 SEMENTES"),
            ]),
          ]),
          m("section.board-area", [
            m("div.mobile-turn", stateTitle()),
            m("div.board-caption", [
              m("span", mode === "dupla" ? "PESSOA 2" : "RIVAL"),
              m("span.direction", "↑ SEMEIA PARA CIMA"),
            ]),
            m(
              "div#board.board",
              {
                tabindex: 0,
                role: "group",
                "aria-label":
                  "Tabuleiro. Números 1 a 6 escolhem casas; P pausa.",
              },
              [
                store(13),
                m("div.pits", [
                  m(
                    "div.pit-column.player-0",
                    Array.from({ length: 6 }, (_, i) => cup(i)),
                  ),
                  m("div.channel", [m("span", "↓"), m("i"), m("span", "↑")]),
                  m(
                    "div.pit-column.player-1",
                    Array.from({ length: 6 }, (_, i) => cup(12 - i)),
                  ),
                ]),
                store(6),
              ],
            ),
            m("div.board-caption", [
              m("span", mode === "dupla" ? "PESSOA 1" : "VOCÊ"),
              m("span.direction", "↓ SEMEIA PARA BAIXO"),
            ]),
          ]),
          m("aside", [
            m(
              "p.eyebrow",
              finished
                ? "PARTIDA CONCLUÍDA"
                : busy
                  ? "SEMEANDO"
                  : paused
                    ? "PAUSA"
                    : "SUA COLHEITA COMEÇA AQUI",
            ),
            m("h2#state-title", stateTitle()),
            m("p#status", { role: "status", "aria-live": "polite" }, last),
            m("div.tally", [
              m("div", [
                m("span", playerName(0)),
                m("strong#score-0", game.board[6]),
              ]),
              m("span.versus", "/"),
              m("div", [
                m("span", playerName(1)),
                m("strong#score-1", game.board[13]),
              ]),
            ]),
            m(
              "p.hand",
              busy
                ? `${48 - visual.reduce((a, b) => a + b, 0)} sementes na mão`
                : `${game.moves} jogadas · sem limite de tempo`,
            ),
            m("div.controls", [
              m(
                "button.primary#restart",
                { onclick: reset },
                finished ? "Jogar novamente ↗" : "Reiniciar partida ↺",
              ),
              m(
                "button#pause",
                { disabled: finished, onclick: () => openDialog() },
                "Pausar P",
              ),
            ]),
            m("div.configuration", [
              m("label", [
                "PARTIDA",
                m(
                  "select#mode",
                  {
                    "aria-label": "Modo de jogo",
                    value: mode,
                    disabled: busy || (game.moves > 0 && !finished),
                    onchange: (e) => {
                      mode = e.target.value;
                      reset();
                    },
                  },
                  [
                    m("option", { value: "casual" }, "Contra o rival · Casual"),
                    m("option", { value: "tatico" }, "Contra o rival · Tático"),
                    m("option", { value: "dupla" }, "Dupla neste dispositivo"),
                  ],
                ),
              ]),
              m("label", [
                "PRIMEIRA SEMENTE",
                m(
                  "select#starter",
                  {
                    "aria-label": "Quem começa",
                    value: starter,
                    disabled: busy || (game.moves > 0 && !finished),
                    onchange: (e) => {
                      starter = Number(e.target.value);
                      reset();
                    },
                  },
                  [
                    m(
                      "option",
                      { value: 0 },
                      mode === "dupla" ? "Pessoa 1" : "Você",
                    ),
                    m(
                      "option",
                      { value: 1 },
                      mode === "dupla" ? "Pessoa 2" : "Rival",
                    ),
                  ],
                ),
              ]),
            ]),
            m("div.local", [
              m("p.eyebrow", "HISTÓRICO LOCAL"),
              m(
                "p",
                `${stats.played} ${stats.played === 1 ? "partida" : "partidas"} · ${stats.wins} ${stats.wins === 1 ? "vitória" : "vitórias"} ${mode === "dupla" ? "da pessoa 1" : stats.wins === 1 ? "sua" : "suas"} · ${stats.draws} ${stats.draws === 1 ? "empate" : "empates"}`,
              ),
              m("small", "Só neste navegador. A tentativa atual não é salva."),
            ]),
            m("details", [
              m("summary", "Três regras para começar"),
              m("ol", [
                m(
                  "li",
                  "Escolha uma casa do seu lado e distribua todas as sementes.",
                ),
                m("li", "Última no seu depósito? Jogue de novo."),
                m(
                  "li",
                  "Última em casa própria vazia? Capture a oposta, se ela tiver sementes.",
                ),
              ]),
            ]),
          ]),
        ]),
        m("footer", [
          m(
            "span",
            "NÃO É SOBRE CORRER. É SOBRE O QUE VOCÊ DEIXA PELO CAMINHO.",
          ),
          m("span", "Adversário calculado localmente. Sem contas ou serviços."),
        ]),
        m(
          "dialog",
          {
            "aria-labelledby": "dialog-title",
            oncreate: (v) => {
              dialog = v.dom;
            },
            oncancel: (e) => {
              e.preventDefault();
              closeDialog();
            },
          },
          [
            m("p.eyebrow", help ? "CADERNO DE REGRAS" : "INTERVALO"),
            m(
              "h2#dialog-title",
              help ? "Semeie. Capture. Colha." : "Uma pausa entre escolhas.",
            ),
            help
              ? m("div", [
                  m(
                    "p",
                    "Esta é uma variante do tipo Kalah da família mancala. Cada lado começa com seis casas de quatro sementes.",
                  ),
                  m("ol", [
                    m(
                      "li",
                      "Escolha uma casa própria com sementes. Distribua uma por vez no sentido indicado, incluindo seu depósito e pulando o depósito adversário.",
                    ),
                    m(
                      "li",
                      "Se a última cair no seu depósito, você joga novamente.",
                    ),
                    m(
                      "li",
                      "Se a última cair em casa própria que estava vazia e a oposta tiver sementes, capture as da oposta e a última para seu depósito.",
                    ),
                    m(
                      "li",
                      "Um lado vazio encerra a partida; o outro recolhe suas restantes. O depósito maior vence. Empate é possível. Aos 200 movimentos, ambos recolhem e o jogo encerra por limite defensivo.",
                    ),
                    m(
                      "li",
                      "Clique/toque ou números 1–6 no tabuleiro focado. Tab/Enter navegam, P pausa e Escape retoma. Dupla é no mesmo dispositivo.",
                    ),
                    m(
                      "li",
                      "Casual calcula uma jogada à frente; Tático busca até cinco níveis, com limite de 12.000 nós. Nada é enviado a uma API. Menos movimento mantém as regras sem animação.",
                    ),
                  ]),
                ])
              : m(
                  "p",
                  "As sementes ficam onde estão. Ao retomar, a distribuição ou a escolha do rival continua. Nenhum movimento passa sozinho enquanto você pausa.",
                ),
            m(
              "button.primary#close",
              { onclick: closeDialog },
              help ? "Entendi, voltar ↗" : "Retomar partida ↗",
            ),
          ],
        ),
      ],
    );
  },
};
function onBlur() {
  if (game.status === "playing" && !dialog?.open) openDialog();
}
function onVisibility() {
  if (document.hidden) onBlur();
}
m.mount(root, App);
