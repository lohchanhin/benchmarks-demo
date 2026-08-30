import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const result = readJson("results/vve-local-0.5-smoke/result.json");

test("preserves the negative VVE local candidate comparison", () => {
  assert.equal(result.status, "completed-negative-no-candidate-advantage");
  assert.equal(result.target.closedForTuning, true);
  assert.equal(result.conclusion.candidateRoutingAdvantageObserved, false);
  assert.equal(result.conclusion.candidateTokenAdvantageObserved, false);
  assert.equal(result.conclusion.candidateTimingAdvantageObserved, false);
});

test("locks identical routes and weak natural-language recall", () => {
  const profile = result.profiles.naturalLanguage;
  assert.equal(profile.baseline.routeDigest, profile.candidate.routeDigest);
  assert.equal(profile.baseline.changedFileCoverage, 0.25);
  assert.equal(profile.candidate.changedFileCoverage, 0.25);
  assert.equal(profile.baseline.routeFocus, 0.111);
  assert.equal(profile.candidate.routeFocus, 0.111);
});

test("locks complete explicit-identity coverage without inventing a candidate gain", () => {
  const profile = result.profiles.explicitIdentity;
  assert.equal(profile.baseline.routeDigest, profile.candidate.routeDigest);
  assert.equal(profile.baseline.changedFileCoverage, 1);
  assert.equal(profile.candidate.changedFileCoverage, 1);
  assert.equal(profile.baseline.routeFocus, 0.4);
  assert.equal(profile.candidate.routeFocus, 0.4);
  assert.ok(profile.candidate.contextTokens > profile.baseline.contextTokens);
});

test("records the candidate evidence-status contradiction", () => {
  assert.deepEqual(
    result.profiles.explicitIdentity.candidate.evidenceStatusContradiction,
    {
      selection: "sufficient",
      routeClosure: "insufficient",
      missingExplicitSymbolCount: 2
    }
  );
});

test("public evidence contains no local drive paths or raw repository identity", () => {
  const serialized = JSON.stringify(result);
  assert.doesNotMatch(serialized, /[A-Za-z]:[\\/]/);
  assert.doesNotMatch(serialized, /backend\/src|frontend\/app|ConditionalPurchase/i);
});

function readJson(relativePath) {
  return JSON.parse(readFileSync(new URL(`../${relativePath}`, import.meta.url), "utf8"));
}
