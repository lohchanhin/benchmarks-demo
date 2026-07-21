import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { repositoryRoot } from "../src/lib/root.mjs";
import { verifyRealRepositoryV4Analysis } from "../analysis/real-repository-v4-analysis.mjs";
import { verifyRealRepositoryV4Reveal } from "../scripts/reveal-real-repository-v4.mjs";
import {
  verifyRealRepositoryV4RetryCostDisclosure
} from "../scripts/publish-real-repository-v4-retry-cost.mjs";
import {
  verifyRealRepositoryV4MechanismAudit
} from "../scripts/publish-real-repository-v4-mechanism-audit.mjs";

const resultsRoot = path.join(repositoryRoot, "results", "real-repository-v4");

test("published real-repository v4 reveal reproduces all locked assignments", async () => {
  const reveal = await verifyRealRepositoryV4Reveal(path.join(resultsRoot, "blinding-reveal.json"));
  assert.equal(reveal.verification.resultsComplete, true);
  assert.equal(reveal.verification.completedArmRuns, 32);
  assert.equal(reveal.verification.evidenceHashesVerified, 32);
  assert.equal(reveal.verification.keyMatchesFrozenCommitment, true);
  assert.equal(reveal.verification.oracleDetailsPublished, false);
  assert.equal(reveal.assignments.length, 32);
});

test("published v4 retry disclosure preserves unknown token usage", async () => {
  const disclosure = await verifyRealRepositoryV4RetryCostDisclosure(
    path.join(resultsRoot, "infrastructure-attempt-costs.json")
  );
  assert.equal(disclosure.accounting.infrastructureAttempts, 1);
  assert.equal(disclosure.accounting.wallTimeComplete, true);
  assert.equal(disclosure.accounting.tokenUsageComplete, false);
  assert.equal(disclosure.attempts[0].metrics.reportedTokens, null);
  assert.equal(disclosure.attempts[0].metrics.wallTimeMs > 0, true);
});

test("published v4 analysis is reproducible and keeps incomplete retry tokens unestimated", async () => {
  const analysis = await verifyRealRepositoryV4Analysis(path.join(resultsRoot, "analysis.json"));
  assert.equal(analysis.study.completedTrials, 16);
  assert.equal(analysis.study.completedArmRuns, 32);
  assert.equal(analysis.integrity.evidenceHashesVerified, 32);
  assert.equal(analysis.primary.costPerSuccessfulSolution.adaptiveMinusControl.reportedTokens.estimable, false);
  assert.equal(analysis.primary.retryAdjustedCost.sameCalculationAsCostPerSuccessfulSolution, true);
  assert.equal(analysis.limitations.some((line) => line.includes("lower bound")), true);
});

test("published v4 mechanism audit is explicitly post-hoc and privacy-sanitized", async () => {
  const audit = await verifyRealRepositoryV4MechanismAudit(
    path.join(resultsRoot, "mechanism-audit.post-hoc.json")
  );
  assert.equal(audit.analysisClass, "post-hoc-exploratory");
  assert.equal(audit.summary.adaptiveArms, 16);
  assert.equal(audit.summary.bypassOrRouteLiteSelections, 0);
  assert.equal(audit.summary.fullOrGuardedSelections, 16);
  assert.equal(audit.privacy.rawAgentEventsPublished, false);
});
