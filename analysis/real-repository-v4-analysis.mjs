import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mean, median, quantile } from "./bootstrap-ci.mjs";
import { readJson } from "../src/lib/files.mjs";
import { repositoryRoot } from "../src/lib/root.mjs";
import { sha256File } from "../src/lib/v4-execution.mjs";
import { sha256Canonical } from "../src/lib/v4-protocol.mjs";
import { verifyRealRepositoryV4Reveal } from "../scripts/reveal-real-repository-v4.mjs";
import {
  verifyRealRepositoryV4RetryCostDisclosure
} from "../scripts/publish-real-repository-v4-retry-cost.mjs";

const defaultResultsRoot = path.join(repositoryRoot, "results", "real-repository-v4");
const defaultManifestPath = path.join(defaultResultsRoot, "manifest.json");
const defaultRevealPath = path.join(defaultResultsRoot, "blinding-reveal.json");
const defaultRetryPath = path.join(defaultResultsRoot, "infrastructure-attempt-costs.json");
const defaultAnalysisPath = path.join(defaultResultsRoot, "analysis.json");
const defaultPlanPath = path.join(repositoryRoot, "protocol", "v4", "plan.frozen.json");
const defaultBindingPath = path.join(repositoryRoot, "protocol", "v4", "execution.binding.frozen.json");

