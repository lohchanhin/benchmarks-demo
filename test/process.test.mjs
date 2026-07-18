import assert from "node:assert/strict";
import test from "node:test";
import { runProcess } from "../src/lib/process.mjs";

test("marks and terminates a process that exceeds its time budget", async () => {
  const result = await runProcess(
    process.execPath,
    ["-e", "setTimeout(() => {}, 5000)"],
    { timeoutMs: 100 }
  );
  assert.equal(result.timedOut, true);
  assert.notEqual(result.exitCode, 0);
  assert.ok(result.durationMs < 3000);
});
