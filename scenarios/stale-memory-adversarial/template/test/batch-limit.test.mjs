import assert from "node:assert/strict";
import test from "node:test";
import { runtimeLimits } from "../config/runtime-limits.mjs";
import { loadBatchLimit } from "../src/scheduler/load-batch-limit.mjs";

test("v2 scheduler consumes the active runtime limit", () => {
  assert.equal(runtimeLimits.maxBatch, 25);
  assert.equal(loadBatchLimit(), runtimeLimits.maxBatch);
});