export async function analyzeRealRepositoryV4(options = {}) {
  const manifestPath = path.resolve(options.manifestPath ?? defaultManifestPath);
  const revealPath = path.resolve(options.revealPath ?? defaultRevealPath);
  const retryPath = path.resolve(options.retryPath ?? defaultRetryPath);
  const planPath = path.resolve(options.planPath ?? defaultPlanPath);
  const bindingPath = path.resolve(options.bindingPath ?? defaultBindingPath);
  const iterations = positiveInteger(options.iterations ?? 10000, "bootstrap iterations");
  const seed = String(options.seed ?? "vertex-palace-real-repository-v4-analysis-v1");
  const [manifest, plan, binding, reveal, retries] = await Promise.all([
    readJson(manifestPath),
    readJson(planPath),
    readJson(bindingPath),
    verifyRealRepositoryV4Reveal(revealPath, { planPath }),
    verifyRealRepositoryV4RetryCostDisclosure(retryPath, { manifestPath })
  ]);

  assert.equal(manifest.completedTrials, manifest.plannedTrials);
  assert.equal(manifest.completedArmRuns, manifest.plannedArmRuns);
  assert.equal(manifest.executionBindingSha256, sha256Canonical(binding));
  assert.equal(reveal.assignments.length, manifest.completedArmRuns);
  assert.equal(retries.outcomesLockedAtCommit, reveal.study.outcomesLockedAtCommit);
  assert.deepEqual(plan.statistics?.hierarchicalWin, [
    "success",
    "exact-scope",
    "reported-tokens",
    "wall-time"
  ]);

  const assignmentByArm = new Map(reveal.assignments.map((assignment) => [assignment.armId, assignment]));
  const retryByArm = groupBy(retries.attempts, (attempt) => attempt.armId);
  const arms = [];
  for (const record of manifest.arms) {
    const assignment = assignmentByArm.get(record.armId);
    assert.ok(assignment, `Missing revealed assignment for ${record.armId}`);
    const evidencePath = path.resolve(repositoryRoot, record.evidencePath);
    assert.equal(await sha256File(evidencePath), record.evidenceSha256, `Evidence hash mismatch for ${record.armId}`);
    const evidence = await readJson(evidencePath);
    arms.push(buildArm(record, evidence, assignment, retryByArm.get(record.armId) ?? []));
  }

  const pairs = plan.trials.map((trial) => {
    const trialArms = arms.filter((arm) => arm.trialId === trial.trialId);
    assert.equal(trialArms.length, 2, `Trial ${trial.trialId} must have two completed arms`);
    const adaptive = trialArms.find((arm) => arm.treatment === "adaptive-palace");
    const control = trialArms.find((arm) => arm.treatment === "control");
    assert.ok(adaptive && control, `Trial ${trial.trialId} must reveal one arm per treatment`);
    return {
      trialId: trial.trialId,
      fixtureId: trial.fixtureId,
      taskType: trial.taskType,
      replicate: trial.replicate,
      cacheState: trial.cacheState,
      adaptive,
      control
    };
  });

  const analysisOptions = { iterations, seed };
  const byFixture = Object.fromEntries(
    [...groupBy(pairs, (pair) => pair.fixtureId)].map(([fixtureId, fixturePairs]) => [
      fixtureId,
      analyzePairGroup(fixturePairs, { ...analysisOptions, seed: `${seed}:${fixtureId}` })
    ])
  );
  const byCacheState = Object.fromEntries(
    [...groupBy(pairs, (pair) => pair.cacheState)].map(([cacheState, cachePairs]) => [
      cacheState,
      analyzePairGroup(cachePairs, { ...analysisOptions, seed: `${seed}:cache:${cacheState}` })
    ])
  );
  const overall = analyzePairGroup(pairs, { ...analysisOptions, seed: `${seed}:overall` });
  const tokenRetryMissing = retries.accounting.tokenUsageComplete !== true;

  return {
    schemaVersion: 1,
    artifact: "real-repository-v4-analysis",
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    protocolVersion: manifest.protocolVersion,
    preregistered: true,
    exploratory: true,
    study: {
      id: plan.id,
      outcomesLockedAtCommit: reveal.study.outcomesLockedAtCommit,
      executionBindingCommit: manifest.executionBindingCommit,
      plannedTrials: manifest.plannedTrials,
      completedTrials: manifest.completedTrials,
      plannedArmRuns: manifest.plannedArmRuns,
      completedArmRuns: manifest.completedArmRuns,
      infrastructureFailures: manifest.infrastructureFailures,
      model: binding.agent.model,
      reasoningEffort: binding.agent.reasoningEffort,
      codexVersion: binding.agent.codexVersion,
      productVersion: binding.product.packageVersion,
      productSourceCommit: binding.product.sourceCommit
    },
    integrity: {
      manifestSha256: await sha256File(manifestPath),
      revealSha256: await sha256File(revealPath),
      retryCostDisclosureSha256: await sha256File(retryPath),
      evidenceHashesVerified: arms.length,
      oracleDetailsPublished: false
    },
    methods: {
      primaryComparison: "adaptive-palace-minus-control",
      hierarchy: [...plan.statistics.hierarchicalWin],
      bootstrap: {
        method: "paired stratified bootstrap within fixture",
        iterations,
        confidenceLevel: plan.statistics.confidenceLevel,
        seed
      },
      exactPairedSuccessTest: "two-sided exact McNemar/binomial test",
      noOutcomeDependentExclusions: true,
      retryAccounting: {
        wallTime: "All completed attempts plus every infrastructure retry",
        reportedTokens: tokenRetryMissing
          ? "Lower bound only because one timed-out attempt emitted no final usage event"
          : "All completed attempts plus every infrastructure retry",
        zeroWithoutUsageEventTreatedAsUnknown: true
      },
      protocolNote: "The frozen definitions make cost_per_successful_solution and retry_adjusted_cost equivalent when every attempt is included; both names point to the same all-attempt calculation."
    },
    primary: {
      correctness: overall.correctness,
      strictSuccess: overall.success,
      changedFileScope: overall.scope,
      costPerSuccessfulSolution: overall.costPerSuccessfulSolution,
      successWeightedReportedTokens: overall.successWeightedReportedTokens,
      retryAdjustedCost: {
        sameCalculationAsCostPerSuccessfulSolution: true,
        ...overall.costPerSuccessfulSolution
      },
      hierarchicalWin: overall.hierarchicalWin
    },
    secondary: overall.secondary,
    overall,
    byFixture,
    byCacheState,
    trialOutcomes: pairs.map(serializePair),
    limitations: [
      "The study has four real issues and four repetitions per issue; fixture-level estimates are descriptive and underpowered.",
      "All runs used one Codex build, one model configuration, one machine, and Windows.",
      "One timed-out infrastructure attempt emitted no final token-usage event. Retry wall time is complete, but retry-adjusted token cost is a lower bound and has no confidence interval.",
      "Success requires hidden-oracle correctness, exact changed-file scope, no forbidden files, a clean diff check, and completed execution; this is stricter than ordinary task acceptance.",
      "The frozen cost_per_successful_solution and retry_adjusted_cost definitions overlap, so the report treats them as one all-attempt measure rather than manufacturing two claims.",
      "Secondary Token, tool-call, cache, and wall-time comparisons are descriptive and cannot replace the preregistered hierarchy."
    ]
  };
}

