import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { loadScenario, materializeScenario } from "../src/lib/scenario.mjs";

test("materializes a deterministic noisy fixture", async (context) => {
  const first = await mkdtemp(path.join(os.tmpdir(), "benchmark-scenario-a-"));
  const second = await mkdtemp(path.join(os.tmpdir(), "benchmark-scenario-b-"));
  context.after(async () => Promise.all([
    rm(first, { recursive: true, force: true }),
    rm(second, { recursive: true, force: true })
  ]));

  const scenario = await loadScenario();
  const firstFiles = await materializeScenario(scenario, first);
  const secondFiles = await materializeScenario(scenario, second);
  assert.deepEqual(firstFiles, secondFiles);
  assert.equal(firstFiles.length, 240);
  assert.ok(firstFiles.includes("clients/aurora/theme.mjs"));
  assert.ok(firstFiles.includes("packages/payments/src/module-024.mjs"));
});
