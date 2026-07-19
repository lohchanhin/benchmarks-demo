import assert from "node:assert/strict";
import test from "node:test";
import { buildComparison } from "../src/commands/report.mjs";

test("builds transparent control-minus-palace deltas", () => {
  const run = {
    manifest: {
      id: "demo",
      scenario: "tenant-theme-regression",
      scenarioTitle: "Tenant theme",
      task: "Fix contrast",
      repositoryTree: "abc123",
      generatedFileCount: 240
    }
  };
  const evidence = {
    control: armEvidence({ arm: "control", durationMs: 10000, toolCalls: 12, palaceCalls: 0, tokens: 4000 }),
    palace: armEvidence({ arm: "palace", durationMs: 7000, toolCalls: 8, palaceCalls: 4, tokens: 2500 })
  };
  evidence.control.transcript.referencedFiles = ["a.mjs", "b.mjs", "c.mjs"];
  evidence.palace.transcript.referencedFiles = ["a.mjs"];
  const report = buildComparison(run, evidence);
  assert.equal(report.delta.durationMsSaved, 3000);
  assert.equal(report.delta.toolCallsSaved, 4);
  assert.equal(report.delta.referencedFilesSaved, 2);
  assert.equal(report.delta.reportedTokensSaved, 1500);
  assert.equal(report.delta.failedCallsSaved, 0);
  assert.equal(report.delta.applyPatchVerificationErrorsSaved, 0);
  assert.equal(report.delta.sandboxPreparationErrorsSaved, 0);
  assert.equal(report.delta.commandOutputCharsSaved, 0);
  assert.equal(report.delta.uncachedInputTokensSaved, 1500);
  assert.deepEqual(report.execution.order, ["control", "full-palace"]);
});

test("withholds efficiency deltas when either arm is invalid", () => {
  const run = {
    manifest: {
      id: "invalid-demo",
      scenario: "tenant-theme-regression",
      scenarioTitle: "Tenant theme",
      task: "Fix contrast",
      repositoryTree: "abc123",
      generatedFileCount: 240
    }
  };
  const control = armEvidence({ arm: "control", durationMs: 10000, toolCalls: 2, palaceCalls: 0, tokens: 1000 });
  const palace = armEvidence({ arm: "palace", durationMs: 5000, toolCalls: 0, palaceCalls: 0, tokens: 0 });
  palace.validity.passed = false;
  const report = buildComparison(run, { control, palace });
  assert.equal(report.comparable, false);
  assert.equal(report.delta.durationMsSaved, null);
});

test("uses Full Palace minus Adaptive as the v2 top-level comparison", () => {
  const run = {
    manifest: {
      id: "adaptive-demo",
      scenario: "small-local-bug",
      scenarioTitle: "Small local bug",
      task: "Fix formatting",
      repositoryTree: "abc123",
      generatedFileCount: 11,
      cacheState: "warm",
      protocolVersion: "2.0.0"
    }
  };
  const evidence = {
    control: armEvidence({ arm: "control", durationMs: 10000, toolCalls: 10, palaceCalls: 0, tokens: 4000 }),
    "route-only": armEvidence({ arm: "route-only", durationMs: 8000, toolCalls: 8, palaceCalls: 1, tokens: 3200 }),
    "full-palace": armEvidence({ arm: "full-palace", durationMs: 7000, toolCalls: 7, palaceCalls: 1, tokens: 3000 }),
    "adaptive-palace": armEvidence({ arm: "adaptive-palace", durationMs: 5000, toolCalls: 5, palaceCalls: 1, tokens: 2200 })
  };

  const report = buildComparison(run, evidence);
  assert.equal(report.schemaVersion, 4);
  assert.equal(report.delta.durationMsSaved, 2000);
  assert.equal(report.pairwise.fullPalaceVsAdaptivePalace.delta.durationMsSaved, 2000);
  assert.equal(report.pairwise.controlVsAdaptivePalace.delta.durationMsSaved, 5000);
});

test("uses Control minus Adaptive as the v3 top-level comparison", () => {
  const run = {
    manifest: {
      id: "control-first-demo",
      scenario: "decision-memory-dependent",
      scenarioTitle: "Decision memory",
      task: "Fix the launch tenant",
      repositoryTree: "abc123",
      generatedFileCount: 142,
      cacheState: "warm",
      protocolVersion: "3.0.0",
      primaryComparison: "adaptive-vs-control",
      primaryEfficiencyMetric: "reportedTokens"
    }
  };
  const evidence = {
    control: armEvidence({ arm: "control", durationMs: 10000, toolCalls: 10, palaceCalls: 0, tokens: 4000 }),
    "route-only": armEvidence({ arm: "route-only", durationMs: 9000, toolCalls: 8, palaceCalls: 1, tokens: 3500 }),
    "full-palace": armEvidence({ arm: "full-palace", durationMs: 6000, toolCalls: 6, palaceCalls: 1, tokens: 2000 }),
    "adaptive-palace": armEvidence({ arm: "adaptive-palace", durationMs: 8000, toolCalls: 7, palaceCalls: 1, tokens: 3000 })
  };

  const report = buildComparison(run, evidence);
  assert.equal(report.schemaVersion, 5);
  assert.equal(report.primaryComparison, "adaptive-vs-control");
  assert.equal(report.primaryEfficiencyMetric, "reportedTokens");
  assert.equal(report.delta.durationMsSaved, 2000);
  assert.equal(report.delta.reportedTokensSaved, 1000);
  assert.equal(report.pairwise.controlVsAdaptivePalace.delta.reportedTokensSaved, 1000);
  assert.equal(report.pairwise.fullPalaceVsAdaptivePalace.delta.reportedTokensSaved, -1000);
  assert.deepEqual(report.adaptive.instrumentationFiles, []);
});

function armEvidence({ arm, durationMs, toolCalls, palaceCalls, tokens }) {
  return {
    arm,
    model: "gpt-5.6-sol",
    execution: {
      durationMs,
      startedAt: arm === "control" ? "2026-01-01T00:00:00.000Z" : "2026-01-01T00:01:00.000Z"
    },
    validity: { verified: true, passed: true, reason: "valid" },
    tests: { passed: true },
    score: { total: 100, forbiddenChanged: [], unexpectedChanged: [], expectedCoverage: 1 },
    transcript: {
      toolCalls,
      failedCalls: 0,
      commandOutputChars: 1000,
      inspectionCommands: toolCalls - 2,
      palaceCalls,
      successfulPalaceCalls: palaceCalls,
      inspectedFiles: ["a.mjs"],
      referencedFiles: ["a.mjs"],
      usage: {
        inputTokens: tokens - 500,
        cachedInputTokens: 0,
        uncachedInputTokens: tokens - 500,
        outputTokens: 500,
        totalTokens: tokens
      }
    },
    runtimeDiagnostics: {
      routerErrors: 0,
      applyPatchVerificationErrors: 0,
      sandboxPreparationErrors: 0
    },
    git: {
      status: ["M a.mjs"],
      changedFiles: ["a.mjs"],
      instrumentationFiles: [],
      instrumentationUntrackedFiles: []
    },
    palaceEvaluation: null
  };
}