export async function verifyRealRepositoryV4Analysis(analysisPath = defaultAnalysisPath) {
  const absolutePath = path.resolve(analysisPath);
  const published = await readJson(absolutePath);
  const rebuilt = await analyzeRealRepositoryV4({
    generatedAt: published.generatedAt,
    iterations: published.methods?.bootstrap?.iterations,
    seed: published.methods?.bootstrap?.seed
  });
  assert.deepEqual(published, rebuilt, "Published V4 analysis does not reproduce from public artifacts");
  return rebuilt;
}

function buildArm(record, evidence, assignment, retries) {
  assert.equal(record.armId, evidence.armId);
  assert.equal(record.success, evidence.metrics?.success);
  const metrics = evidence.metrics;
  const retryWallTimeMs = sum(retries.map((retry) => retry.metrics.wallTimeMs));
  const missingRetryTokenAttempts = retries.filter((retry) => !retry.metrics.usageEventObserved).length;
  const observedRetryTokens = sum(retries.map((retry) => retry.metrics.reportedTokens ?? 0));
  return {
    armId: record.armId,
    trialId: record.trialId,
    fixtureId: record.fixtureId,
    blindedLabel: record.blindedLabel,
    sequence: record.sequence,
    treatment: assignment.treatment,
    success: metrics.success === true,
    correctnessPassed: metrics.correctnessPassed === true,
    exactScopePassed: metrics.exactScopePassed === true,
    forbiddenViolation: metrics.forbiddenViolation === true,
    diffCheckPassed: metrics.diffCheckPassed === true,
    executionPassed: metrics.executionPassed === true,
    reportedTokens: metrics.reportedTokens,
    inputTokens: metrics.inputTokens,
    cachedInputTokens: metrics.cachedInputTokens,
    uncachedInputTokens: metrics.inputTokens - metrics.cachedInputTokens,
    outputTokens: metrics.outputTokens,
    toolCalls: metrics.toolCalls,
    failedCalls: metrics.failedCalls,
    wallTimeMs: metrics.wallTimeMs,
    retryAttempts: retries.length,
    retryWallTimeMs,
    retryReportedTokensObserved: observedRetryTokens,
    missingRetryTokenAttempts,
    allAttemptWallTimeMs: metrics.wallTimeMs + retryWallTimeMs,
    allAttemptReportedTokensLowerBound: metrics.reportedTokens + observedRetryTokens,
    allAttemptReportedTokens: missingRetryTokenAttempts === 0
      ? metrics.reportedTokens + observedRetryTokens
      : null
  };
}

