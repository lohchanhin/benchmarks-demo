import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { loadScenario, materializeScenario, pilotScenarioIds } from "../src/lib/scenario.mjs";

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

test("fixture seeds change noise bytes without changing scenario file identity", async (context) => {
  const first = await mkdtemp(path.join(os.tmpdir(), "benchmark-seed-a-"));
  const second = await mkdtemp(path.join(os.tmpdir(), "benchmark-seed-b-"));
  context.after(async () => Promise.all([
    rm(first, { recursive: true, force: true }),
    rm(second, { recursive: true, force: true })
  ]));
  const scenario = await loadScenario("cross-stack-regression");
  const firstFiles = await materializeScenario(scenario, first, { seed: "seed-a" });
  const secondFiles = await materializeScenario(scenario, second, { seed: "seed-b" });
  assert.deepEqual(firstFiles, secondFiles);
  const relative = path.join("packages", "catalog", "src", "module-001.mjs");
  assert.notEqual(
    await readFile(path.join(first, relative), "utf8"),
    await readFile(path.join(second, relative), "utf8")
  );
});

test("all preregistered pilot scenario contracts load", async () => {
  for (const id of pilotScenarioIds) {
    const scenario = await loadScenario(id);
    assert.equal(scenario.id, id);
    assert.ok(scenario.oracleCommand.length > 0);
    assert.ok(scenario.repairCommand.length > 0);
  }
});
