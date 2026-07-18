import assert from "node:assert/strict";
import test from "node:test";
import {
  buildPowerAnalysis,
  pairedBinarySampleSize,
  pairedContinuousSampleSize,
  renderPowerAnalysisMarkdown
} from "../analysis/power-analysis.mjs";

test("publishes transparent paired-binary sensitivity instead of inventing an observed effect", () => {
  assert.equal(pairedBinarySampleSize({
    discordantRate: 0,
    alternativeDifference: 0,
    nullBoundary: -0.1
  }), null);
  assert.equal(pairedBinarySampleSize({
    discordantRate: 0.2,
    alternativeDifference: 0,
    nullBoundary: -0.1
  }), 124);
});

test("reports standard continuous-effect planning values", () => {
  assert.equal(pairedContinuousSampleSize({ standardizedEffect: 0.3 }), 88);
  assert.equal(pairedContinuousSampleSize({ standardizedEffect: 0.5 }), 32);
  assert.equal(pairedContinuousSampleSize({ standardizedEffect: 0.8 }), 13);
});

test("labels an all-concordant pilot as unable to estimate observed-effect power", () => {
  const result = buildPowerAnalysis({
    plannedTrials: 20,
    loadedTrials: 20,
    scenarios: {
      demo: {
        validPairs: 5,
        success: {
          discordant: { total: 0 },
          fullPalaceMinusControl: { estimate: 0 }
        }
      }
    }
  });
  assert.equal(result.pilotStatus.allPrimaryPairsConcordant, true);
  assert.equal(result.scenarios.demo.estimatedPairsFromObservedPilot, null);
  assert.equal(result.nonInferiority.planningAnchor.pairsPerScenario, 124);
  assert.match(renderPowerAnalysisMarkdown(result), /cannot estimate a finite confirmatory sample size/);
  assert.match(renderPowerAnalysisMarkdown(result), /1,488/);
});