function analyzePairGroup(pairs, options) {
  const arms = pairs.flatMap((pair) => [pair.adaptive, pair.control]);
  const adaptive = arms.filter((arm) => arm.treatment === "adaptive-palace");
  const control = arms.filter((arm) => arm.treatment === "control");
  const treatment = {
    adaptivePalace: summarizeTreatment(adaptive),
    control: summarizeTreatment(control)
  };
  const success = pairedBinaryOutcome(pairs, "success", options);
  const correctness = pairedBinaryOutcome(pairs, "correctnessPassed", {
    ...options,
    seed: `${options.seed}:correctness`
  });
  const exactScope = pairedBinaryOutcome(pairs, "exactScopePassed", {
    ...options,
    seed: `${options.seed}:exact-scope`
  });
  const forbidden = pairedBinaryOutcome(pairs, "forbiddenViolation", {
    ...options,
    seed: `${options.seed}:forbidden`
  });
  const hierarchy = pairs.map(hierarchicalWinner);
  const adaptiveWins = hierarchy.filter((result) => result.winner === "adaptive-palace").length;
  const controlWins = hierarchy.filter((result) => result.winner === "control").length;
  const ties = hierarchy.length - adaptiveWins - controlWins;
  const wallCostDifference = stratifiedBootstrap(
    pairs,
    (sample) => costPerSuccessDifference(sample, "allAttemptWallTimeMs"),
    { ...options, seed: `${options.seed}:cost-per-success:wall` }
  );
  const tokenCostsComplete = arms.every((arm) => arm.allAttemptReportedTokens !== null);
  const tokenCostDifference = tokenCostsComplete
    ? stratifiedBootstrap(
        pairs,
        (sample) => costPerSuccessDifference(sample, "allAttemptReportedTokens"),
        { ...options, seed: `${options.seed}:cost-per-success:tokens` }
      )
    : unavailableInterval("An infrastructure retry has no observed final token usage event");
  const successWeightedTokens = stratifiedBootstrap(
    pairs,
    successWeightedTokenDifference,
    { ...options, seed: `${options.seed}:success-weighted-tokens` }
  );

  return {
    pairedTrials: pairs.length,
    treatment,
    correctness,
    success,
    scope: {
      exactScope: exactScope,
      nonExactScope: invertBinaryOutcome(exactScope),
      forbiddenViolation: forbidden
    },
    costPerSuccessfulSolution: {
      definition: "All completed and infrastructure-retry attempt cost divided by strict successful solutions",
      adaptivePalace: treatment.adaptivePalace.costPerSuccessfulSolution,
      control: treatment.control.costPerSuccessfulSolution,
      adaptiveMinusControl: {
        wallTimeMs: wallCostDifference,
        reportedTokens: tokenCostDifference,
        reportedTokensLowerBound: lowerBoundCostDifference(treatment)
      }
    },
    successWeightedReportedTokens: {
      definition: "Mean final reported tokens among strict successful solutions; success rates are reported beside it",
      adaptivePalace: treatment.adaptivePalace.successWeightedReportedTokens,
      control: treatment.control.successWeightedReportedTokens,
      adaptiveMinusControl: successWeightedTokens
    },
    hierarchicalWin: {
      order: ["success", "exact-scope", "reported-tokens", "wall-time"],
      adaptivePalaceWins: adaptiveWins,
      controlWins,
      ties,
      exactTwoSidedPValueIgnoringTies: exactBinomialTwoSided(adaptiveWins, controlWins),
      meanScoreAdaptivePositive: stratifiedBootstrap(
        pairs,
        (sample) => mean(sample.map((pair) => winnerScore(hierarchicalWinner(pair).winner))),
        { ...options, seed: `${options.seed}:hierarchical-score` }
      ),
      pairs: hierarchy
    },
    secondary: Object.fromEntries([
      ["reportedTokens", pairedContinuous(pairs, "reportedTokens", options)],
      ["inputTokens", pairedContinuous(pairs, "inputTokens", options)],
      ["cachedInputTokens", pairedContinuous(pairs, "cachedInputTokens", options)],
      ["uncachedInputTokens", pairedContinuous(pairs, "uncachedInputTokens", options)],
      ["outputTokens", pairedContinuous(pairs, "outputTokens", options)],
      ["toolCalls", pairedContinuous(pairs, "toolCalls", options)],
      ["failedCalls", pairedContinuous(pairs, "failedCalls", options)],
      ["wallTimeMs", pairedContinuous(pairs, "wallTimeMs", options)],
      ["allAttemptWallTimeMs", pairedContinuous(pairs, "allAttemptWallTimeMs", options)]
    ])
  };
}

