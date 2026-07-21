import { createHash, createHmac } from "node:crypto";
import { mkdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { runProcess } from "./process.mjs";
import {
  V4_PROTOCOL_VERSION,
  commitV4BlindingKey,
  commitV4PrivateOracle,
  sha256Canonical
} from "./v4-protocol.mjs";

export const V4_EXECUTION_BINDING_VERSION = 2;
export const V4_EXECUTION_REVIEW_DECLARATION =
  "I reviewed the exact v4 execution binding, product artifact, runner commit, network isolation, and empty result state before any formal Agent arm.";

export function resolveV4BlindedOrder(trial, blindingKey) {
  requireObject(trial, "V4 trial");
  const labels = trial.blindedOrder;
  if (!Array.isArray(labels)
      || labels.length !== 2
      || new Set(labels).size !== 2
      || !labels.includes("arm-a")
      || !labels.includes("arm-b")) {
    throw new Error("V4 trial must contain a blinded arm-a/arm-b order");
  }
  commitV4BlindingKey(blindingKey);
  const digest = createHmac("sha256", Buffer.from(blindingKey, "hex"))
    .update("vertex-palace-v4-global-arm-map", "utf8")
    .digest();
  const aIsPalace = digest[0] % 2 === 0;
  const mapping = aIsPalace
    ? { "arm-a": "adaptive-palace", "arm-b": "control" }
    : { "arm-a": "control", "arm-b": "adaptive-palace" };
  return labels.map((label) => mapping[label]);
}

export function buildV4ExecutionCandidate(options) {
  requireObject(options, "V4 execution options");
  const frozenPlan = requireObject(options.frozenPlan, "Frozen v4 plan");
  const studyReviewReceipt = requireObject(options.studyReviewReceipt, "V4 study review receipt");
  const product = validateProduct(options.product);
  const agent = requireObject(options.agent, "V4 Agent settings");
  const executionProfile = validateExecutionProfile(options.executionProfile);
  requireSha1(options.runnerSourceCommit, "V4 runner source commit");
  requireSha256(options.runnerSourceSha256, "V4 runner source hash");
  requireIsoTimestamp(options.generatedAt, "V4 execution generatedAt");

  if (frozenPlan.protocolVersion !== V4_PROTOCOL_VERSION
      || frozenPlan.frozen !== true
      || frozenPlan.humanReviewApproved !== true
      || frozenPlan.executionAllowed !== true
      || frozenPlan.statistics?.frozenBeforeExecution !== true
      || frozenPlan.execution?.formalAgentTrialsRun !== 0) {
    throw new Error("V4 execution binding requires the frozen, reviewed study plan with zero formal trials");
  }
  if (studyReviewReceipt.approved !== true) {
    throw new Error("V4 execution binding requires the approved study review receipt");
  }

  return {
    schemaVersion: V4_EXECUTION_BINDING_VERSION,
    protocolVersion: V4_PROTOCOL_VERSION,
    status: "candidate-awaiting-execution-review",
    generatedAt: options.generatedAt,
    frozen: false,
    humanReviewApproved: false,
    executionAllowed: false,
    formalAgentArmsRun: 0,
    study: {
      planPath: "protocol/v4/plan.frozen.json",
      planSha256: sha256Canonical(frozenPlan),
      reviewReceiptPath: "protocol/v4/review.receipt.json",
      reviewReceiptSha256: sha256Canonical(studyReviewReceipt),
      fixtureManifestSha256: frozenPlan.fixtureManifest?.sha256 ?? null,
      privateOracleCommitment: frozenPlan.oracle?.commitment ?? null,
      blindingKeyCommitment: frozenPlan.blinding?.keyCommitment ?? null
    },
    runner: {
      repository: "https://github.com/lohchanhin/benchmarks-demo",
      sourceCommit: options.runnerSourceCommit,
      sourceSha256: options.runnerSourceSha256
    },
    product,
    agent: {
      model: requireString(agent.model, "V4 model"),
      reasoningEffort: requireString(agent.reasoningEffort, "V4 reasoning effort"),
      codexVersion: requireString(agent.codexVersion, "V4 Codex version"),
      timeoutMs: requirePositiveInteger(agent.timeoutMs, "V4 Agent timeout"),
      cooldownMs: requireNonNegativeInteger(agent.cooldownMs, "V4 cooldown"),
      approvals: "never",
      sandbox: "workspace-write",
      windowsSandbox: "elevated",
      networkAccess: false,
      ignoreUserConfig: true,
      ignoreRules: true,
      ephemeral: true,
      json: true
    },
    workspace: {
      source: "verified-local-bare-cache",
      checkout: "detached-frozen-commit",
      isolation: "independent-workspace-per-arm",
      cleanBeforeExecution: true,
      dependencyNetworkAccess: "setup-only-before-formal-agent-execution",
      rootPolicy: executionProfile.workspace.rootPolicy,
      lineEndings: executionProfile.workspace.lineEndings,
      dependencyIsolation: executionProfile.workspace.dependencyIsolation
    },
    executionProfile,
    evaluator: {
      oracleVisibility: "external-evaluator-only",
      armMappingVisibility: "external-evaluator-only",
      scoring: "correctness-and-exact-scope-v1",
      sourceSha256: executionProfile.externalEvaluator.sha256
    },
    results: {
      manifestPath: "results/real-repository-v4/manifest.json",
      formalAgentArmsRun: 0
    }
  };
}

export function buildV4ExecutionReviewReceipt({ binding, reviewer, reviewedAt, approved }) {
  validateCandidateBinding(binding);
  requireString(reviewer, "V4 execution reviewer", 3);
  requireIsoTimestamp(reviewedAt, "V4 execution review timestamp");
  return {
    schemaVersion: 1,
    protocolVersion: V4_PROTOCOL_VERSION,
    approved: approved === true,
    reviewer,
    reviewedAt,
    declaration: V4_EXECUTION_REVIEW_DECLARATION,
    bindingSha256: sha256Canonical(binding),
    studyPlanSha256: binding.study.planSha256,
    runnerSourceCommit: binding.runner.sourceCommit,
    runnerSourceSha256: binding.runner.sourceSha256,
    productSourceCommit: binding.product.sourceCommit,
    productTarballSha256: binding.product.tarball.sha256,
    productTarballIntegrity: binding.product.tarball.sha512Integrity,
    executionProfileSha256: sha256Canonical(binding.executionProfile),
    evaluatorSha256: binding.evaluator.sourceSha256,
    networkAccess: binding.agent.networkAccess
  };
}

export function evaluateV4ExecutionFreezeGate({
  binding,
  frozenPlan,
  studyReviewReceipt,
  privateOracle,
  blindingKey,
  reviewReceipt,
  resultsManifest,
  actual
}) {
  const checks = [];
  addCheck(checks, "binding-structure", "Execution binding is strict and non-executable", () => {
    validateCandidateBinding(binding);
  });
  addCheck(checks, "study-binding", "Execution binding matches the frozen reviewed study", () => {
    requireObject(frozenPlan, "Frozen v4 plan");
    if (frozenPlan.frozen !== true
        || frozenPlan.humanReviewApproved !== true
        || frozenPlan.executionAllowed !== true
        || frozenPlan.statistics?.frozenBeforeExecution !== true
        || frozenPlan.execution?.formalAgentTrialsRun !== 0) {
      throw new Error("Study plan is not frozen, reviewed, and empty");
    }
    assertEqual(binding.study?.planSha256, sha256Canonical(frozenPlan), "Study plan hash mismatch");
    assertEqual(
      binding.study?.reviewReceiptSha256,
      sha256Canonical(studyReviewReceipt),
      "Study review receipt hash mismatch"
    );
    if (studyReviewReceipt?.approved !== true) throw new Error("Study review receipt is not approved");
  });
  addCheck(checks, "private-oracle", "Private oracle matches the frozen public commitment", () => {
    const commitment = commitV4PrivateOracle(privateOracle);
    assertEqual(commitment, frozenPlan.oracle?.commitment, "Private oracle commitment mismatch");
    assertEqual(commitment, binding.study?.privateOracleCommitment, "Bound oracle commitment mismatch");
  });
  addCheck(checks, "blinding-key", "Private arm key matches the frozen public commitment", () => {
    const commitment = commitV4BlindingKey(blindingKey);
    assertEqual(commitment, frozenPlan.blinding?.keyCommitment, "Blinding key commitment mismatch");
    assertEqual(commitment, binding.study?.blindingKeyCommitment, "Bound blinding commitment mismatch");
  });
  addCheck(checks, "runner-source", "Runner source commit and digest match the reviewed binding", () => {
    requireObject(actual, "Actual v4 execution environment");
    assertEqual(binding.runner?.sourceCommit, actual.runnerSourceCommit, "Runner source commit mismatch");
    assertEqual(binding.runner?.sourceSha256, actual.runnerSourceSha256, "Runner source hash mismatch");
  });
  addCheck(checks, "product-artifact", "Product source and tarball match the reviewed binding", () => {
    assertEqual(binding.product?.sourceCommit, actual.productSourceCommit, "Product source commit mismatch");
    assertEqual(binding.product?.tarball?.sha1, actual.productTarballSha1, "Product tarball SHA-1 mismatch");
    assertEqual(binding.product?.tarball?.sha256, actual.productTarballSha256, "Product tarball SHA-256 mismatch");
    assertEqual(
      binding.product?.tarball?.sha512Integrity,
      actual.productTarballIntegrity,
      "Product tarball integrity mismatch"
    );
  });
  addCheck(checks, "codex-runtime", "Codex and Palace versions match the reviewed binding", () => {
    assertEqual(binding.agent?.codexVersion, actual.codexVersion, "Codex version mismatch");
    assertEqual(binding.product?.packageVersion, actual.palaceVersion, "Palace version mismatch");
  });
  addCheck(checks, "execution-profile", "Runtime, dependency, baseline, and evaluator bindings match", () => {
    assertEqual(
      sha256Canonical(binding.executionProfile),
      actual.executionProfileSha256,
      "Execution profile hash mismatch"
    );
    assertEqual(binding.evaluator?.sourceSha256, actual.evaluatorSha256, "Evaluator source hash mismatch");
  });
  addCheck(checks, "execution-review", "Owner approved the exact execution binding", () => {
    validateExecutionReviewReceipt(reviewReceipt, binding);
  });
  addCheck(checks, "formal-results-empty", "No formal Agent arm ran before execution freeze", () => {
    requireObject(resultsManifest, "V4 results manifest");
    assertEqual(resultsManifest.protocolVersion, V4_PROTOCOL_VERSION, "Results protocol mismatch");
    if (!Array.isArray(resultsManifest.arms) || resultsManifest.arms.length !== 0) {
      throw new Error("V4 results manifest must contain zero formal arms before freeze");
    }
  });

  const passed = checks.every((check) => check.status === "passed");
  return {
    protocolVersion: V4_PROTOCOL_VERSION,
    passed,
    executionAllowed: passed,
    summary: {
      checks: checks.length,
      passed: checks.filter((check) => check.status === "passed").length,
      failed: checks.filter((check) => check.status === "failed").length
    },
    checks
  };
}

export function freezeV4ExecutionBinding({ frozenAt, ...context }) {
  const gate = evaluateV4ExecutionFreezeGate(context);
  if (!gate.passed) {
    const reasons = gate.checks
      .filter((check) => check.status !== "passed")
      .map((check) => `${check.id}: ${check.detail}`)
      .join("; ");
    throw new Error(`V4 execution binding cannot be frozen: ${reasons}`);
  }
  const timestamp = requireIsoTimestamp(frozenAt, "V4 execution frozenAt");
  const frozen = structuredClone(context.binding);
  frozen.status = "frozen-human-reviewed";
  frozen.frozen = true;
  frozen.humanReviewApproved = true;
  frozen.executionAllowed = true;
  frozen.frozenAt = timestamp;
  frozen.executionReviewReceiptSha256 = sha256Canonical(context.reviewReceipt);
  frozen.freezeAudit = {
    passed: true,
    checks: gate.summary.checks,
    studyPlanSha256: frozen.study.planSha256,
    runnerSourceCommit: frozen.runner.sourceCommit,
    runnerSourceSha256: frozen.runner.sourceSha256,
    productTarballSha256: frozen.product.tarball.sha256,
    productTarballIntegrity: frozen.product.tarball.sha512Integrity,
    executionReviewReceiptSha256: frozen.executionReviewReceiptSha256
  };
  return frozen;
}

export function assertV4FormalExecutionAllowed(binding, gateReport) {
  if (binding?.frozen !== true
      || binding?.humanReviewApproved !== true
      || binding?.executionAllowed !== true
      || binding?.formalAgentArmsRun !== 0
      || binding?.freezeAudit?.passed !== true
      || gateReport?.passed !== true) {
    throw new Error("V4 formal Agent execution requires a human-reviewed frozen execution binding and passing gate");
  }
  return true;
}

export function codexV4Arguments({ workspace, model, reasoningEffort, lastMessagePath }) {
  requireString(workspace, "V4 Codex workspace");
  requireString(model, "V4 Codex model");
  requireString(reasoningEffort, "V4 Codex reasoning effort");
  requireString(lastMessagePath, "V4 Codex last-message path");
  return [
    "--strict-config",
    "-c",
    "sandbox_workspace_write.network_access=false",
    "exec",
    "-a",
    "never",
    "-s",
    "workspace-write",
    "-C",
    workspace,
    "-m",
    model,
    "-c",
    'windows.sandbox="elevated"',
    "-c",
    `model_reasoning_effort="${reasoningEffort}"`,
    "--ignore-user-config",
    "--ignore-rules",
    "--json",
    "--ephemeral",
    "--output-last-message",
    lastMessagePath,
    "-"
  ];
}

export async function materializeV4Workspace({ fixture, armId, cacheRoot, runsRoot }) {
  requireObject(fixture, "V4 fixture");
  const repository = requireObject(fixture.repository, "V4 fixture repository");
  const repositoryUrl = requireString(repository.url, "V4 fixture repository URL");
  requireSha1(repository.frozenCommit, "V4 frozen repository commit");
  requireString(fixture.id, "V4 fixture id");
  requireString(armId, "V4 arm id");
  requireString(cacheRoot, "V4 cache root");
  requireString(runsRoot, "V4 runs root");

  const cache = await prepareV4SourceCache({ fixture, cacheRoot });
  const workspace = path.resolve(runsRoot, safeSegment(armId), "workspace");
  if (await exists(workspace)) throw new Error(`V4 arm workspace already exists: ${workspace}`);
  await mkdir(path.dirname(workspace), { recursive: true });
  await runProcess(
    "git",
    ["-c", "core.autocrlf=false", "clone", "--no-hardlinks", cache, workspace],
    { check: true }
  );
  await runProcess("git", ["-C", workspace, "config", "core.autocrlf", "false"], { check: true });
  await runProcess("git", ["-C", workspace, "checkout", "--detach", repository.frozenCommit], { check: true });

  const head = (await runProcess("git", ["-C", workspace, "rev-parse", "HEAD"], { check: true })).stdout.trim();
  const tree = (await runProcess("git", ["-C", workspace, "rev-parse", "HEAD^{tree}"], { check: true })).stdout.trim();
  const porcelain = (await runProcess("git", ["-C", workspace, "status", "--porcelain=v1"], { check: true })).stdout;
  assertEqual(head, repository.frozenCommit, "Materialized workspace commit mismatch");
  if (porcelain.trim() !== "") throw new Error("Materialized V4 workspace is not clean");
  return {
    armId,
    sourceCache: cache,
    workspace,
    head,
    tree,
    clean: true
  };
}

export async function prepareV4SourceCache({ fixture, cacheRoot }) {
  requireObject(fixture, "V4 fixture");
  const repository = requireObject(fixture.repository, "V4 fixture repository");
  const repositoryUrl = requireString(repository.url, "V4 fixture repository URL");
  requireSha1(repository.frozenCommit, "V4 frozen repository commit");
  requireString(cacheRoot, "V4 cache root");
  const cacheId = createHash("sha256")
    .update(normalizeRepositoryLocation(repositoryUrl), "utf8")
    .digest("hex")
    .slice(0, 20);
  const cache = path.resolve(cacheRoot, `${cacheId}.git`);
  await mkdir(path.dirname(cache), { recursive: true });
  if (!(await exists(cache))) {
    await runProcess("git", ["clone", "--mirror", "--no-hardlinks", repositoryUrl, cache], { check: true });
  } else {
    const remote = (await runProcess(
      "git",
      ["--git-dir", cache, "remote", "get-url", "origin"],
      { check: true }
    )).stdout.trim();
    if (normalizeRepositoryLocation(remote) !== normalizeRepositoryLocation(repositoryUrl)) {
      throw new Error(`V4 source cache origin mismatch for ${fixture.id}`);
    }
  }
  const commitCheck = await runProcess(
    "git",
    ["--git-dir", cache, "cat-file", "-e", `${repository.frozenCommit}^{commit}`]
  );
  if (commitCheck.exitCode !== 0) {
    throw new Error(`Frozen commit ${repository.frozenCommit} is missing from the verified local cache`);
  }
  return cache;
}

export function scoreV4Arm({
  correctnessPassed,
  changedFiles,
  exactChangedFiles,
  forbiddenFiles,
  diffCheckPassed,
  executionPassed
}) {
  const changed = normalizedFileList(changedFiles, "Changed files");
  const expected = normalizedFileList(exactChangedFiles, "Exact changed files");
  const forbidden = normalizedFileList(forbiddenFiles, "Forbidden files");
  const changedSet = new Set(changed);
  const expectedSet = new Set(expected);
  const missingFiles = expected.filter((file) => !changedSet.has(file));
  const extraFiles = changed.filter((file) => !expectedSet.has(file));
  const forbiddenMatches = changed.filter((file) => forbidden.some((pattern) => matchesPathPattern(file, pattern)));
  const exactScopePassed = missingFiles.length === 0 && extraFiles.length === 0;
  const forbiddenViolation = forbiddenMatches.length > 0;
  const success = correctnessPassed === true
    && exactScopePassed
    && !forbiddenViolation
    && diffCheckPassed === true
    && executionPassed === true;
  return {
    success,
    correctnessPassed: correctnessPassed === true,
    exactScopePassed,
    forbiddenViolation,
    diffCheckPassed: diffCheckPassed === true,
    executionPassed: executionPassed === true,
    changedFiles: changed,
    expectedFiles: expected,
    missingFiles,
    extraFiles,
    forbiddenMatches
  };
}

export async function sha256File(filePath) {
  const bytes = await readFile(filePath);
  return createHash("sha256").update(bytes).digest("hex");
}

function validateCandidateBinding(binding) {
  requireObject(binding, "V4 execution binding");
  if (binding.schemaVersion !== V4_EXECUTION_BINDING_VERSION
      || binding.protocolVersion !== V4_PROTOCOL_VERSION) {
    throw new Error("V4 execution binding identity mismatch");
  }
  if (binding.frozen !== false
      || binding.humanReviewApproved !== false
      || binding.executionAllowed !== false
      || binding.formalAgentArmsRun !== 0) {
    throw new Error("V4 execution candidate must remain unapproved, unfrozen, and empty");
  }
  if (binding.agent?.networkAccess !== false
      || binding.agent?.ignoreUserConfig !== true
      || binding.agent?.ignoreRules !== true
      || binding.agent?.ephemeral !== true
      || binding.agent?.json !== true
      || binding.agent?.approvals !== "never"
      || binding.agent?.sandbox !== "workspace-write") {
    throw new Error("V4 Agent settings must fail closed with isolated network-off execution");
  }
  validateProduct(binding.product);
  validateExecutionProfile(binding.executionProfile);
  requireSha1(binding.runner?.sourceCommit, "V4 runner source commit");
  requireSha256(binding.runner?.sourceSha256, "V4 runner source hash");
  requireSha256(binding.evaluator?.sourceSha256, "V4 evaluator source hash");
  assertEqual(
    binding.evaluator.sourceSha256,
    binding.executionProfile.externalEvaluator.sha256,
    "V4 evaluator and execution profile hashes differ"
  );
  return binding;
}

function validateExecutionReviewReceipt(receipt, binding) {
  requireObject(receipt, "V4 execution review receipt");
  if (receipt.schemaVersion !== 1 || receipt.protocolVersion !== V4_PROTOCOL_VERSION) {
    throw new Error("V4 execution review identity mismatch");
  }
  if (receipt.approved !== true) throw new Error("V4 execution review is not approved");
  requireString(receipt.reviewer, "V4 execution reviewer", 3);
  requireIsoTimestamp(receipt.reviewedAt, "V4 execution review timestamp");
  assertEqual(receipt.declaration, V4_EXECUTION_REVIEW_DECLARATION, "Execution review declaration mismatch");
  assertEqual(receipt.bindingSha256, sha256Canonical(binding), "Execution review binding hash mismatch");
  assertEqual(receipt.studyPlanSha256, binding.study?.planSha256, "Execution review plan hash mismatch");
  assertEqual(receipt.runnerSourceCommit, binding.runner?.sourceCommit, "Execution review runner commit mismatch");
  assertEqual(receipt.runnerSourceSha256, binding.runner?.sourceSha256, "Execution review runner hash mismatch");
  assertEqual(receipt.productSourceCommit, binding.product?.sourceCommit, "Execution review product commit mismatch");
  assertEqual(receipt.productTarballSha256, binding.product?.tarball?.sha256, "Execution review tarball hash mismatch");
  assertEqual(
    receipt.productTarballIntegrity,
    binding.product?.tarball?.sha512Integrity,
    "Execution review tarball integrity mismatch"
  );
  assertEqual(
    receipt.executionProfileSha256,
    sha256Canonical(binding.executionProfile),
    "Execution review profile hash mismatch"
  );
  assertEqual(receipt.evaluatorSha256, binding.evaluator?.sourceSha256, "Execution review evaluator hash mismatch");
  assertEqual(receipt.networkAccess, false, "Execution review must approve network-off execution");
}

function validateExecutionProfile(profile) {
  requireObject(profile, "V4 execution profile");
  if (profile.schemaVersion !== 1) throw new Error("V4 execution profile schema mismatch");
  if (profile.workspace?.rootPolicy !== "absolute-ascii-only"
      || profile.workspace?.lineEndings !== "git-core-autocrlf-false") {
    throw new Error("V4 execution profile requires the reviewed Windows workspace policy");
  }
  for (const runtime of ["node", "npm", "pnpm", "python", "uv", "codex"]) {
    requireString(profile.runtimes?.[runtime]?.version, `V4 ${runtime} runtime version`);
  }
  const fixtureIds = [
    "zod-transform-refine-4926",
    "open-webui-analytics-25919",
    "zod-report-input-decision-5509",
    "requests-stream-regression-7432"
  ];
  for (const fixtureId of fixtureIds) {
    const fixture = requireObject(profile.fixtures?.[fixtureId], `V4 profile ${fixtureId}`);
    if (!Array.isArray(fixture.setup) || !Array.isArray(fixture.verification)) {
      throw new Error(`V4 profile ${fixtureId} requires setup and verification arrays`);
    }
  }
  requireSha256(profile.externalEvaluator?.sha256, "V4 private evaluator hash");
  return structuredClone(profile);
}

function validateProduct(product) {
  requireObject(product, "V4 Palace product artifact");
  requireString(product.repository, "V4 Palace repository URL");
  requireSha1(product.sourceCommit, "V4 Palace source commit");
  requireString(product.packageVersion, "V4 Palace package version");
  requireObject(product.tarball, "V4 Palace tarball");
  requireString(product.tarball.filename, "V4 Palace tarball filename");
  requireSha1(product.tarball.sha1, "V4 Palace tarball SHA-1");
  requireSha256(product.tarball.sha256, "V4 Palace tarball SHA-256");
  if (typeof product.tarball.sha512Integrity !== "string"
      || !/^sha512-[A-Za-z0-9+/]+={0,2}$/.test(product.tarball.sha512Integrity)) {
    throw new Error("V4 Palace tarball requires an npm SHA-512 integrity digest");
  }
  return structuredClone(product);
}

function normalizedFileList(value, label) {
  if (!Array.isArray(value)) throw new Error(`${label} must be an array`);
  return [...new Set(value.map((entry) => requireString(entry, `${label} entry`).replaceAll("\\", "/")))].sort();
}

function matchesPathPattern(file, pattern) {
  if (!pattern.includes("*")) return file === pattern;
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
  const regex = escaped.replaceAll("**", "\u0000").replaceAll("*", "[^/]*").replaceAll("\u0000", ".*");
  return new RegExp(`^${regex}$`).test(file);
}

function safeSegment(value) {
  return String(value).replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "v4";
}

function normalizeRepositoryLocation(value) {
  const text = String(value).trim().replaceAll("\\", "/").replace(/\/$/, "");
  if (/^[a-zA-Z]:\//.test(text)) return path.resolve(text).replaceAll("\\", "/").toLowerCase();
  return text.replace(/\.git$/, "");
}

async function exists(value) {
  try {
    await stat(value);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

function addCheck(checks, id, description, assertion) {
  try {
    assertion();
    checks.push({ id, description, status: "passed", detail: "passed" });
  } catch (error) {
    checks.push({ id, description, status: "failed", detail: String(error?.message ?? error) });
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) throw new Error(message);
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

function requirePositiveInteger(value, label) {
  if (!Number.isInteger(value) || value <= 0) throw new Error(`${label} must be a positive integer`);
  return value;
}

function requireNonNegativeInteger(value, label) {
  if (!Number.isInteger(value) || value < 0) throw new Error(`${label} must be a non-negative integer`);
  return value;
}
