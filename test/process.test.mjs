import assert from "node:assert/strict";
import test from "node:test";
import { runProcess } from "../src/lib/process.mjs";
import { startSystemAwake } from "../src/lib/system-awake.mjs";

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

test("acquires and releases the Windows unattended-run sleep guard", { skip: process.platform !== "win32" }, async () => {
  const awake = await startSystemAwake();
  assert.equal(awake.active, true);
  assert.equal(awake.method, "windows-set-thread-execution-state-system-required");
  assert.equal(awake.displayRequired, false);
  const stopped = await awake.stop();
  assert.equal(stopped.stopped, true);
  assert.equal(stopped.exitCode, 0);
  assert.equal(stopped.stderr, "");
});
