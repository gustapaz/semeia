export class SowFlow {
  constructor(
    schedule = globalThis.setTimeout.bind(globalThis),
    clear = globalThis.clearTimeout.bind(globalThis),
  ) {
    this.schedule = schedule;
    this.clear = clear;
    this.timer = null;
    this.epoch = 0;
    this.cursor = 0;
    this.steps = [];
    this.paused = false;
  }
  run(steps, onStep, onDone, fast = false) {
    this.cancel();
    this.steps = steps;
    this.onStep = onStep;
    this.onDone = onDone;
    this.cursor = 0;
    if (fast) this.finish();
    else this.tick();
  }
  tick() {
    if (this.paused) return;
    if (this.cursor >= this.steps.length) {
      this.timer = null;
      const done = this.onDone;
      this.onDone = null;
      done?.();
      return;
    }
    const step = this.steps[this.cursor++];
    this.onStep?.(step);
    const token = this.epoch;
    this.timer = this.schedule(
      () => {
        if (token === this.epoch) this.tick();
      },
      step.kind === "capture" || step.kind === "sweep" ? 210 : 105,
    );
  }
  pause() {
    this.paused = true;
    this.clear(this.timer);
    this.timer = null;
    this.epoch++;
  }
  resume() {
    if (!this.paused) return;
    this.paused = false;
    this.tick();
  }
  finish() {
    this.clear(this.timer);
    this.timer = null;
    this.epoch++;
    this.paused = false;
    while (this.cursor < this.steps.length)
      this.onStep?.(this.steps[this.cursor++]);
    const done = this.onDone;
    this.onDone = null;
    done?.();
  }
  cancel() {
    this.clear(this.timer);
    this.timer = null;
    this.epoch++;
    this.cursor = 0;
    this.steps = [];
    this.onDone = null;
    this.onStep = null;
    this.paused = false;
  }
}
