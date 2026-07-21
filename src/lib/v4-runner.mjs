import path from "node:path";
import { V4_PROTOCOL_VERSION, sha256Canonical } from "./v4-protocol.mjs";

export const V4_RESULTS_SCHEMA_VERSION = 1;

export function createV4ResultsManifest({ binding, plan, bindingCommit, createdAt }) {
  validateFrozenBinding(binding);
  validateFrozenPlan(plan);
  requireSha1(bindingCommit, "V4 execution binding commit");
  requireIsoTimestamp(createdAt, "V4 results createdAt");
  const plannedTrials = plan.execution?.plannedTrials ?? plan.trials.length;
  const plannedArmRuns = plan.execution?.plannedArmRuns ?? plannedTrials * 2;
  if (plan.trials.length !== plannedTrials || plannedArmRuns !== plannedTrials * 2) {
    throw new Error("V4 results plan must contain exactly two arms per planned trial");
  }
  return {
    schemaVersion: V4_RESULTS_SCHEMA_VERSION,
    protocolVersion: V4_PROTOCOL_VERSION,
    status: "formal-ready",
    formal: true,
    createdAt,
    executionBindingCommit: bindingCommit,
    executionBindingSha256: sha256Canonical(binding),
    frozenPlanSha256: sha256Canonical(plan),
    plannedTrials,
    plannedArmRuns,
    completedTrials: 0,
    completedArmRuns: 0,
    infrastructureFailures: 0,
    mappingRevealed: false,
    trials: plan.trials.map((trial) => ({
      trialId: trial.trialId,
      fixtureId: trial.fixtureId,
      taskType: trial.taskType,
      replicate: trial.replicate,
      cacheState: trial.cacheState,
      blindedOrder: [...trial.blindedOrder],
      status: "planned",
      completedArmRuns: 0
    })),
    attempts: [],
    arms: []
  };
}

export function validateV4ResumeManifest(manifest, { binding, plan }) {
  requireObject(manifest, "V4 results manifest");
  validateFrozenBinding(binding);
  validateFrozenPlan(plan);
  if (manifest.schemaVersion !== V4_RESULTS_SCHEMA_VERSION
      || manifest.protocolVersion !== V4_PROTOCOL_VERSION
      || manifest.formal !== true) {
    throw new Error("V4 resume manifest identity mismatch");
  }
  if (manifest.executionBindingSha256 !== sha256Canonical(binding)) {
    throw new Error("V4 resume execution binding changed");
  }
  if (manifest.frozenPlanSha256 !== sha256Canonical(plan)) {
    throw new Error("V4 resume frozen plan changed");
  }
  if (!Array.isArray(manifest.trials)
      || !Array.isArray(manifest.arms)
      || !Array.isArray(manifest.attempts)) {
    throw new Error("V4 resume manifest collections are invalid");
  }
  const expectedTrials = plan.trials.map((trial) => ({
    trialId: trial.trialId,
    fixtureId: trial.fixtureId,
    taskType: trial.taskType,
    replicate: trial.replicate,
    cacheState: trial.cacheState,
    blindedOrder: trial.blindedOrder
  }));
  const actualTrials = manifest.trials.map((trial) => ({
    trialId: trial.trialId,
    fixtureId: trial.fixtureId,
    taskType: trial.taskType,
    replicate: trial.replicate,
    cacheState: trial.cacheState,
    blindedOrder: trial.blindedOrder
  }));
  if (sha256Canonical(actualTrials) !== sha256Canonical(expectedTrials)) {
    throw new Error("V4 resume trial schedule changed");
  }
  if (new Set(manifest.arms.map((arm) => arm.armId)).size !== manifest.arms.length) {
    throw new Error("V4 resume manifest contains duplicate completed arms");
  }
  if (manifest.completedArmRuns !== manifest.arms.length) {
    throw new Error("V4 resume completed-arm count mismatch");
  }
  return true;
}

