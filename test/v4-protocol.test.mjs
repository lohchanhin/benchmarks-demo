import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  V4_HIERARCHICAL_WIN,
  V4_PROTOCOL_TAG,
  V4_PROTOCOL_VERSION,
  assertV4ExecutionAllowed,
  buildV4DraftPlan,
  buildV4ReviewReceipt,
  commitV4BlindingKey,
  commitV4PrivateOracle,
  evaluateV4FreezeGate,
  freezeV4Plan,
  sha256Canonical,
  validateV4FixtureManifest
} from "../src/lib/v4-protocol.mjs";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixturesPath = path.join(repositoryRoot, "protocol", "v4", "fixtures.candidates.json");

test("committed v4 candidates cover four real task profiles and TypeScript plus Python", async () => {
  const fixtures = JSON.parse(await readFile(fixturesPath, "utf8"));
  const validated = validateV4FixtureManifest(fixtures);

  assert.equal(validated.fixtures.length, 4);
  assert.deepEqual(
    new Set(validated.fixtures.map((fixture) => fixture.taskType)),
    new Set(["simple-local", "cross-stack", "decision-memory-dependent", "stale-memory"])
  );
  assert.deepEqual(
    new Set(validated.fixtures.flatMap((fixture) => fixture.languages)),
    new Set(["TypeScript", "Python"])
  );
  for (const fixture of validated.fixtures) {
    assert.match(fixture.repository.url, /^https:\/\/github\.com\//);
    assert.match(fixture.repository.frozenCommit, /^[a-f0-9]{40}$/);
    assert.match(fixture.issue.url, /^https:\/\/github\.com\//);
    assert.ok(fixture.verification.commands.length > 0);
  }
});

test("committed v4 review and frozen plan remain outcome-free with no runner", async () => {
  const [plan, frozenPlan, fixtureManifestValue, reviewReceipt, executionManifest] = await Promise.all([
    readJson("protocol/v4/plan.draft.json"),
    readJson("protocol/v4/plan.frozen.json"),
    readJson("protocol/v4/fixtures.candidates.json"),
    readJson("protocol/v4/review.receipt.json"),
    readJson("protocol/v4/execution.empty.json")
  ]);
  const publicGate = evaluateV4FreezeGate({
    plan,
    fixtureManifest: fixtureManifestValue,
    reviewReceipt,
    executionManifest
  });

  assert.equal(publicGate.summary.failed, 0);
  assert.equal(publicGate.checks.find((check) => check.id === "human-review")?.status, "passed");
  assert.equal(frozenPlan.frozen, true);
  assert.equal(frozenPlan.humanReviewApproved, true);
  assert.equal(frozenPlan.executionAllowed, true);
  assert.equal(frozenPlan.statistics.frozenBeforeExecution, true);
  assert.equal(frozenPlan.execution.formalAgentTrialsRun, 0);
  assert.equal(frozenPlan.execution.runnerAvailable, false);
  assert.equal(frozenPlan.review.receiptSha256, sha256Canonical(reviewReceipt));
  assert.equal(executionManifest.trials.length, 0);
  assert.equal(JSON.stringify(frozenPlan).includes("exactChangedFiles"), false);
});

test("v4 plan generation is deterministic, balanced, preregistered, and outcome-free", () => {
  const fixtures = fixtureManifest();
  const options = {
    fixtureManifest: fixtures,
    seed: "v4-test-seed",
    generatedAt: "2026-07-21T00:00:00.000Z",
    privateOracleCommitment: "a".repeat(64),
    blindingKeyCommitment: "b".repeat(64)
  };

  const first = buildV4DraftPlan(options);
  const second = buildV4DraftPlan(options);

  assert.deepEqual(first, second);
  assert.equal(first.protocolVersion, V4_PROTOCOL_VERSION);
  assert.equal(first.protocolTag, V4_PROTOCOL_TAG);
  assert.equal(first.frozen, false);
  assert.equal(first.humanReviewApproved, false);
  assert.equal(first.executionAllowed, false);
  assert.equal(first.statistics.frozenBeforeExecution, false);
  assert.equal(first.trials.length, 16);
  assert.equal(first.trials.every((trial) => trial.blindedOrder.length === 2), true);
  assert.equal(first.trials.every((trial) => !Object.hasOwn(trial, "outcome")), true);
  assert.deepEqual(first.statistics.hierarchicalWin, V4_HIERARCHICAL_WIN);
  assert.deepEqual(first.comparison.primary, ["adaptive-palace", "control"]);
  assert.equal(JSON.stringify(first).includes("expected/file.ts"), false);

  for (const fixture of fixtures.fixtures) {
    const orders = first.trials
      .filter((trial) => trial.fixtureId === fixture.id)
      .map((trial) => trial.blindedOrder.join(","));
    assert.equal(orders.filter((order) => order === "arm-a,arm-b").length, 2);
    assert.equal(orders.filter((order) => order === "arm-b,arm-a").length, 2);
  }
});

test("private oracle and arm key commitments are stable without revealing hidden scope", () => {
  const oracle = privateOracle();
  const oracleCommitment = commitV4PrivateOracle(oracle);
  const keyCommitment = commitV4BlindingKey("11".repeat(32));
  const plan = buildV4DraftPlan({
    fixtureManifest: fixtureManifest(),
    seed: "v4-private-test",
    generatedAt: "2026-07-21T00:00:00.000Z",
    privateOracleCommitment: oracleCommitment,
    blindingKeyCommitment: keyCommitment
  });

  assert.match(oracleCommitment, /^[a-f0-9]{64}$/);
  assert.match(keyCommitment, /^[a-f0-9]{64}$/);
  assert.equal(commitV4PrivateOracle(structuredClone(oracle)), oracleCommitment);
  assert.equal(JSON.stringify(plan).includes("expected/file.ts"), false);
  assert.equal(JSON.stringify(plan).includes("forbidden/secret.ts"), false);
});

test("draft remains blocked and formal execution is refused before human review", () => {
  const plan = candidatePlan();
  const gate = evaluateV4FreezeGate({
    plan,
    fixtureManifest: fixtureManifest(),
    executionManifest: { protocolVersion: V4_PROTOCOL_VERSION, trials: [] }
  });

  assert.equal(gate.passed, false);
  assert.equal(gate.executionAllowed, false);
  assert.equal(gate.checks.find((check) => check.id === "private-oracle")?.status, "blocked");
  assert.equal(gate.checks.find((check) => check.id === "human-review")?.status, "blocked");
  assert.throws(() => assertV4ExecutionAllowed(plan, gate), /human-reviewed and frozen/);
});

test("freeze gate rejects mismatched commitments and any prior formal trial", () => {
  const fixtureManifestValue = fixtureManifest();
  const plan = candidatePlan();
  const reviewReceipt = approvedReviewReceipt(plan, fixtureManifestValue);
  const oracle = privateOracle();

  const mismatched = evaluateV4FreezeGate({
    plan,
    fixtureManifest: fixtureManifestValue,
    privateOracle: { ...oracle, fixtures: [...oracle.fixtures].reverse() },
    blindingKey: "11".repeat(32),
    reviewReceipt,
    executionManifest: { protocolVersion: V4_PROTOCOL_VERSION, trials: [{ id: "already-ran" }] }
  });

  assert.equal(mismatched.passed, false);
  assert.deepEqual(
    mismatched.checks.filter((check) => check.status !== "passed").map((check) => check.id),
    ["private-oracle-commitment", "formal-trials-empty"]
  );
});

test("only an approved matching review can freeze statistics and enable future execution", () => {
  const fixtureManifestValue = fixtureManifest();
  const plan = candidatePlan();
  const privateOracleValue = privateOracle();
  const reviewReceipt = approvedReviewReceipt(plan, fixtureManifestValue);
  const executionManifest = { protocolVersion: V4_PROTOCOL_VERSION, trials: [] };

  const gate = evaluateV4FreezeGate({
    plan,
    fixtureManifest: fixtureManifestValue,
    privateOracle: privateOracleValue,
    blindingKey: "11".repeat(32),
    reviewReceipt,
    executionManifest
  });
  assert.equal(gate.passed, true);

  const frozen = freezeV4Plan({
    plan,
    fixtureManifest: fixtureManifestValue,
    privateOracle: privateOracleValue,
    blindingKey: "11".repeat(32),
    reviewReceipt,
    executionManifest,
    frozenAt: "2026-07-22T00:00:00.000Z"
  });
  assert.equal(frozen.frozen, true);
  assert.equal(frozen.humanReviewApproved, true);
  assert.equal(frozen.executionAllowed, true);
  assert.equal(frozen.statistics.frozenBeforeExecution, true);
  assert.doesNotThrow(() => assertV4ExecutionAllowed(frozen, { ...gate, passed: true }));
});

function candidatePlan() {
  return buildV4DraftPlan({
    fixtureManifest: fixtureManifest(),
    seed: "v4-candidate-test",
    generatedAt: "2026-07-21T00:00:00.000Z",
    privateOracleCommitment: commitV4PrivateOracle(privateOracle()),
    blindingKeyCommitment: commitV4BlindingKey("11".repeat(32))
  });
}

function approvedReviewReceipt(plan, fixtures) {
  return buildV4ReviewReceipt({
    plan,
    fixtureManifest: fixtures,
    reviewer: "Independent protocol reviewer",
    reviewedAt: "2026-07-21T12:00:00.000Z",
    approved: true
  });
}

function fixtureManifest() {
  return {
    schemaVersion: 1,
    protocolVersion: V4_PROTOCOL_VERSION,
    fixtures: [
      fixture("ts-local", "simple-local", ["TypeScript"]),
      fixture("cross-stack", "cross-stack", ["Python", "TypeScript"]),
      fixture("decision", "decision-memory-dependent", ["TypeScript"], true),
      fixture("stale", "stale-memory", ["Python"], true)
    ]
  };
}

function fixture(id, taskType, languages, needsHistory = false) {
  return {
    id,
    taskType,
    languages,
    repository: {
      url: "https://github.com/example/repository",
      frozenCommit: id.padEnd(40, "0").replace(/[^a-f0-9]/g, "a").slice(0, 40)
    },
    issue: {
      url: `https://github.com/example/repository/issues/${id.length}`,
      title: `${taskType} fixture`
    },
    prompt: `Resolve the ${taskType} task at the frozen commit.`,
    verification: { commands: ["npm test"] },
    historySources: needsHistory
      ? [{ kind: "issue-discussion", url: "https://github.com/example/repository/issues/1" }]
      : []
  };
}

function privateOracle() {
  return {
    schemaVersion: 1,
    protocolVersion: V4_PROTOCOL_VERSION,
    fixtures: fixtureManifest().fixtures.map((fixture) => ({
      fixtureId: fixture.id,
      referenceResolution: {
        url: "https://github.com/example/repository/commit/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        commit: "a".repeat(40)
      },
      correctnessCriteria: ["The focused regression is fixed."],
      exactChangedFiles: ["expected/file.ts"],
      forbiddenFiles: ["forbidden/secret.ts"],
      expectedChangePolicy: "exact-files"
    }))
  };
}

async function readJson(relativePath) {
  return JSON.parse(await readFile(path.join(repositoryRoot, relativePath), "utf8"));
}
