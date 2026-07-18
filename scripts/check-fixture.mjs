import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { runProcess } from "../src/lib/process.mjs";
import {
  applyCanonicalRepair,
  loadScenario,
  materializeScenario,
  pilotScenarioIds,
  runScenarioOracle
} from "../src/lib/scenario.mjs";

for (const scenarioId of pilotScenarioIds) {
  const root = await mkdtemp(path.join(os.tmpdir(), `vertex-palace-${scenarioId}-`));
  try {
    const scenario = await loadScenario(scenarioId);
    const files = await materializeScenario(scenario, root, { seed: "fixture-check-seed" });
    const baseline = await runProcess(scenario.testCommand[0], scenario.testCommand.slice(1), { cwd: root });
    const baselineOracle = await runScenarioOracle(scenario, root);
    if (baseline.exitCode === 0 || baselineOracle?.exitCode === 0) {
      throw new Error(`${scenarioId} baseline should fail public tests and hidden oracle`);
    }

    const repair = await applyCanonicalRepair(scenario, root);
    if (repair.exitCode !== 0) throw new Error(`${scenarioId} canonical repair command failed: ${repair.stderr}`);
    const fixed = await runProcess(scenario.testCommand[0], scenario.testCommand.slice(1), { cwd: root });
    const fixedOracle = await runScenarioOracle(scenario, root);
    if (fixed.exitCode !== 0 || fixedOracle?.exitCode !== 0) {
      throw new Error(
        `${scenarioId} canonical repair should pass:\n${fixed.stdout}\n${fixed.stderr}\n${fixedOracle?.stderr ?? ""}`
      );
    }
    console.log(`${scenarioId}: ${files.length} files, failing baseline, passing scoped repair and oracle.`);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}
