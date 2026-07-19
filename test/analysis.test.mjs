import assert from "node:assert/strict";
import test from "node:test";
import {
  analyzeReports,
  exactMcNemar,
  holmAdjust,
  renderAnalysisMarkdown
} from "../analysis/paired-analysis.mjs";
import {
  median,
  pairedBootstrapMedianDifference
} from "../analysis/bootstrap-ci.mjs";

test("computes deterministic paired bootstrap intervals", () => {
  const first = [8, 7, 9, 6, 10];
  const second = [10, 10, 10, 10, 10];
  const firstRun = pairedBootstrapMedianDifference(first, second, { iterations: 1000, seed: "fixed" });
  const secondRun = pairedBootstrapMedianDifference(first, second, { iterations: 1000, seed: "fixed" });
  assert.deepEqual(firstRun, secondRun);
  assert.equal(firstRun.estimate, -2);
  assert.equal(median([4, 1, 3, 2]), 2.5);
});

test("uses exact paired tests and Holm step-down correction", () => {
  assert.equal(exactMcNemar(0, 3), 0.25);
  assert.deepEqual(holmAdjust([0.01, 0.04, 0.03]), [0.03, 0.06, 0.06]);
});

test("keeps failures in success analysis and efficiency to mutual successes", () => {
  const entries = [
    entry("trial-1", true, true, 100, 70),
    entry("trial-2", true, false, 90, 20),
    entry("trial-3", false, true, 30, 80)
  ];
  const result = analyzeReports(entries, { iterations: 500, bootstrapSeed: "analysis-test" });
  const scenario = result.scenarios.demo;
  assert.equal(scenario.validPairs, 3);
  assert.deepEqual(scenario.success.controlRaw, [1, 1, 0]);
  assert.deepEqual(scenario.success.fullPalaceRaw, [1, 0, 1]);
  assert.equal(scenario.metrics.durationMs.pairCount, 1);
  assert.deepEqual(scenario.metrics.durationMs.controlRaw, [100]);
  assert.deepEqual(scenario.metrics.durationMs.fullPalaceRaw, [70]);
  assert.equal(scenario.comparisons.routeOnlyMinusControl.validPairs, 3);
  assert.deepEqual(scenario.comparisons.routeOnlyMinusControl.success.treatmentRaw, [1, 1, 1]);
  assert.deepEqual(scenario.comparisons.routeOnlyMinusControl.metrics.durationMs.baselineRaw, [100, 90]);
  assert.deepEqual(scenario.comparisons.routeOnlyMinusControl.metrics.durationMs.treatmentRaw, [85, 85]);
  assert.deepEqual(scenario.comparisons.fullPalaceMinusRouteOnly.metrics.durationMs.baselineRaw, [85, 85]);
  assert.deepEqual(scenario.comparisons.fullPalaceMinusRouteOnly.metrics.durationMs.treatmentRaw, [70, 80]);
});

test("labels partial pilot output as interim against the preregistered trial count", () => {
  const result = analyzeReports([entry("trial-1", true, true, 100, 70)], {
    iterations: 100,
    bootstrapSeed: "interim-test",
    manifest: {
      plannedScenarios: ["one", "two", "three", "four"],
      plannedSeedsPerScenario: 5,
      trials: [{ trialId: "trial-1" }]
    }
  });
  assert.equal(result.plannedTrials, 20);
  assert.equal(result.attemptedTrials, 1);
  assert.equal(result.loadedTrials, 1);
  assert.match(result.caveats.join("\n"), /interim analysis with 1 of 20/);
  const markdown = renderAnalysisMarkdown(result);
  assert.match(markdown, /Interim only: 1\/20 planned trials/);
  assert.match(markdown, /Mutually Successful Pair Efficiency/);
  assert.match(markdown, /Three-Arm Ablation/);
  assert.match(markdown, /Route-only - Control/);
  assert.match(markdown, /\| demo \| Reported tokens \| 1 \| 1,100 \| 1,100 \| 0 \[0, 0\] \|/);
});

test("uses Adaptive versus Full Palace as the v2 primary comparison", () => {
  const adaptiveEntry = entry("adaptive-1", true, true, 100, 80);
  adaptiveEntry.report.arms["adaptive-palace"] = {
    ...arm(true, 55),
    palaceContextEstimatedTokens: 400,
    palaceContextOutputChars: 1600
  };
  adaptiveEntry.report.arms["full-palace"] = {
    ...adaptiveEntry.report.arms["full-palace"],
    palaceContextEstimatedTokens: 1200,
    palaceContextOutputChars: 4800
  };

  const result = analyzeReports([adaptiveEntry], { iterations: 100, bootstrapSeed: "adaptive-test" });
  const scenario = result.scenarios.demo;
  assert.equal(result.schemaVersion, 2);
  assert.equal(scenario.primaryComparison.baselineArm, "fullPalace");
  assert.equal(scenario.primaryComparison.treatmentArm, "adaptivePalace");
  assert.equal(scenario.primaryComparison.metrics.durationMs.treatmentMinusBaseline.estimate, -25);
  assert.equal(
    scenario.primaryComparison.metrics.palaceContextEstimatedTokens.treatmentMinusBaseline.estimate,
    -800
  );
  assert.match(renderAnalysisMarkdown(result), /Four-Arm Adaptive Contrasts/);
  assert.match(renderAnalysisMarkdown(result), /Adaptive Palace - Full Palace/);
});

function entry(trialId, controlSuccess, palaceSuccess, controlDuration, palaceDuration) {
  return {
    trial: { trialId, scenario: "demo" },
    report: {
      runId: trialId,
      scenario: "demo",
      arms: {
        control: arm(controlSuccess, controlDuration),
        "route-only": arm(true, 85),
        "full-palace": arm(palaceSuccess, palaceDuration)
      }
    }
  };
}

function arm(success, durationMs) {
  return {
    valid: true,
    success,
    durationMs,
    toolCalls: 5,
    failedCalls: 0,
    routerErrors: 0,
    inspectionCommands: 3,
    commandOutputChars: 100,
    inputTokens: 1000,
    cachedInputTokens: 500,
    uncachedInputTokens: 500,
    outputTokens: 100,
    reportedTokens: 1100,
    changedFilePrecision: 1,
    changedFileRecall: 1,
    route: { recallAtK: 1, precisionAtK: 0.5 },
    memory: { pitfallViolation: false, wrongMemoryAdopted: false }
  };
}
