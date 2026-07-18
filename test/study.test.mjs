import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { validateStudyPlan } from "../src/commands/study.mjs";
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