function summarizeTreatment(arms) {
  const successes = arms.filter((arm) => arm.success);
  const allTokenCostsComplete = arms.every((arm) => arm.allAttemptReportedTokens !== null);
  const successCount = successes.length;
  const allAttemptWallTimeMs = sum(arms.map((arm) => arm.allAttemptWallTimeMs));
  const tokenLowerBound = sum(arms.map((arm) => arm.allAttemptReportedTokensLowerBound));
  const allAttemptReportedTokens = allTokenCostsComplete
    ? sum(arms.map((arm) => arm.allAttemptReportedTokens))
    : null;
  return {
    armRuns: arms.length,
    successes: successCount,
    successRate: rate(successCount, arms.length),
    correctnessPasses: arms.filter((arm) => arm.correctnessPassed).length,
    exactScopePasses: arms.filter((arm) => arm.exactScopePassed).length,
    forbiddenViolations: arms.filter((arm) => arm.forbiddenViolation).length,
    infrastructureRetries: sum(arms.map((arm) => arm.retryAttempts)),
    total: {
      completedReportedTokens: sum(arms.map((arm) => arm.reportedTokens)),
      completedInputTokens: sum(arms.map((arm) => arm.inputTokens)),
      completedCachedInputTokens: sum(arms.map((arm) => arm.cachedInputTokens)),
      completedUncachedInputTokens: sum(arms.map((arm) => arm.uncachedInputTokens)),
      completedOutputTokens: sum(arms.map((arm) => arm.outputTokens)),
      allAttemptWallTimeMs,
      allAttemptReportedTokens,
      allAttemptReportedTokensLowerBound: tokenLowerBound,
      missingRetryTokenAttempts: sum(arms.map((arm) => arm.missingRetryTokenAttempts))
    },
    costPerSuccessfulSolution: {
      denominatorSuccesses: successCount,
      wallTimeMs: successCount ? allAttemptWallTimeMs / successCount : null,
      reportedTokens: successCount && allTokenCostsComplete ? allAttemptReportedTokens / successCount : null,
      reportedTokensLowerBound: successCount ? tokenLowerBound / successCount : null,
      tokenEstimateComplete: allTokenCostsComplete
    },
    successWeightedReportedTokens: successCount ? mean(successes.map((arm) => arm.reportedTokens)) : null,
    descriptiveMedians: {
      reportedTokens: median(arms.map((arm) => arm.reportedTokens)),
      uncachedInputTokens: median(arms.map((arm) => arm.uncachedInputTokens)),
      toolCalls: median(arms.map((arm) => arm.toolCalls)),
      wallTimeMs: median(arms.map((arm) => arm.wallTimeMs))
    }
  };
}

function pairedBinaryOutcome(pairs, metric, options) {
  const adaptivePasses = pairs.filter((pair) => pair.adaptive[metric] === true).length;
  const controlPasses = pairs.filter((pair) => pair.control[metric] === true).length;
  const adaptiveOnly = pairs.filter((pair) => pair.adaptive[metric] && !pair.control[metric]).length;
  const controlOnly = pairs.filter((pair) => !pair.adaptive[metric] && pair.control[metric]).length;
  const both = pairs.filter((pair) => pair.adaptive[metric] && pair.control[metric]).length;
  const neither = pairs.length - adaptiveOnly - controlOnly - both;
  return {
    adaptivePalaceCount: adaptivePasses,
    controlCount: controlPasses,
    adaptivePalaceRate: rate(adaptivePasses, pairs.length),
    controlRate: rate(controlPasses, pairs.length),
    adaptiveMinusControl: stratifiedBootstrap(
      pairs,
      (sample) => mean(sample.map((pair) => Number(pair.adaptive[metric]) - Number(pair.control[metric]))),
      options
    ),
    discordance: { adaptiveOnly, controlOnly, both, neither },
    exactTwoSidedMcNemarPValue: exactBinomialTwoSided(adaptiveOnly, controlOnly)
  };
}

function invertBinaryOutcome(outcome) {
  return {
    adaptivePalaceFailures: outcome.controlCount === undefined ? null : outcome.adaptivePalaceRate === null
      ? null
      : outcome.discordance.controlOnly + outcome.discordance.neither,
    controlFailures: outcome.controlRate === null
      ? null
      : outcome.discordance.adaptiveOnly + outcome.discordance.neither,
    adaptivePalaceRate: outcome.adaptivePalaceRate === null ? null : 1 - outcome.adaptivePalaceRate,
    controlRate: outcome.controlRate === null ? null : 1 - outcome.controlRate,
    adaptiveMinusControl: negateInterval(outcome.adaptiveMinusControl)
  };
}

