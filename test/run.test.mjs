import assert from "node:assert/strict";
import test from "node:test";
import { orderedArms } from "../src/commands/run.mjs";
import { ADAPTIVE_ARMS } from "../src/lib/run-state.mjs";

test("runs three arms sequentially in explicit or seeded order", () => {
  assert.deepEqual(orderedArms("both", "control-first"), ["control", "full-palace"]);
  assert.deepEqual(orderedArms("both", "palace-first"), ["full-palace", "control"]);
  assert.deepEqual(orderedArms("control", "palace-first"), ["control"]);
  assert.deepEqual(
    orderedArms("all", "control,route-only,full-palace"),
    ["control", "route-only", "full-palace"]
  );
  assert.deepEqual(orderedArms("all", "seeded", "same-seed"), orderedArms("all", "seeded", "same-seed"));
  assert.deepEqual(new Set(orderedArms("all", "seeded", "same-seed")), new Set([
    "control",
    "route-only",
    "full-palace"
  ]));
});

test("runs four adaptive-study arms in an explicit Williams order", () => {
  const order = "control,route-only,adaptive-palace,full-palace";
  assert.deepEqual(
    orderedArms("all", order, "same-seed", ADAPTIVE_ARMS),
    ["control", "route-only", "adaptive-palace", "full-palace"]
  );
  assert.deepEqual(new Set(orderedArms("all", "seeded", "same-seed", ADAPTIVE_ARMS)), new Set(ADAPTIVE_ARMS));
  assert.deepEqual(orderedArms("adaptive", "seeded", "same-seed", ADAPTIVE_ARMS), ["adaptive-palace"]);
});
