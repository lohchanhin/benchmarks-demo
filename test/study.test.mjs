import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  adaptiveWilliamsOrders,
  buildAdaptivePilotPlan,
  studyCommand,
  validateStudyPlan
} from "../src/commands/study.mjs";
import { repositoryRoot } from "../src/lib/root.mjs";

test("committed pilot plan has five paired seeds and distinct orders per scenario", async () => {
  const plan = JSON.parse(await readFile(`${repositoryRoot}/results/pilot/plan.json`, "utf8"));
  assert.equal(validateStudyPlan(plan), true);
  assert.equal(plan.frozen, true);
  assert.equal(plan.trials.length, 20);

  for (const scenario of [
    "small-local-bug",
    "cross-stack-regression",
    "tenant-memory-pitfall",
    "stale-memory-adversarial"
  ]) {
    const trials = plan.trials.filter((trial) => trial.scenario === scenario);
    assert.equal(trials.length, 5);
    assert.equal(new Set(trials.map((trial) => trial.seed)).size, 5);
    assert.equal(new Set(trials.map((trial) => trial.order.join(","))).size, 5);
  }
});

test("adaptive pilot balances four arms, positions, and Palace index state", () => {
  const plan = buildAdaptivePilotPlan({ codexVersion: "codex-cli test" });
  plan.frozen = true;
  assert.equal(validateStudyPlan(plan), true);
  assert.equal(plan.protocolVersion, "2.2.0");
  assert.equal(plan.execution.palaceVersion, "0.2.1");
  assert.equal(plan.execution.platform, "win32");
  assert.equal(plan.execution.sandboxProfile, "workspace-write/windows-elevated");
  assert.equal(plan.execution.lastMessageTransport, "workspace-local-then-artifacts-v1");
  assert.equal(plan.trials.length, 16);

  for (const scenario of [
    "small-local-bug",
    "cross-stack-regression",
    "tenant-memory-pitfall",
    "stale-memory-adversarial"
  ]) {
    const trials = plan.trials.filter((trial) => trial.scenario === scenario);
    assert.equal(trials.length, 4);
    assert.equal(new Set(trials.map((trial) => trial.order.join(","))).size, adaptiveWilliamsOrders.length);
    assert.equal(trials.filter((trial) => trial.cacheState === "warm").length, 2);
    assert.equal(trials.filter((trial) => trial.cacheState === "cold").length, 2);
    for (let position = 0; position < 4; position += 1) {
      assert.equal(new Set(trials.map((trial) => trial.order[position])).size, 4);
    }
  }

  for (const order of adaptiveWilliamsOrders) {
    const matching = plan.trials.filter((trial) => trial.order.join(",") === order.join(","));
    assert.equal(matching.filter((trial) => trial.cacheState === "warm").length, 2);
    assert.equal(matching.filter((trial) => trial.cacheState === "cold").length, 2);
  }
});

test("committed adaptive pilot plan validates against protocol v2", async () => {
  const plan = JSON.parse(await readFile(`${repositoryRoot}/results/adaptive-pilot/plan.json`, "utf8"));
  assert.equal(validateStudyPlan(plan), true);
  assert.equal(plan.frozen, true);
  assert.equal(plan.trials.length, 16);
});

test("committed successor plan uses fresh v2.1 ids and seeds", async () => {
  const [v2, successor] = await Promise.all([
    readFile(`${repositoryRoot}/results/adaptive-pilot/plan.json`, "utf8").then(JSON.parse),
    readFile(`${repositoryRoot}/results/adaptive-pilot-v2.1/plan.json`, "utf8").then(JSON.parse)
  ]);

  assert.equal(validateStudyPlan(successor), true);
  assert.equal(successor.protocolVersion, "2.1.0");
  assert.equal(successor.execution.palaceVersion, "0.2.1");
  assert.equal(successor.trials.length, 16);
  assert.equal(
    successor.trials.every((trial) => trial.trialId.includes("-adaptive-v2-1-pilot-")),
    true
  );
  const oldSeeds = new Set(v2.trials.map((trial) => trial.seed));
  assert.equal(successor.trials.some((trial) => oldSeeds.has(trial.seed)), false);
});

test("refuses to execute a retired adaptive protocol", async () => {
  await assert.rejects(
    studyCommand(new Map([
      ["plan", `${repositoryRoot}/results/adaptive-pilot-v2.1/plan.json`],
      ["execute", true]
    ])),
    /Protocol 2\.1\.0 is retired/
  );
});

test("committed v2.2 plan freezes the corrected harness with fresh ids and seeds", async () => {
  const [v2, v21, successor] = await Promise.all([
    readFile(`${repositoryRoot}/results/adaptive-pilot/plan.json`, "utf8").then(JSON.parse),
    readFile(`${repositoryRoot}/results/adaptive-pilot-v2.1/plan.json`, "utf8").then(JSON.parse),
    readFile(`${repositoryRoot}/results/adaptive-pilot-v2.2/plan.json`, "utf8").then(JSON.parse)
  ]);

  assert.equal(validateStudyPlan(successor), true);
  assert.equal(successor.protocolVersion, "2.2.0");
  assert.equal(successor.execution.platform, "win32");
  assert.equal(successor.execution.sandboxProfile, "workspace-write/windows-elevated");
  assert.equal(successor.execution.lastMessageTransport, "workspace-local-then-artifacts-v1");
  assert.equal(successor.trials.length, 16);
  assert.equal(
    successor.trials.every((trial) => trial.trialId.includes("-adaptive-v2-2-pilot-")),
    true
  );
  const oldSeeds = new Set([...v2.trials, ...v21.trials].map((trial) => trial.seed));
  assert.equal(successor.trials.some((trial) => oldSeeds.has(trial.seed)), false);
});
