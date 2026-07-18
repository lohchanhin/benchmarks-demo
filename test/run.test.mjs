import assert from "node:assert/strict";
import test from "node:test";
import { orderedArms } from "../src/commands/run.mjs";

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