function pairedContinuous(pairs, metric, options) {
  const adaptiveValues = pairs.map((pair) => pair.adaptive[metric]);
  const controlValues = pairs.map((pair) => pair.control[metric]);
  return {
    pairedTrials: pairs.length,
    adaptivePalaceMedian: median(adaptiveValues),
    controlMedian: median(controlValues),
    adaptiveMinusControlMedianPairedDifference: stratifiedBootstrap(
      pairs,
      (sample) => median(sample.map((pair) => pair.adaptive[metric] - pair.control[metric])),
      { ...options, seed: `${options.seed}:secondary:${metric}` }
    )
  };
}

function hierarchicalWinner(pair) {
  const criteria = [
    ["success", true],
    ["exact-scope", true],
    ["reported-tokens", false],
    ["wall-time", false]
  ];
  for (const [criterion, higherWins] of criteria) {
    const adaptive = hierarchyValue(pair.adaptive, criterion);
    const control = hierarchyValue(pair.control, criterion);
    if (adaptive === control) continue;
    const winner = higherWins
      ? (adaptive > control ? "adaptive-palace" : "control")
      : (adaptive < control ? "adaptive-palace" : "control");
    return { trialId: pair.trialId, winner, decidedBy: criterion };
  }
  return { trialId: pair.trialId, winner: "tie", decidedBy: "tie" };
}

function hierarchyValue(arm, criterion) {
  if (criterion === "success") return Number(arm.success);
  if (criterion === "exact-scope") return Number(arm.exactScopePassed);
  if (criterion === "reported-tokens") return arm.reportedTokens;
  return arm.wallTimeMs;
}

function winnerScore(winner) {
  if (winner === "adaptive-palace") return 1;
  if (winner === "control") return -1;
  return 0;
}

function costPerSuccessDifference(pairs, metric) {
  const adaptiveSuccesses = pairs.filter((pair) => pair.adaptive.success).length;
  const controlSuccesses = pairs.filter((pair) => pair.control.success).length;
  if (!adaptiveSuccesses || !controlSuccesses) return null;
  const adaptiveCost = sum(pairs.map((pair) => pair.adaptive[metric])) / adaptiveSuccesses;
  const controlCost = sum(pairs.map((pair) => pair.control[metric])) / controlSuccesses;
  return adaptiveCost - controlCost;
}

function successWeightedTokenDifference(pairs) {
  const adaptive = pairs.filter((pair) => pair.adaptive.success).map((pair) => pair.adaptive.reportedTokens);
  const control = pairs.filter((pair) => pair.control.success).map((pair) => pair.control.reportedTokens);
  if (!adaptive.length || !control.length) return null;
  return mean(adaptive) - mean(control);
}

function lowerBoundCostDifference(treatment) {
  const adaptive = treatment.adaptivePalace.costPerSuccessfulSolution.reportedTokensLowerBound;
  const control = treatment.control.costPerSuccessfulSolution.reportedTokensLowerBound;
  return Number.isFinite(adaptive) && Number.isFinite(control) ? adaptive - control : null;
}

function stratifiedBootstrap(pairs, statistic, options) {
  const estimate = statistic(pairs);
  if (!Number.isFinite(estimate)) return unavailableInterval("Statistic is undefined for the observed sample");
  const iterations = positiveInteger(options.iterations, "bootstrap iterations");
  const random = seededRandom(String(options.seed));
  const strata = [...groupBy(pairs, (pair) => pair.fixtureId).values()];
  const samples = [];
  let undefinedIterations = 0;
  for (let iteration = 0; iteration < iterations; iteration += 1) {
    const sample = strata.flatMap((stratum) => (
      Array.from({ length: stratum.length }, () => stratum[Math.floor(random() * stratum.length)])
    ));
    const value = statistic(sample);
    if (Number.isFinite(value)) samples.push(value);
    else undefinedIterations += 1;
  }
  samples.sort((first, second) => first - second);
  return {
    estimate,
    confidenceInterval: samples.length
      ? [quantile(samples, 0.025), quantile(samples, 0.975)]
      : [null, null],
    iterations,
    validIterations: samples.length,
    undefinedIterations,
    confidence: 0.95,
    seed: String(options.seed),
    estimable: samples.length > 0
  };
}