export function completeV4Arm(manifest, armRecord) {
  requireObject(manifest, "V4 results manifest");
  requireObject(armRecord, "V4 completed arm");
  requireString(armRecord.armId, "V4 arm id");
  requireString(armRecord.trialId, "V4 trial id");
  if (!["arm-a", "arm-b"].includes(armRecord.blindedLabel)) {
    throw new Error("V4 completed arm requires a blinded arm-a/arm-b label");
  }
  if (armRecord.status !== "completed") throw new Error("V4 arm must be completed before publication");
  requireSha256(armRecord.evidenceSha256, "V4 public evidence hash");
  requireIsoTimestamp(armRecord.completedAt, "V4 arm completedAt");
  if (manifest.arms.some((arm) => arm.armId === armRecord.armId)) {
    throw new Error(`Completed V4 arm ${armRecord.armId} is immutable`);
  }
  const trial = manifest.trials.find((entry) => entry.trialId === armRecord.trialId);
  if (!trial) throw new Error(`Unknown V4 trial: ${armRecord.trialId}`);
  if (!trial.blindedOrder.includes(armRecord.blindedLabel)) {
    throw new Error(`V4 arm ${armRecord.blindedLabel} is not scheduled for ${armRecord.trialId}`);
  }
  if (!Number.isInteger(armRecord.sequence) || armRecord.sequence < 1 || armRecord.sequence > 2) {
    throw new Error("V4 arm sequence must be 1 or 2");
  }

  const next = structuredClone(manifest);
  const nextTrial = next.trials.find((entry) => entry.trialId === armRecord.trialId);
  next.arms.push(structuredClone(armRecord));
  next.completedArmRuns = next.arms.length;
  nextTrial.completedArmRuns = next.arms.filter((arm) => arm.trialId === armRecord.trialId).length;
  nextTrial.status = nextTrial.completedArmRuns === 2 ? "completed" : "in-progress";
  next.completedTrials = next.trials.filter((entry) => entry.status === "completed").length;
  next.status = next.completedArmRuns === next.plannedArmRuns ? "formal-complete-awaiting-reveal" : "formal-in-progress";
  return next;
}

export function buildV4ArmPrompt({ fixture, treatment, verificationProfile }) {
  requireObject(fixture, "V4 fixture");
  requireString(fixture.prompt, "V4 fixture prompt");
  requireObject(fixture.issue, "V4 fixture issue");
  if (!["control", "adaptive-palace"].includes(treatment)) {
    throw new Error("V4 treatment must be control or adaptive-palace");
  }
  const verification = fixture.verification?.commands;
  if (!Array.isArray(verification) || verification.length === 0) {
    throw new Error("V4 fixture requires verification commands");
  }
  const treatmentInstruction = treatment === "control"
    ? "Do not invoke Vertex Palace, palace, memory-palace tools, or any prebuilt repository index. Inspect the repository normally."
    : [
        "Before broad repository inspection, run this exact command once:",
        `palace context ${JSON.stringify(fixture.prompt)} --auto`,
        "Use the returned mode and bounded context contract. Current code and tests outrank memory.",
        "After implementation and tests, run palace evaluate for the same task with every changed file."
      ].join("\n");
  const verificationLines = verification.map((command) => {
    const bound = verificationProfile?.find((entry) => entry.command === command);
    if (bound?.policy?.kind === "preflight-invalid") {
      return `- ${command} (preflight-invalid: ${bound.policy.reason}; do not run this absent path)`;
    }
    if (bound?.policy?.kind === "baseline-delta") {
      const baseline = bound.policy.baseline;
      return `- ${command} (compare with frozen baseline: ${baseline.errors} errors, ${baseline.warnings} warnings; add no diagnostics)`;
    }
    return `- ${command}`;
  });
  return [
    "You are executing one isolated arm of a preregistered repository benchmark.",
    "Network access is disabled. Work only inside the current frozen checkout.",
    "Do not inspect parent directories, benchmark harness files, private evaluator data, or other arm workspaces.",
    "Do not change dependency manifests, lockfiles, CI configuration, or unrelated files unless the task explicitly requires it.",
    "",
    "Task:",
    fixture.prompt,
    "",
    `Issue: ${fixture.issue.title}`,
    `Public reference: ${fixture.issue.url}`,
    "",
    "Treatment procedure:",
    treatmentInstruction,
    "",
    "Required verification:",
    ...verificationLines,
    "",
    "Finish the implementation, run focused verification, inspect the final Git diff, and stop.",
    "In the final response, state what changed and which verification commands passed."
  ].join("\n");
}

