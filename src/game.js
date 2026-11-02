export const PITS = [
  [0, 1, 2, 3, 4, 5],
  [7, 8, 9, 10, 11, 12],
];
export const STORES = [6, 13];
export function createGame(starter = 0) {
  return {
    board: [4, 4, 4, 4, 4, 4, 0, 4, 4, 4, 4, 4, 4, 0],
    player: starter === 1 ? 1 : 0,
    moves: 0,
    status: "playing",
    winner: null,
    reason: "",
  };
}
export function legalMoves(g) {
  return g.status === "playing"
    ? PITS[g.player].filter((i) => g.board[i] > 0)
    : [];
}
function apply(g, pit, trace) {
  if (!Number.isInteger(pit) || !legalMoves(g).includes(pit))
    return { state: g, steps: [], summary: null };
  const board = [...g.board],
    steps = [],
    player = g.player,
    store = STORES[player],
    skip = STORES[1 - player];
  let seeds = board[pit],
    cursor = pit,
    captured = 0;
  const snapshot = (at, kind) => {
    if (trace) steps.push({ at, kind, board: [...board] });
  };
  board[pit] = 0;
  snapshot(pit, "lift");
  while (seeds > 0) {
    cursor = (cursor + 1) % 14;
    if (cursor === skip) continue;
    board[cursor]++;
    seeds--;
    snapshot(cursor, "sow");
  }
  if (
    PITS[player].includes(cursor) &&
    board[cursor] === 1 &&
    board[12 - cursor] > 0
  ) {
    captured = board[12 - cursor] + 1;
    board[store] += captured;
    board[cursor] = 0;
    board[12 - cursor] = 0;
    snapshot(store, "capture");
  }
  const empty = PITS.some((side) => side.every((i) => board[i] === 0)),
    moves = g.moves + 1,
    limited = moves >= 200;
  if (empty || limited) {
    for (let p = 0; p < 2; p++)
      for (const i of PITS[p]) {
        board[STORES[p]] += board[i];
        board[i] = 0;
      }
    snapshot(store, "sweep");
  }
  const over = empty || limited,
    extra = !over && cursor === store;
  const state = {
    board,
    player: extra ? player : 1 - player,
    moves,
    status: over ? "over" : "playing",
    winner: over
      ? board[6] === board[13]
        ? -1
        : board[6] > board[13]
          ? 0
          : 1
      : null,
    reason: over ? (limited ? "limit" : "empty") : "",
  };
  return {
    state,
    steps,
    summary: { pit, player, last: cursor, captured, extra, ended: over },
  };
}
export function move(g, pit) {
  return apply(g, pit, false).state;
}
export function sow(g, pit) {
  return apply(g, pit, true);
}
export function chooseMove(g, depth = 1, maxNodes = 12000) {
  const root = g.player;
  let nodes = 0;
  const evaluate = (s) => {
    const a = s.board[STORES[root]],
      b = s.board[STORES[1 - root]];
    if (s.status === "over") return (a - b) * 1000;
    return (
      (a - b) * 20 +
      (PITS[root].reduce((sum, i) => sum + s.board[i], 0) -
        PITS[1 - root].reduce((sum, i) => sum + s.board[i], 0)) *
        0.15
    );
  };
  function search(s, d, alpha, beta) {
    nodes++;
    if (d === 0 || s.status === "over" || nodes >= maxNodes) return evaluate(s);
    const max = s.player === root;
    let value = max ? -Infinity : Infinity;
    for (const pit of legalMoves(s)) {
      const score = search(move(s, pit), d - 1, alpha, beta);
      value = max ? Math.max(value, score) : Math.min(value, score);
      if (max) alpha = Math.max(alpha, value);
      else beta = Math.min(beta, value);
      if (beta <= alpha || nodes >= maxNodes) break;
    }
    return value;
  }
  let best = null,
    bestScore = -Infinity;
  for (const pit of legalMoves(g)) {
    if (best !== null && nodes >= maxNodes) break;
    const score = search(
      move(g, pit),
      Math.max(0, Math.min(6, depth) - 1),
      -Infinity,
      Infinity,
    );
    if (score > bestScore) {
      best = pit;
      bestScore = score;
    }
  }
  return best;
}
export function readSave(raw) {
  const base = { version: 1, sound: false, reduced: false, stats: {} };
  let data;
  try {
    data = JSON.parse(raw ?? "null");
  } catch {
    data = null;
  }
  for (const mode of ["casual", "tatico", "dupla"]) {
    const value = data?.version === 1 ? data.stats?.[mode] : null;
    const played =
      Number.isInteger(value?.played) &&
      value.played >= 0 &&
      value.played <= 999999
        ? value.played
        : 0;
    const wins =
      Number.isInteger(value?.wins) && value.wins >= 0 && value.wins <= played
        ? value.wins
        : 0;
    const draws =
      Number.isInteger(value?.draws) &&
      value.draws >= 0 &&
      value.draws <= played - wins
        ? value.draws
        : 0;
    base.stats[mode] = { played, wins, draws };
  }
  return {
    ...base,
    sound: data?.version === 1 && data.sound === true,
    reduced: data?.version === 1 && data.reduced === true,
  };
}
export function record(save, g, mode) {
  if (g.status !== "over" || !["casual", "tatico", "dupla"].includes(mode))
    return save;
  const old = save.stats[mode];
  if (old.played >= 999999) return save;
  return {
    ...save,
    stats: {
      ...save.stats,
      [mode]: {
        played: old.played + 1,
        wins: old.wins + (g.winner === 0 ? 1 : 0),
        draws: old.draws + (g.winner === -1 ? 1 : 0),
      },
    },
  };
}
