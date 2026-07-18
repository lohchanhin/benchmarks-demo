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

function armEvidence({ arm, durationMs, toolCalls, palaceCalls, tokens }) {
  return {
    arm,
    model: "gpt-5.6-sol",
    execution: { durationMs },
    validity: { verified: true, passed: true, reason: "valid" },
    tests: { passed: true },
    score: { total: 100, forbiddenChanged: [], unexpectedChanged: [], expectedCoverage: 1 },
    transcript: {
      toolCalls,
      inspectionCommands: toolCalls - 2,
      palaceCalls,
      successfulPalaceCalls: palaceCalls,
      inspectedFiles: ["a.mjs"],
      referencedFiles: ["a.mjs"],
      usage: { totalTokens: tokens }
    },
    git: { changedFiles: ["a.mjs"] },
    palaceEvaluation: null
  };
}
