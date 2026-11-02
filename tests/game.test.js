import test from "node:test";
import assert from "node:assert/strict";
import {
  PITS,
  STORES,
  createGame,
  legalMoves,
  move,
  sow,
  chooseMove,
  readSave,
  record,
} from "../src/game.js";
const total = (b) => b.reduce((a, v) => a + v, 0);
test("initial board has 48 seeds and six legal houses for each starting player", () => {
  for (const p of [0, 1]) {
    const g = createGame(p);
    assert.equal(total(g.board), 48);
    assert.equal(g.player, p);
    assert.deepEqual(legalMoves(g), PITS[p]);
    assert.equal(g.board[STORES[p]], 0);
  }
});
test("sowing is immutable and distributes one seed per next slot", () => {
  const g = createGame(),
    n = move(g, 0);
  assert.equal(g.board[0], 4);
  assert.deepEqual(n.board.slice(0, 6), [0, 5, 5, 5, 5, 4]);
  assert.equal(n.player, 1);
  assert.equal(n.moves, 1);
  assert.equal(total(n.board), 48);
});
test("landing in own store gives an extra turn", () => {
  const result = sow(createGame(), 2);
  assert.equal(result.state.player, 0);
  assert.equal(result.state.board[6], 1);
  assert.equal(result.summary.extra, true);
});
test("opponent store is skipped even over a full lap", () => {
  const g = {
    ...createGame(),
    board: [14, 0, 0, 0, 0, 1, 0, 1, 1, 1, 1, 1, 1, 0],
  };
  const n = move(g, 0);
  assert.equal(n.board[13], 0);
  assert.equal(n.board[6], 1);
  assert.equal(total(n.board), total(g.board));
  assert.equal(n.board[1], 2);
});
test("player one also skips the rival store and uses the opposite direction", () => {
  const g = {
    ...createGame(1),
    board: [1, 1, 1, 1, 1, 1, 0, 14, 0, 0, 0, 0, 1, 0],
  };
  const n = move(g, 7);
  assert.equal(n.board[6], 0);
  assert.equal(n.board[13], 1);
  assert.equal(total(n.board), total(g.board));
});
test("empty own final house captures opposite plus the last seed", () => {
  const g = {
    ...createGame(),
    board: [1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 5, 1, 0],
  };
  const r = sow(g, 0);
  assert.equal(r.summary.captured, 6);
  assert.equal(r.state.board[1], 0);
  assert.equal(r.state.board[11], 0);
  assert.equal(r.state.board[6], 6);
});
test("an empty opposite house does not trigger capture", () => {
  const g = {
    ...createGame(),
    board: [1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 0],
  };
  const r = sow(g, 0);
  assert.equal(r.summary.captured, 0);
  assert.equal(r.state.board[1], 1);
});
test("landing on opponent side never captures", () => {
  const g = {
    ...createGame(),
    board: [1, 1, 1, 1, 1, 4, 0, 0, 0, 0, 5, 1, 1, 0],
  };
  const r = sow(g, 5);
  assert.equal(r.summary.captured, 0);
  assert.equal(r.state.board[9], 1);
});
test("empty side sweeps leftovers, winner finalizes and further moves are inert", () => {
  const g = {
    ...createGame(),
    board: [0, 0, 0, 0, 0, 1, 20, 2, 3, 4, 5, 6, 7, 0],
  };
  const n = move(g, 5);
  assert.equal(n.status, "over");
  assert.equal(n.board[6], 21);
  assert.equal(n.board[13], 27);
  assert.equal(n.winner, 1);
  assert(legalMoves(n).length === 0);
  assert.strictEqual(move(n, 7), n);
  assert(PITS.flat().every((i) => n.board[i] === 0));
});
test("draw result and defensive 200-move bound are explicit", () => {
  const draw = {
    ...createGame(),
    board: [0, 0, 0, 0, 0, 1, 23, 0, 0, 0, 0, 0, 1, 23],
  };
  assert.equal(move(draw, 5).winner, -1);
  const bound = move({ ...createGame(), moves: 199 }, 0);
  assert.equal(bound.status, "over");
  assert.equal(bound.reason, "limit");
  assert.equal(total(bound.board), 48);
});
test("illegal houses and empty houses cannot spend a move", () => {
  const g = createGame();
  for (const pit of [-1, 6, 7, 13, 99, 1.5, NaN])
    assert.strictEqual(move(g, pit), g);
  const n = move(g, 0);
  assert.strictEqual(move({ ...n, player: 0 }, 0).moves, n.moves);
});
test("visual trace finishes in exact model state and tracks seeds held in hand", () => {
  const g = createGame(),
    r = sow(g, 2);
  assert.equal(r.steps[0].kind, "lift");
  assert.equal(total(r.steps[0].board), 44);
  assert.deepEqual(r.steps.at(-1).board, r.state.board);
  for (const step of r.steps)
    assert(total(step.board) >= 44 && total(step.board) <= 48);
});
test("AI returns legal deterministic moves without mutating the board", () => {
  for (const p of [0, 1])
    for (const depth of [1, 5]) {
      const g = createGame(p),
        before = structuredClone(g);
      const a = chooseMove(g, depth);
      assert(legalMoves(g).includes(a));
      assert.equal(chooseMove(g, depth), a);
      assert.deepEqual(g, before);
    }
});
test("complete deterministic matches conserve all seeds and reach results at both levels", () => {
  for (const d of [1, 5]) {
    let g = createGame();
    while (g.status === "playing") {
      g = move(g, chooseMove(g, g.player === 0 ? 6 : d));
      assert.equal(total(g.board), 48);
      assert(g.board.every((n) => Number.isInteger(n) && n >= 0));
      assert(g.moves <= 200);
    }
    assert.equal(g.winner, 0);
    assert.equal(g.board[6], d === 1 ? 41 : 33);
    assert.equal(g.board[13], d === 1 ? 7 : 15);
  }
});
test("new game has independent positions and starting side resets", () => {
  const a = createGame(),
    b = createGame(1);
  a.board[0] = 99;
  assert.equal(b.board[0], 4);
  assert.equal(b.player, 1);
  assert.equal(b.moves, 0);
});
test("save schema rejects corrupt data and inconsistent counts", () => {
  for (const raw of [null, "bad", "null", "{}", '{"version":8}'])
    assert.equal(readSave(raw).stats.casual.played, 0);
  const s = readSave(
    '{"version":1,"sound":"true","reduced":true,"stats":{"casual":{"played":3,"wins":8,"draws":9},"tatico":{"played":-1}}}',
  );
  assert.equal(s.sound, false);
  assert.equal(s.reduced, true);
  assert.deepEqual(s.stats.casual, { played: 3, wins: 0, draws: 0 });
  assert.equal(s.stats.tatico.played, 0);
});
test("recording finished matches separates modes and preserves original save", () => {
  const s = readSave(null),
    g = { ...createGame(), status: "over", winner: 0 };
  assert.strictEqual(record(s, createGame(), "casual"), s);
  const n = record(s, g, "casual");
  assert.equal(n.stats.casual.wins, 1);
  assert.equal(n.stats.casual.played, 1);
  assert.equal(n.stats.tatico.played, 0);
  assert.equal(s.stats.casual.played, 0);
  assert.equal(record(n, { ...g, winner: -1 }, "dupla").stats.dupla.draws, 1);
});