function unavailableInterval(reason) {
  return {
    estimate: null,
    confidenceInterval: [null, null],
    iterations: 0,
    validIterations: 0,
    undefinedIterations: 0,
    confidence: 0.95,
    seed: null,
    estimable: false,
    reason
  };
}

function negateInterval(interval) {
  if (!interval.estimable) return interval;
  return {
    ...interval,
    estimate: negateNumber(interval.estimate),
    confidenceInterval: [
      negateNumber(interval.confidenceInterval[1]),
      negateNumber(interval.confidenceInterval[0])
    ]
  };
}

function negateNumber(value) {
  return value === 0 ? 0 : -value;
}

function exactBinomialTwoSided(firstOnly, secondOnly) {
  const discordant = firstOnly + secondOnly;
  if (!discordant) return 1;
  const lower = Math.min(firstOnly, secondOnly);
  let cumulative = 0;
  for (let value = 0; value <= lower; value += 1) {
    cumulative += combination(discordant, value) * (0.5 ** discordant);
  }
  return Math.min(1, 2 * cumulative);
}

function combination(n, k) {
  let result = 1;
  for (let index = 1; index <= k; index += 1) {
    result = (result * (n - index + 1)) / index;
  }
  return result;
}

function serializePair(pair) {
  return {
    trialId: pair.trialId,
    fixtureId: pair.fixtureId,
    taskType: pair.taskType,
    replicate: pair.replicate,
    cacheState: pair.cacheState,
    adaptivePalace: serializeArm(pair.adaptive),
    control: serializeArm(pair.control),
    hierarchical: hierarchicalWinner(pair)
  };
}

function serializeArm(arm) {
  return {
    armId: arm.armId,
    blindedLabel: arm.blindedLabel,
    success: arm.success,
    correctnessPassed: arm.correctnessPassed,
    exactScopePassed: arm.exactScopePassed,
    forbiddenViolation: arm.forbiddenViolation,
    reportedTokens: arm.reportedTokens,
    inputTokens: arm.inputTokens,
    cachedInputTokens: arm.cachedInputTokens,
    uncachedInputTokens: arm.uncachedInputTokens,
    outputTokens: arm.outputTokens,
    toolCalls: arm.toolCalls,
    wallTimeMs: arm.wallTimeMs,
    infrastructureRetries: arm.retryAttempts,
    allAttemptWallTimeMs: arm.allAttemptWallTimeMs,
    allAttemptReportedTokens: arm.allAttemptReportedTokens,
    allAttemptReportedTokensLowerBound: arm.allAttemptReportedTokensLowerBound
  };
}

function groupBy(values, key) {
  const result = new Map();
  for (const value of values) {
    const group = key(value);
    if (!result.has(group)) result.set(group, []);
    result.get(group).push(value);
  }
  return result;
}

function seededRandom(seed) {
  let state = hashSeed(seed);
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(value) {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function rate(numerator, denominator) {
  return denominator ? numerator / denominator : null;
}

function sum(values) {
  return values.reduce((total, value) => total + Number(value), 0);
}

function positiveInteger(value, label) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) throw new Error(`${label} must be a positive integer`);
  return parsed;
}

function argumentValue(args, flag) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
}

async function main() {
  const args = process.argv.slice(2);
  const outputPath = path.resolve(argumentValue(args, "--out") ?? defaultAnalysisPath);
  if (args.includes("--verify")) {
    const analysis = await verifyRealRepositoryV4Analysis(outputPath);
    process.stdout.write(`${JSON.stringify({
      mode: "verify",
      outputPath,
      trialsVerified: analysis.study.completedTrials,
      armsVerified: analysis.study.completedArmRuns
    }, null, 2)}\n`);
    return;
  }
  const analysis = await analyzeRealRepositoryV4({
    iterations: Number(argumentValue(args, "--iterations") ?? 10000),
    seed: argumentValue(args, "--seed")
  });
  await writeFile(outputPath, `${JSON.stringify(analysis, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify({
    mode: "write",
    outputPath,
    trialsAnalyzed: analysis.study.completedTrials,
    armsAnalyzed: analysis.study.completedArmRuns
  }, null, 2)}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
