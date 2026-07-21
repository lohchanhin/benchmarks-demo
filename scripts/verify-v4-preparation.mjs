import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readJson } from "../src/lib/files.mjs";
import { evaluateV4FreezeGate } from "../src/lib/v4-protocol.mjs";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const protocolRoot = path.join(repositoryRoot, "protocol", "v4");
const [plan, frozenPlan, fixtureManifest, reviewReceipt, executionManifest, cliSource] = await Promise.all([
  readJson(path.join(protocolRoot, "plan.draft.json")),
  readJson(path.join(protocolRoot, "plan.frozen.json")),
  readJson(path.join(protocolRoot, "fixtures.candidates.json")),
  readJson(path.join(protocolRoot, "review.receipt.json")),
  readJson(path.join(protocolRoot, "execution.empty.json")),
  readFile(path.join(repositoryRoot, "src", "cli.mjs"), "utf8")
]);

const report = evaluateV4FreezeGate({ plan, fixtureManifest, reviewReceipt, executionManifest });
assert.equal(report.passed, false);
assert.equal(report.executionAllowed, false);
assert.equal(report.summary.failed, 0);
assert.deepEqual(
  report.checks.filter((check) => check.status === "blocked").map((check) => check.id),
  [
    "private-oracle",
    "private-oracle-commitment",
    "blinding-key",
    "blinding-key-commitment"
  ]
);
assert.match(plan.oracle.commitment, /^[a-f0-9]{64}$/);
assert.match(plan.blinding.keyCommitment, /^[a-f0-9]{64}$/);
assert.equal(plan.execution.formalAgentTrialsRun, 0);
assert.equal(plan.execution.runnerAvailable, false);
assert.equal(frozenPlan.frozen, true);
assert.equal(frozenPlan.humanReviewApproved, true);
assert.equal(frozenPlan.executionAllowed, true);
assert.equal(frozenPlan.statistics.frozenBeforeExecution, true);
assert.equal(frozenPlan.execution.formalAgentTrialsRun, 0);
assert.equal(frozenPlan.execution.runnerAvailable, false);
assert.equal(frozenPlan.freezeAudit.passed, true);
assert.equal(reviewReceipt.approved, true);
assert.equal(reviewReceipt.authorization.independentThirdPartyReview, false);
assert.equal(executionManifest.trials.length, 0);
assert.equal(cliSource.includes('case "v4-run"'), false);

console.log(
  `PASS v4 preparation: human review and frozen plan are public; `
    + `${report.summary.blocked} evaluator-secret checks remain unverifiable in a public clone; `
    + "0 formal trials; the study plan remains pre-runner and execution is governed by a separate amendment"
);
