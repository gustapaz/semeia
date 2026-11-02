import test from "node:test";
import assert from "node:assert/strict";
import { SowFlow } from "../src/flow.js";
function fake() {
  let id = 0;
  const tasks = new Map(),
    callbacks = [];
  return {
    tasks,
    callbacks,
    schedule(fn) {
      tasks.set(++id, fn);
      callbacks.push(fn);
      return id;
    },
    clear(id) {
      tasks.delete(id);
    },
    run() {
      let count = 0;
      while (tasks.size) {
        assert(count++ < 100);
        const [id, fn] = tasks.entries().next().value;
        tasks.delete(id);
        fn();
      }
    },
  };
}
test("flow emits each sow stage and completes exactly once", () => {
  const f = fake(),
    flow = new SowFlow(f.schedule, f.clear),
    out = [];
  flow.run(
    [{ at: 1 }, { at: 2 }, { at: 3 }],
    (s) => out.push(s.at),
    () => out.push("done"),
  );
  f.run();
  flow.finish();
  assert.deepEqual(out, [1, 2, 3, "done"]);
});
test("pause keeps cursor, blocks stale callback and resumes remaining seeds", () => {
  const f = fake(),
    flow = new SowFlow(f.schedule, f.clear),
    out = [];
  flow.run(
    [{ at: 1 }, { at: 2 }],
    (s) => out.push(s.at),
    () => out.push("done"),
  );
  flow.pause();
  for (const fn of f.callbacks) fn();
  assert.deepEqual(out, [1]);
  assert.equal(f.tasks.size, 0);
  flow.resume();
  f.run();
  assert.deepEqual(out, [1, 2, "done"]);
});
test("cancel and replacement stop all old callbacks from committing", () => {
  const f = fake(),
    flow = new SowFlow(f.schedule, f.clear),
    out = [];
  flow.run(
    [{ at: 1 }, { at: 2 }],
    (s) => out.push(s.at),
    () => out.push("old"),
  );
  const old = [...f.callbacks];
  flow.cancel();
  flow.run(
    [{ at: 8 }],
    (s) => out.push(s.at),
    () => out.push("new"),
    true,
  );
  for (const fn of old) fn();
  f.run();
  assert.deepEqual(out, [1, 8, "new"]);
});
test("reduced motion emits the same trace without timers", () => {
  const f = fake(),
    flow = new SowFlow(f.schedule, f.clear),
    out = [];
  flow.run(
    [{ at: 1 }, { at: 2 }],
    (s) => out.push(s.at),
    () => out.push("done"),
    true,
  );
  assert.deepEqual(out, [1, 2, "done"]);
  assert.equal(f.tasks.size, 0);
});
