// Local browser harness only; excluded from production export.
localStorage.setItem("semeia.save.v1", "corrupt-test-save");
await import("../src/main.js");
const $ = (s) => document.querySelector(s),
  checks = [];
const delay = (ms) => new Promise((r) => setTimeout(r, ms));
function assert(ok, name) {
  if (!ok) throw new Error(name);
  checks.push(name);
}
async function waitFor(fn, ms = 5000) {
  const start = performance.now();
  while (!fn()) {
    if (performance.now() - start > ms)
      throw new Error("Browser wait timed out");
    await delay(20);
  }
}
try {
  assert(
    $("#score-0").textContent === "0" && $("#score-1").textContent === "0",
    "corrupt save recovers",
  );
  $("#pit-2").click();
  await delay(120);
  window.dispatchEvent(new Event("blur"));
  assert($("dialog").open, "blur pauses sowing");
  const pausedBoard = $("#board").textContent;
  await delay(1200);
  assert(
    $("#board").textContent === pausedBoard,
    "paused seeds and CPU do not advance",
  );
  $("#close").click();
  await waitFor(() => !$("#pit-0").disabled);
  assert(
    $("#score-0").textContent === "1" && $("#score-1").textContent === "0",
    "resume completes sowing and own store grants extra turn",
  );
  $("#motion").click();
  $("#restart").click();
  for (const house of [6, 3, 6, 2, 6, 1, 1, 1]) {
    await waitFor(() => !$("#pit-" + (house - 1)).disabled);
    $("#pit-" + (house - 1)).click();
    await delay(30);
  }
  await waitFor(() => $("#state-title").textContent === "Você colheu mais.");
  assert(
    $("#score-0").textContent === "41" && $("#score-1").textContent === "7",
    "real local opponent match reaches correct result",
  );
  assert(
    $(".local").textContent.includes("1 partida"),
    "completed match recorded once",
  );
  $("#pit-0").dispatchEvent(new MouseEvent("click", { bubbles: true }));
  await delay(50);
  assert(
    $(".local").textContent.includes("1 partida"),
    "ended input cannot record twice",
  );
  $("#restart").click();
  const mode = $("#mode");
  mode.value = "dupla";
  mode.dispatchEvent(new Event("change", { bubbles: true }));
  await delay(30);
  $("#board").dispatchEvent(
    new KeyboardEvent("keydown", { key: "3", bubbles: true }),
  );
  await delay(30);
  assert($("#score-0").textContent === "1", "numeric keyboard selects a house");
  $("#restart").click();
  $("#motion").click();
  $("#pit-0").click();
  await delay(50);
  $("#restart").click();
  await delay(2000);
  assert(
    $("#score-0").textContent === "0" &&
      $("#score-1").textContent === "0" &&
      $("#pit-0").getAttribute("aria-label").includes("4 sementes"),
    "restart cancels old sowing and CPU callbacks",
  );
  $("#checks").textContent = `PASS ${checks.length}: ${checks.join(" / ")}`;
} catch (error) {
  $("#checks").textContent = `FAIL: ${error.message}`;
}
