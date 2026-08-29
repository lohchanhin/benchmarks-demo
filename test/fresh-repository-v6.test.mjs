import assert from "node:assert/strict";
import test from "node:test";
import {
  analyzeFreshRepositoryV6,
  balancedOrder,
  publicProductMetadata,
  summarizeV6Runs
} from "../scripts/run-fresh-repository-v6.mjs";

test("V6 balances candidate and baseline order", () => {
  assert.deepEqual(balancedOrder(1), ["candidate", "baseline-0.4.0"]);
  assert.deepEqual(balancedOrder(2), ["baseline-0.4.0", "candidate"]);
});

test("V6 does not turn failed context output into zero-valued route metrics", () => {
  const summary = summarizeV6Runs([
    failedObservation(80_000),
    failedObservation(100_000)
  ]);

  assert.equal(summary.successfulRuns, 0);
  assert.equal(summary.coreCoverage, null);
  assert.equal(summary.routeFocus, null);
  assert.equal(summary.contextTokens, null);
  assert.equal(summary.contextMs, 90_000);
  assert.equal(summary.deterministic, false);
});

test("V6 suppresses candidate-minus-baseline deltas when baseline has no context", () => {
  const result = analyzeFreshRepositoryV6([
    candidateObservation(1),
    candidateObservation(2),
    failedObservation(80_000),
    failedObservation(100_000)
  ]);

  assert.equal(result.descriptiveDeltaCandidateMinusBaseline.comparable, false);
  assert.equal(result.descriptiveDeltaCandidateMinusBaseline.coreCoverage, null);
  assert.equal(result.descriptiveDeltaCandidateMinusBaseline.contextTokens, null);
  assert.equal(result.baseline.deterministic, false);
});

test("V6 public results omit the local candidate artifact path", () => {
  assert.deepEqual(publicProductMetadata({
    sourceCommit: "abc",
    cliPath: "D:/private/product/dist/palace.cjs",
    cliSha256: "def",
    reportedVersion: "0.4.0"
  }), {
    sourceCommit: "abc",
    cliSha256: "def",
    reportedVersion: "0.4.0"
  });
});

function candidateObservation(repetition) {
  return {
    condition: "candidate",
    repetition,
    executionPassed: true,
    decision: "route",
    mode: "route-lite",
    roleClosure: false,
    core: { coverage: 0 },
    implementation: { coverage: 0 },
    tests: { coverage: 0 },
    auxiliary: { coverage: 0 },
    routeFocus: 0,
    routeFileCount: 1,
    contextTokens: 1000,
    durationsMs: { context: 50_000 },
    routeFiles: ["wrong.py"],
    trackedFilePollution: [],
    payloadMetricAgreement: true
  };
}

function failedObservation(contextMs) {
  return {
    condition: "baseline-0.4.0",
    executionPassed: false,
    durationsMs: { context: contextMs }
  };
}