export function buildV4ProcessEnvironment({
  treatment,
  inheritedPath,
  palaceBinDirectory,
  forbiddenPalaceDirectories = []
}) {
  if (!["control", "adaptive-palace"].includes(treatment)) {
    throw new Error("V4 treatment must be control or adaptive-palace");
  }
  requireString(inheritedPath, "Inherited PATH");
  requireString(palaceBinDirectory, "Reviewed Palace binary directory");
  const forbidden = new Set(
    [...forbiddenPalaceDirectories, palaceBinDirectory].map((entry) => normalizedDirectory(entry))
  );
  const clean = inheritedPath
    .split(path.delimiter)
    .filter(Boolean)
    .filter((entry) => !forbidden.has(normalizedDirectory(entry)));
  const selected = treatment === "adaptive-palace" ? [palaceBinDirectory, ...clean] : clean;
  return {
    env: {
      PATH: selected.join(path.delimiter),
      Path: selected.join(path.delimiter),
      VERTEX_PALACE_BENCHMARK_ARM: treatment
    },
    unsetEnv: [
      "VERTEX_PALACE_SCENARIO_VARIANT_KEY",
      "PALACE_ROOT",
      "PALACE_TASK",
      "PALACE_ROUTE_ID"
    ]
  };
}

export function sanitizeV4Evidence(source, options = {}) {
  requireObject(source, "V4 raw evidence");
  const metrics = sanitizeMetrics(source.metrics ?? {});
  const clean = (value) => sanitizeV4Text(value, options);
  return {
    schemaVersion: 1,
    protocolVersion: V4_PROTOCOL_VERSION,
    armId: requireString(source.armId, "V4 evidence arm id"),
    trialId: requireString(source.trialId, "V4 evidence trial id"),
    blindedLabel: requireBlindedLabel(source.blindedLabel),
    metrics,
    changedFiles: normalizeFileList(source.changedFiles ?? []),
    verification: Array.isArray(source.verification)
      ? source.verification.map((entry) => ({
          command: clean(entry.command),
          policy: clean(entry.policy),
          valid: entry.valid !== false,
          passed: entry.passed === null ? null : entry.passed === true,
          exitCode: Number.isInteger(entry.exitCode) ? entry.exitCode : undefined,
          durationMs: Number.isFinite(entry.durationMs) ? Math.round(entry.durationMs) : undefined,
          reason: entry.reason ? clean(entry.reason) : undefined,
          baselineCompared: typeof entry.baselineCompared === "boolean" ? entry.baselineCompared : undefined,
          delta: sanitizeCountObject(entry.delta),
          observed: sanitizeCountObject(entry.observed)
        }))
      : [],
    git: source.git ? {
      diffCheckPassed: source.git.diffCheckPassed === true,
      numstat: Array.isArray(source.git.numstat)
        ? source.git.numstat.map((entry) => ({
            file: clean(entry.file),
            added: entry.added,
            deleted: entry.deleted
          }))
        : []
    } : undefined,
    execution: source.execution ? {
      exitCode: source.execution.exitCode,
      timedOut: source.execution.timedOut === true,
      durationMs: source.execution.durationMs,
      infrastructureFailure: source.execution.infrastructureFailure === true
    } : undefined
  };
}

