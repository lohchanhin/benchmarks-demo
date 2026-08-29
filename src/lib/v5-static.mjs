import { createHash } from "node:crypto";

export const V5_STATIC_CONDITIONS = Object.freeze(["candidate", "baseline-0.4.0"]);

export function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

export function balancedV5Order(targetIndex, repetition) {
  if (!Number.isInteger(targetIndex) || targetIndex < 0) throw new Error("targetIndex must be non-negative");
  if (![1, 2].includes(repetition)) throw new Error("V5 static repetition must be 1 or 2");
  const candidateFirst = (targetIndex + repetition) % 2 === 1;
  return candidateFirst
    ? [...V5_STATIC_CONDITIONS]
    : [...V5_STATIC_CONDITIONS].reverse();
}

export function routeFilesFromContext(output) {
  const values = [];
  if (typeof output?.primaryCandidate === "string") values.push(output.primaryCandidate);
  for (const group of [output?.route?.primary, output?.route?.support, output?.route?.deferred]) {
    for (const item of group || []) appendSource(values, item);
  }
  for (const item of output?.context || []) appendSource(values, item);
  for (const item of output?.deferredReferences || []) appendSource(values, item);
  for (const item of output?.executionBoundaries?.requiredEvidence || []) appendSource(values, item);
  return [...new Set(values.map(stripLocation).map(pathKey).filter(Boolean))].sort();
}

export function measureV5Observation({ target, oracle, output, rawBytes, status }) {
  const routeFiles = routeFilesFromContext(output);
  const implementation = measureLayer(oracle.implementationFiles, routeFiles);
  const tests = measureLayer(oracle.testFiles, routeFiles);
  const auxiliary = measureLayer(oracle.auxiliaryFiles, routeFiles);
  const coreFiles = unique([...oracle.implementationFiles, ...oracle.testFiles]);
  const core = measureLayer(coreFiles, routeFiles);
  const hardTruth = new Set([...core.matchedFiles, ...auxiliary.matchedFiles]);
  const decision = output?.decision || output?.route?.decision || "route";
  const stopEnforced = output?.executionBoundaries?.stopEnforced === true;
  const confidence = finiteNumber(output?.route?.confidence);
  const roleClosure = implementation.matchedFiles.length > 0 && tests.matchedFiles.length > 0;
  const routeFocus = routeFiles.length ? round(hardTruth.size / routeFiles.length) : 0;
  const contextTokens = finiteNumber(output?.payload?.contextEstimatedTokens)
    ?? Math.ceil(rawBytes / 4);
  const reportedBytes = finiteNumber(output?.payload?.contextBytes);
  const payloadMetricAgreement = reportedBytes === null || reportedBytes === rawBytes;
  const pollution = parseTrackedPollution(status);
  const overconfident = decision === "route"
    && confidence !== null
    && confidence >= 0.8
    && (!roleClosure || core.coverage < 0.5);
  const wrongForcedStop = stopEnforced && (
    decision !== "route"
    || !roleClosure
    || core.coverage < 0.5
    || auxiliary.coverage < 1
  );
  return {
    targetId: target.id,
    repository: target.repository,
    language: target.language,
    stratum: target.stratum,
    decision,
    grounding: output?.taskGrounding || output?.route?.taskGrounding || null,
    mode: output?.mode || null,
    evidenceStatus: output?.selection?.evidenceStatus || output?.route?.evidenceClosure?.status || null,
    stopEnforced,
    confidence,
    routeFiles,
    routeFileCount: routeFiles.length,
    implementation,
    tests,
    core,
    auxiliary,
    roleClosure,
    routeFocus,
    contextTokens,
    contextBytes: rawBytes,
    reportedContextBytes: reportedBytes,
    payloadMetricAgreement,
    trackedFilePollution: pollution,
    overconfident,
    wrongForcedStop
  };
}