export function sanitizeV4Text(value, options = {}) {
  let result = String(value ?? "");
  for (const root of options.privateRoots ?? []) {
    if (!root) continue;
    result = result.replace(new RegExp(escapeRegExp(String(root).replaceAll("\\", "/")), "gi"), "[PRIVATE_ROOT]");
    result = result.replace(new RegExp(escapeRegExp(String(root).replaceAll("/", "\\\\")), "gi"), "[PRIVATE_ROOT]");
  }
  result = result.replace(
    /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi,
    "[REDACTED_SESSION_ID]"
  );
  return result;
}

function sanitizeMetrics(source) {
  const allowed = [
    "success",
    "correctnessPassed",
    "exactScopePassed",
    "forbiddenViolation",
    "diffCheckPassed",
    "executionPassed",
    "reportedTokens",
    "inputTokens",
    "outputTokens",
    "cachedInputTokens",
    "toolCalls",
    "failedCalls",
    "wallTimeMs"
  ];
  return Object.fromEntries(
    allowed
      .filter((key) => ["boolean", "number"].includes(typeof source[key]))
      .map((key) => [key, source[key]])
  );
}

function sanitizeCountObject(source) {
  if (!source || typeof source !== "object" || Array.isArray(source)) return undefined;
  const result = {};
  for (const key of ["errors", "warnings", "files"]) {
    if (Number.isInteger(source[key])) result[key] = source[key];
  }
  return Object.keys(result).length ? result : undefined;
}

function validateFrozenBinding(binding) {
  requireObject(binding, "Frozen V4 execution binding");
  if (binding.protocolVersion !== V4_PROTOCOL_VERSION
      || binding.frozen !== true
      || binding.humanReviewApproved !== true
      || binding.executionAllowed !== true
      || binding.formalAgentArmsRun !== 0
      || binding.freezeAudit?.passed !== true) {
    throw new Error("V4 results require a frozen reviewed execution binding with zero formal arms");
  }
}

function validateFrozenPlan(plan) {
  requireObject(plan, "Frozen V4 plan");
  if (plan.protocolVersion !== V4_PROTOCOL_VERSION
      || plan.frozen !== true
      || plan.humanReviewApproved !== true
      || plan.executionAllowed !== true
      || plan.execution?.formalAgentTrialsRun !== 0
      || !Array.isArray(plan.trials)) {
    throw new Error("V4 results require the frozen reviewed study plan with zero formal trials");
  }
}

function normalizeFileList(value) {
  if (!Array.isArray(value)) throw new Error("V4 changed files must be an array");
  return [...new Set(value.map((entry) => requireString(entry, "V4 changed file").replaceAll("\\", "/")))].sort();
}

function normalizedDirectory(value) {
  return path.resolve(String(value)).replaceAll("\\", "/").replace(/\/$/, "").toLowerCase();
}

function requireBlindedLabel(value) {
  if (!["arm-a", "arm-b"].includes(value)) throw new Error("V4 evidence requires a blinded label");
  return value;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function requireObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value;
}

function requireString(value, label, minimumLength = 1) {
  if (typeof value !== "string" || value.trim().length < minimumLength) {
    throw new Error(`${label} must be a non-empty string`);
  }
  return value;
}

function requireIsoTimestamp(value, label) {
  const result = requireString(value, label);
  if (Number.isNaN(Date.parse(result)) || !result.endsWith("Z")) {
    throw new Error(`${label} must be an ISO-8601 UTC timestamp`);
  }
  return result;
}

function requireSha1(value, label) {
  if (typeof value !== "string" || !/^[a-f0-9]{40}$/.test(value)) {
    throw new Error(`${label} must be a lowercase 40-character digest`);
  }
  return value;
}

function requireSha256(value, label) {
  if (typeof value !== "string" || !/^[a-f0-9]{64}$/.test(value)) {
    throw new Error(`${label} must be a lowercase SHA-256 digest`);
  }
  return value;
}