export function analyzeV5Static(targets, observations, options = {}) {
  const repetitions = options.repetitions ?? 2;
  const candidate = observations.filter((item) => item.condition === "candidate");
  const baseline = observations.filter((item) => item.condition === "baseline-0.4.0");
  const expectedRuns = targets.length * repetitions;
  const targetSummaries = targets.map((target) => summarizeTarget(target, candidate, baseline));
  const candidateRunsComplete = candidate.length === expectedRuns;
  const baselineRunsComplete = baseline.length === expectedRuns;
  const candidateMacroCoverage = mean(candidate.map((item) => item.core.coverage));
  const candidateMacroFocus = mean(candidate.map((item) => item.routeFocus));
  const common = targetSummaries.filter((item) => item.commonRoleClosure);
  const coverageDelta = mean(common.map((item) => item.candidate.coreCoverage - item.baseline.coreCoverage));
  const focusDelta = mean(common.map((item) => item.candidate.routeFocus - item.baseline.routeFocus));
  const referenceRuns = candidate.filter((item) => item.stratum === "reference-grounded");
  const expectedReferenceRuns = targets.filter((item) => item.stratum === "reference-grounded").length * repetitions;

  const gates = {
    observationCountComplete: candidateRunsComplete && baselineRunsComplete,
    allContextCommandsSucceeded: observations.length === expectedRuns * 2
      && observations.every((item) => item.executionPassed === true),
    accessibleReferenceGrounding100: referenceRuns.length === expectedReferenceRuns && referenceRuns.every((item) => (
      item.decision === "route"
      && item.grounding?.status === "resolved"
      && ["cache-hit", "fetched"].includes(item.grounding?.resolutionStatus)
    )),
    implementationAndTestRoleClosure100: candidateRunsComplete && candidate.every((item) => item.roleClosure),
    macroCoreCoverage90: candidateMacroCoverage >= 0.9,
    macroRouteFocus70: candidateMacroFocus >= 0.7,
    perTargetCoverage50: targetSummaries.every((item) => item.candidate.coreCoverage >= 0.5),
    perTargetFocus40: targetSummaries.every((item) => item.candidate.routeFocus >= 0.4),
    explicitAuxiliaryCoverage100: candidate.every((item) => item.auxiliary.coverage === 1),
    commonCoverageNonInferior: common.length === 0 || coverageDelta >= -0.05,
    commonFocusNonInferior: common.length === 0 || focusDelta >= -0.05,
    zeroOverconfidence: candidate.every((item) => !item.overconfident),
    zeroWrongForcedStops: candidate.every((item) => !item.wrongForcedStop),
    zeroTrackedFilePollution: candidate.every((item) => item.trackedFilePollution.length === 0),
    zeroPayloadMetricDisagreement: candidate.every((item) => item.payloadMetricAgreement),
    deterministicRoutes: targetSummaries.every((item) => item.candidate.deterministic),
    contextCeiling6000: candidate.every((item) => item.contextTokens <= 6000)
  };
  return {
    schemaVersion: 1,
    artifact: "real-repository-v5-static-analysis",
    pass: Object.values(gates).every(Boolean),
    agentStageAllowed: Object.values(gates).every(Boolean),
    gates,
    metrics: {
      expectedRunsPerCondition: expectedRuns,
      candidateRuns: candidate.length,
      baselineRuns: baseline.length,
      candidateMacroCoreCoverage: round(candidateMacroCoverage),
      candidateMacroRouteFocus: round(candidateMacroFocus),
      commonRoleClosureTargets: common.map((item) => item.targetId),
      commonCoverageDelta: round(coverageDelta),
      commonFocusDelta: round(focusDelta)
    },
    targetSummaries
  };
}

function summarizeTarget(target, candidate, baseline) {
  const candidateRuns = candidate.filter((item) => item.targetId === target.id);
  const baselineRuns = baseline.filter((item) => item.targetId === target.id);
  const candidateSummary = summarizeCondition(candidateRuns);
  const baselineSummary = summarizeCondition(baselineRuns);
  return {
    targetId: target.id,
    repository: target.repository,
    language: target.language,
    stratum: target.stratum,
    candidate: candidateSummary,
    baseline: baselineSummary,
    commonRoleClosure: candidateSummary.roleClosure && baselineSummary.roleClosure
  };
}

function summarizeCondition(runs) {
  return {
    runs: runs.length,
    coreCoverage: round(mean(runs.map((item) => item.core.coverage))),
    routeFocus: round(mean(runs.map((item) => item.routeFocus))),
    auxiliaryCoverage: round(mean(runs.map((item) => item.auxiliary.coverage))),
    roleClosure: runs.length > 0 && runs.every((item) => item.roleClosure),
    routeFileCount: round(mean(runs.map((item) => item.routeFileCount))),
    contextTokens: round(mean(runs.map((item) => item.contextTokens))),
    deterministic: deterministic(runs)
  };
}

function deterministic(runs) {
  if (runs.length < 2) return false;
  const first = runs[0];
  return runs.slice(1).every((item) => (
    item.decision === first.decision
    && item.mode === first.mode
    && canonicalJson(item.routeFiles) === canonicalJson(first.routeFiles)
  ));
}

function measureLayer(files = [], routeFiles = []) {
  const expected = unique(files.map(pathKey));
  const route = new Set(routeFiles.map(pathKey));
  const matchedFiles = expected.filter((file) => route.has(file));
  const missedFiles = expected.filter((file) => !route.has(file));
  return {
    files: expected,
    matchedFiles,
    missedFiles,
    coverage: expected.length ? round(matchedFiles.length / expected.length) : 1
  };
}

function parseTrackedPollution(status = "") {
  return status
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => {
      const file = pathKey(line.slice(3).trim());
      return file !== ".palace" && !file.startsWith(".palace/");
    });
}

function appendSource(values, item) {
  if (typeof item === "string") values.push(item);
  else if (typeof item?.sourcePath === "string") values.push(item.sourcePath);
}

function stripLocation(value) {
  return String(value)
    .replace(/#L\d+(?:-L?\d+)?$/i, "")
    .replace(/:\d+(?:-\d+)?$/, "");
}

function pathKey(value) {
  return String(value).replaceAll("\\", "/").replace(/^\.\//, "").trim();
}

function unique(values) {
  return [...new Set(values)];
}

function finiteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function mean(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function round(value) {
  return Math.round((value + Number.EPSILON) * 1_000_000) / 1_000_000;
}
