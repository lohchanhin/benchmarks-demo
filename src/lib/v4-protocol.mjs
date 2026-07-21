import { createHash } from "node:crypto";

export const V4_PROTOCOL_VERSION = "4.0.0-candidate.1";
export const V4_PROTOCOL_TAG = "protocol-v4.0.0-candidate.1";
export const V4_SCHEMA_VERSION = 7;
export const V4_TASK_TYPES = Object.freeze([
  "simple-local",
  "cross-stack",
  "decision-memory-dependent",
  "stale-memory"
]);
export const V4_HIERARCHICAL_WIN = Object.freeze([
  "success",
  "exact-scope",
  "reported-tokens",
  "wall-time"
]);
export const V4_REVIEW_DECLARATION =
  "I reviewed the fixtures, hidden oracle commitment, blinding commitment, and frozen statistical analysis plan before any formal Agent trial.";

const hiddenOracleKeys = new Set([
  "correctnessCriteria",
  "exactChangedFiles",
  "expectedChangePolicy",
  "expectedFiles",
  "forbiddenFiles",
  "referenceResolution"
]);

export function validateV4FixtureManifest(manifest) {
  requireObject(manifest, "Fixture manifest");
  if (manifest.schemaVersion !== 1) throw new Error("V4 fixture manifest must use schema version 1");
  if (manifest.protocolVersion !== V4_PROTOCOL_VERSION) {
    throw new Error(`V4 fixture manifest must target ${V4_PROTOCOL_VERSION}`);
  }
  if (!Array.isArray(manifest.fixtures) || manifest.fixtures.length !== V4_TASK_TYPES.length) {
    throw new Error("V4 fixture manifest must contain exactly four candidate fixtures");
  }
  assertNoHiddenOracleFields(manifest);

  const ids = new Set();
  const taskTypes = new Set();
  const languages = new Set();
  for (const fixture of manifest.fixtures) {
    requireObject(fixture, "Fixture");
    requireString(fixture.id, "Fixture id");
    if (ids.has(fixture.id)) throw new Error(`Duplicate v4 fixture id: ${fixture.id}`);
    ids.add(fixture.id);
    if (!V4_TASK_TYPES.includes(fixture.taskType)) {
      throw new Error(`Unsupported v4 task type: ${fixture.taskType}`);
    }
    if (taskTypes.has(fixture.taskType)) {
      throw new Error(`Duplicate v4 task type: ${fixture.taskType}`);
    }
    taskTypes.add(fixture.taskType);
    if (!Array.isArray(fixture.languages) || fixture.languages.length === 0) {
      throw new Error(`Fixture ${fixture.id} must declare at least one language`);
    }
    for (const language of fixture.languages) {
      if (!['TypeScript', 'Python'].includes(language)) {
        throw new Error(`Fixture ${fixture.id} uses unsupported language: ${language}`);
      }
      languages.add(language);
    }
    validateRepository(fixture.repository, fixture.id);
    validateIssue(fixture.issue, fixture.repository.url, fixture.id);
    requireString(fixture.prompt, `Fixture ${fixture.id} prompt`, 24);
    if (!Array.isArray(fixture.verification?.commands) || fixture.verification.commands.length === 0) {
      throw new Error(`Fixture ${fixture.id} must declare real verification commands`);
    }
    fixture.verification.commands.forEach((command) => requireString(
      command,
      `Fixture ${fixture.id} verification command`
    ));
    if (!Array.isArray(fixture.historySources)) {
      throw new Error(`Fixture ${fixture.id} must declare historySources`);
    }
    for (const source of fixture.historySources) {
      requireString(source?.kind, `Fixture ${fixture.id} history source kind`);
      requireGithubUrl(source?.url, `Fixture ${fixture.id} history source URL`);
    }
    if (["decision-memory-dependent", "stale-memory"].includes(fixture.taskType)
        && fixture.historySources.length === 0) {
      throw new Error(`Fixture ${fixture.id} requires historical decision provenance`);
    }
  }

  if (!V4_TASK_TYPES.every((taskType) => taskTypes.has(taskType))) {
    throw new Error("V4 fixtures do not cover every preregistered task type");
  }
  if (!languages.has("TypeScript") || !languages.has("Python")) {
    throw new Error("V4 fixtures must cover TypeScript and Python");
  }
  return structuredClone(manifest);
}

export function buildV4DraftPlan(options) {
  const fixtureManifest = validateV4FixtureManifest(options?.fixtureManifest);
  const seed = requireString(options?.seed, "V4 seed");
  const generatedAt = requireIsoTimestamp(options?.generatedAt, "V4 generatedAt");
  validateOptionalCommitment(options?.privateOracleCommitment, "Private oracle commitment");
  validateOptionalCommitment(options?.blindingKeyCommitment, "Blinding key commitment");

  return {
    schemaVersion: V4_SCHEMA_VERSION,
    id: "vertex-palace-real-repository-v4",
    protocolVersion: V4_PROTOCOL_VERSION,
    protocolTag: V4_PROTOCOL_TAG,
    status: "candidate-awaiting-human-review",
    generatedAt,
    seed,
    frozen: false,
    humanReviewApproved: false,
    executionAllowed: false,
    fixtureManifest: {
      path: "protocol/v4/fixtures.candidates.json",
      sha256: sha256Canonical(fixtureManifest),
      fixtureIds: fixtureManifest.fixtures.map((fixture) => fixture.id)
    },
    comparison: {
      primary: ["adaptive-palace", "control"],
      unit: "paired isolated Agent sessions at the same frozen repository commit",
      order: "balanced blinded AB/BA within each fixture",
      networkAccess: "disabled during Agent execution"
    },
    statistics: {
      frozenBeforeExecution: false,
      primaryQuestion:
        "Does Adaptive Palace reduce incorrect changed-file scope while preserving correctness and controlling cost on real repository tasks?",
      primaryMetrics: [
        "correctness",
        "forbidden_scope",
        "cost_per_successful_solution",
        "success_weighted_reported_tokens",
        "retry_adjusted_cost"
      ],
      hierarchicalWin: [...V4_HIERARCHICAL_WIN],
      secondaryMetrics: ["reported_tokens", "tool_calls", "wall_time"],
      intervalMethod: "paired stratified bootstrap",
      bootstrapIterations: 10000,
      confidenceLevel: 0.95,
      missingnessRule: "Infrastructure failures are reported and never converted into task failures.",
      exclusionRule: "No outcome-dependent exclusions are permitted after freeze.",
      multiplicity: "Secondary metrics are descriptive and must not be promoted to primary claims."
    },
    oracle: {
      visibility: "external-evaluator-only",
      commitmentAlgorithm: "sha256-canonical-json-v1",
      commitment: options?.privateOracleCommitment ?? null,
      deliveredToAgent: false
    },
    blinding: {
      labels: ["arm-a", "arm-b"],
      mappingVisibility: "external-evaluator-only",
      keyCommitmentAlgorithm: "sha256-domain-separated-hex-key-v1",
      keyCommitment: options?.blindingKeyCommitment ?? null,
      mappingRevealed: false
    },
    review: {
      required: true,
      receiptPath: "protocol/v4/review.receipt.json",
      receiptSha256: null
    },
    execution: {
      formalAgentTrialsRun: 0,
      plannedTrials: fixtureManifest.fixtures.length * 4,
      plannedArmRuns: fixtureManifest.fixtures.length * 4 * 2,
      resultsManifestPath: "results/real-repository-v4/manifest.json",
      runnerAvailable: false
    },
    trials: buildBalancedTrials(fixtureManifest, seed)
  };
}

export function commitV4PrivateOracle(privateOracle) {
  validateV4PrivateOracle(privateOracle);
  return sha256Canonical(privateOracle);
}

export function commitV4BlindingKey(key) {
  if (typeof key !== "string" || !/^[a-f0-9]{64}$/.test(key)) {
    throw new Error("V4 blinding key must be 32 bytes encoded as lowercase hexadecimal");
  }
  return sha256Text(`vertex-palace-v4-arm-key\0${key}`);
}

export function buildV4ReviewReceipt({ plan, fixtureManifest, reviewer, reviewedAt, approved }) {
  validateV4DraftPlan(plan, fixtureManifest);
  requireString(reviewer, "V4 reviewer", 3);
  requireIsoTimestamp(reviewedAt, "V4 review timestamp");
  return {
    schemaVersion: 1,
    protocolVersion: V4_PROTOCOL_VERSION,
    approved: approved === true,
    reviewer,
    reviewedAt,
    declaration: V4_REVIEW_DECLARATION,
    planSha256: sha256Canonical(plan),
    fixtureManifestSha256: sha256Canonical(fixtureManifest),
    privateOracleCommitment: plan.oracle.commitment,
    blindingKeyCommitment: plan.blinding.keyCommitment
  };
}

export function evaluateV4FreezeGate({
  plan,
  fixtureManifest,
  privateOracle,
  blindingKey,
  reviewReceipt,
  executionManifest
}) {
  const checks = [];
  addCheck(checks, "protocol-candidate", "Protocol candidate is structurally valid", () => {
    validateV4DraftPlan(plan, fixtureManifest);
  });
  addCheck(checks, "fixture-manifest", "Four real-repository fixture candidates are valid", () => {
    validateV4FixtureManifest(fixtureManifest);
  });
  addCheck(checks, "fixture-commitment", "Fixture manifest matches the plan commitment", () => {
    assertEqual(plan?.fixtureManifest?.sha256, sha256Canonical(fixtureManifest), "Fixture commitment mismatch");
  });
  addCheck(checks, "statistics-preregistered", "Primary statistics are specified before execution", () => {
    assertEqual(plan?.statistics?.frozenBeforeExecution, false, "Candidate statistics must remain unfrozen");
    assertDeepEqual(plan?.statistics?.hierarchicalWin, V4_HIERARCHICAL_WIN, "Hierarchical win order mismatch");
    for (const metric of [
      "cost_per_successful_solution",
      "success_weighted_reported_tokens",
      "retry_adjusted_cost"
    ]) {
      if (!plan?.statistics?.primaryMetrics?.includes(metric)) throw new Error(`Missing primary metric: ${metric}`);
    }
  });
  addCheck(checks, "public-plan-clean", "Public plan contains no hidden oracle answers or outcomes", () => {
    assertNoHiddenOracleFields(plan);
    assertNoFormalOutcomeFields(plan);
  });

  if (privateOracle === undefined) {
    addBlocked(checks, "private-oracle", "Private oracle was not supplied to the evaluator");
    addBlocked(checks, "private-oracle-commitment", "Private oracle commitment cannot be verified");
  } else {
    addCheck(checks, "private-oracle", "External private oracle covers every fixture", () => {
      validateV4PrivateOracle(privateOracle, fixtureManifest);
    });
    addCheck(checks, "private-oracle-commitment", "Private oracle matches its public commitment", () => {
      assertEqual(commitV4PrivateOracle(privateOracle), plan?.oracle?.commitment, "Private oracle commitment mismatch");
    });
  }

  if (blindingKey === undefined) {
    addBlocked(checks, "blinding-key", "Private arm mapping key was not supplied to the evaluator");
    addBlocked(checks, "blinding-key-commitment", "Blinding key commitment cannot be verified");
  } else {
    addCheck(checks, "blinding-key", "Private arm mapping key is valid", () => {
      commitV4BlindingKey(blindingKey);
    });
    addCheck(checks, "blinding-key-commitment", "Private arm key matches its public commitment", () => {
      assertEqual(commitV4BlindingKey(blindingKey), plan?.blinding?.keyCommitment, "Blinding key commitment mismatch");
    });
  }

  if (reviewReceipt === undefined) {
    addBlocked(checks, "human-review", "Human review receipt is missing");
  } else {
    addCheck(checks, "human-review", "Human review approves the exact candidate", () => {
      validateV4ReviewReceipt(reviewReceipt, plan, fixtureManifest);
    });
  }

  addCheck(checks, "formal-trials-empty", "No formal v4 Agent trial has run before freeze", () => {
    requireObject(executionManifest, "V4 execution manifest");
    assertEqual(executionManifest.protocolVersion, V4_PROTOCOL_VERSION, "Execution manifest protocol mismatch");
    if (!Array.isArray(executionManifest.trials) || executionManifest.trials.length !== 0) {
      throw new Error("Formal v4 execution manifest must remain empty before freeze");
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
      blocked: checks.filter((check) => check.status === "blocked").length,
      failed: checks.filter((check) => check.status === "failed").length
    },
    checks
  };
}

export function freezeV4Plan({
  plan,
  fixtureManifest,
  privateOracle,
  blindingKey,
  reviewReceipt,
  executionManifest,
  frozenAt
}) {
  const gate = evaluateV4FreezeGate({
    plan,
    fixtureManifest,
    privateOracle,
    blindingKey,
    reviewReceipt,
    executionManifest
  });
  if (!gate.passed) {
    const reasons = gate.checks
      .filter((check) => check.status !== "passed")
      .map((check) => `${check.id}: ${check.detail}`)
      .join("; ");
    throw new Error(`V4 plan cannot be frozen: ${reasons}`);
  }
  const timestamp = requireIsoTimestamp(frozenAt, "V4 frozenAt");
  const frozen = structuredClone(plan);
  frozen.status = "frozen-human-reviewed";
  frozen.frozen = true;
  frozen.humanReviewApproved = true;
  frozen.executionAllowed = true;
  frozen.frozenAt = timestamp;
  frozen.statistics.frozenBeforeExecution = true;
  frozen.review.receiptSha256 = sha256Canonical(reviewReceipt);
  frozen.execution.runnerAvailable = false;
  frozen.freezeAudit = {
    passed: true,
    checks: gate.summary.checks,
    fixtureManifestSha256: frozen.fixtureManifest.sha256,
    privateOracleCommitment: frozen.oracle.commitment,
    blindingKeyCommitment: frozen.blinding.keyCommitment,
    reviewReceiptSha256: frozen.review.receiptSha256
  };
  return frozen;
}

export function assertV4ExecutionAllowed(plan, gateReport) {
  if (plan?.frozen !== true
      || plan?.humanReviewApproved !== true
      || plan?.executionAllowed !== true
      || plan?.statistics?.frozenBeforeExecution !== true
      || plan?.freezeAudit?.passed !== true
      || gateReport?.passed !== true) {
    throw new Error("V4 formal Agent execution requires a human-reviewed and frozen plan with a passing gate");
  }
  return true;
}

export function sha256Canonical(value) {
  return sha256Text(canonicalJson(value));
}

function validateV4DraftPlan(plan, fixtureManifest) {
  requireObject(plan, "V4 plan");
  if (plan.schemaVersion !== V4_SCHEMA_VERSION
      || plan.protocolVersion !== V4_PROTOCOL_VERSION
      || plan.protocolTag !== V4_PROTOCOL_TAG) {
    throw new Error("V4 plan protocol identity mismatch");
  }
  if (plan.frozen !== false || plan.humanReviewApproved !== false || plan.executionAllowed !== false) {
    throw new Error("V4 candidate must remain unfrozen, unapproved, and non-executable");
  }
  const validatedFixtures = validateV4FixtureManifest(fixtureManifest);
  assertEqual(plan.fixtureManifest?.sha256, sha256Canonical(validatedFixtures), "Fixture commitment mismatch");
  validateOptionalCommitment(plan.oracle?.commitment, "Private oracle commitment");
  validateOptionalCommitment(plan.blinding?.keyCommitment, "Blinding key commitment");
  if (!Array.isArray(plan.trials) || plan.trials.length !== validatedFixtures.fixtures.length * 4) {
    throw new Error("V4 candidate must contain four balanced trials per fixture");
  }
  if (plan.execution?.formalAgentTrialsRun !== 0 || plan.execution?.runnerAvailable !== false) {
    throw new Error("V4 candidate must have zero formal trials and no runner");
  }
  assertDeepEqual(plan.comparison?.primary, ["adaptive-palace", "control"], "Primary comparison mismatch");
  assertDeepEqual(plan.statistics?.hierarchicalWin, V4_HIERARCHICAL_WIN, "Hierarchical win order mismatch");
  assertNoFormalOutcomeFields(plan);
  return plan;
}

function validateV4PrivateOracle(privateOracle, fixtureManifest) {
  requireObject(privateOracle, "V4 private oracle");
  if (privateOracle.schemaVersion !== 1 || privateOracle.protocolVersion !== V4_PROTOCOL_VERSION) {
    throw new Error("V4 private oracle protocol identity mismatch");
  }
  if (!Array.isArray(privateOracle.fixtures) || privateOracle.fixtures.length === 0) {
    throw new Error("V4 private oracle must contain fixture answers");
  }
  const ids = new Set();
  for (const fixture of privateOracle.fixtures) {
    requireString(fixture.fixtureId, "Private oracle fixture id");
    if (ids.has(fixture.fixtureId)) throw new Error(`Duplicate private oracle fixture: ${fixture.fixtureId}`);
    ids.add(fixture.fixtureId);
    requireGithubUrl(fixture.referenceResolution?.url, `Private oracle ${fixture.fixtureId} resolution URL`);
    if (!/^[a-f0-9]{40}$/.test(fixture.referenceResolution?.commit ?? "")) {
      throw new Error(`Private oracle ${fixture.fixtureId} requires a 40-character resolution commit`);
    }
    if (!Array.isArray(fixture.correctnessCriteria) || fixture.correctnessCriteria.length === 0) {
      throw new Error(`Private oracle ${fixture.fixtureId} requires correctness criteria`);
    }
    fixture.correctnessCriteria.forEach((criterion) => requireString(
      criterion,
      `Private oracle ${fixture.fixtureId} criterion`
    ));
    if (!Array.isArray(fixture.exactChangedFiles) || !Array.isArray(fixture.forbiddenFiles)) {
      throw new Error(`Private oracle ${fixture.fixtureId} requires exact and forbidden file scopes`);
    }
    if (!['exact-files', 'no-code-change'].includes(fixture.expectedChangePolicy)) {
      throw new Error(`Private oracle ${fixture.fixtureId} has an invalid change policy`);
    }
    if (fixture.expectedChangePolicy === "exact-files" && fixture.exactChangedFiles.length === 0) {
      throw new Error(`Private oracle ${fixture.fixtureId} requires at least one exact changed file`);
    }
    if (fixture.expectedChangePolicy === "no-code-change" && fixture.exactChangedFiles.length !== 0) {
      throw new Error(`Private oracle ${fixture.fixtureId} must not expect changed files`);
    }
  }
  if (fixtureManifest) {
    const expectedIds = validateV4FixtureManifest(fixtureManifest).fixtures.map((fixture) => fixture.id).sort();
    assertDeepEqual([...ids].sort(), expectedIds, "Private oracle fixture coverage mismatch");
  }
  return privateOracle;
}

function validateV4ReviewReceipt(receipt, plan, fixtureManifest) {
  requireObject(receipt, "V4 human review receipt");
  if (receipt.schemaVersion !== 1 || receipt.protocolVersion !== V4_PROTOCOL_VERSION) {
    throw new Error("V4 review receipt protocol identity mismatch");
  }
  if (receipt.approved !== true) throw new Error("V4 review receipt is not approved");
  requireString(receipt.reviewer, "V4 reviewer", 3);
  requireIsoTimestamp(receipt.reviewedAt, "V4 review timestamp");
  assertEqual(receipt.declaration, V4_REVIEW_DECLARATION, "V4 review declaration mismatch");
  assertEqual(receipt.planSha256, sha256Canonical(plan), "V4 review plan hash mismatch");
  assertEqual(
    receipt.fixtureManifestSha256,
    sha256Canonical(fixtureManifest),
    "V4 review fixture hash mismatch"
  );
  assertEqual(
    receipt.privateOracleCommitment,
    plan.oracle.commitment,
    "V4 review oracle commitment mismatch"
  );
  assertEqual(
    receipt.blindingKeyCommitment,
    plan.blinding.keyCommitment,
    "V4 review blinding commitment mismatch"
  );
}

function buildBalancedTrials(fixtureManifest, seed) {
  return fixtureManifest.fixtures.flatMap((fixture) => {
    const startsWithA = Number.parseInt(sha256Text(`${seed}\0${fixture.id}`).slice(0, 2), 16) % 2 === 0;
    return Array.from({ length: 4 }, (_, index) => {
      const aFirst = index % 2 === 0 ? startsWithA : !startsWithA;
      return {
        trialId: `${fixture.id}-v4-${String(index + 1).padStart(2, "0")}`,
        fixtureId: fixture.id,
        taskType: fixture.taskType,
        replicate: index + 1,
        cacheState: index < 2 ? "cold" : "warm",
        blindedOrder: aFirst ? ["arm-a", "arm-b"] : ["arm-b", "arm-a"],
        status: "planned"
      };
    });
  });
}

function validateRepository(repository, fixtureId) {
  requireObject(repository, `Fixture ${fixtureId} repository`);
  requireGithubUrl(repository.url, `Fixture ${fixtureId} repository URL`);
  if (!/^[a-f0-9]{40}$/.test(repository.frozenCommit ?? "")) {
    throw new Error(`Fixture ${fixtureId} requires a 40-character frozen commit`);
  }
}

function validateIssue(issue, repositoryUrl, fixtureId) {
  requireObject(issue, `Fixture ${fixtureId} issue`);
  requireGithubUrl(issue.url, `Fixture ${fixtureId} issue URL`);
  requireString(issue.title, `Fixture ${fixtureId} issue title`);
  const repositoryPrefix = repositoryUrl.replace(/\.git$/, "");
  if (!issue.url.startsWith(`${repositoryPrefix}/issues/`)
      && !issue.url.startsWith(`${repositoryPrefix}/pull/`)) {
    throw new Error(`Fixture ${fixtureId} issue or PR must belong to the frozen repository`);
  }
}

function assertNoHiddenOracleFields(value, path = "root") {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => assertNoHiddenOracleFields(entry, `${path}[${index}]`));
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, entry] of Object.entries(value)) {
    if (hiddenOracleKeys.has(key)) throw new Error(`Public artifact leaks hidden oracle field at ${path}.${key}`);
    assertNoHiddenOracleFields(entry, `${path}.${key}`);
  }
}

function assertNoFormalOutcomeFields(value, path = "root") {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => assertNoFormalOutcomeFields(entry, `${path}[${index}]`));
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, entry] of Object.entries(value)) {
    if (["outcome", "score", "correctnessResult", "agentResult"].includes(key)) {
      throw new Error(`Pre-freeze artifact contains formal outcome at ${path}.${key}`);
    }
    assertNoFormalOutcomeFields(entry, `${path}.${key}`);
  }
}

function canonicalJson(value) {
  return JSON.stringify(canonicalize(value));
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value).sort().map((key) => [key, canonicalize(value[key])])
    );
  }
  if (typeof value === "number" && !Number.isFinite(value)) {
    throw new Error("Canonical JSON does not support non-finite numbers");
  }
  if (["undefined", "function", "symbol", "bigint"].includes(typeof value)) {
    throw new Error(`Canonical JSON does not support ${typeof value}`);
  }
  return value;
}

function sha256Text(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function addCheck(checks, id, description, assertion) {
  try {
    assertion();
    checks.push({ id, description, status: "passed", detail: "passed" });
  } catch (error) {
    checks.push({ id, description, status: "failed", detail: String(error?.message ?? error) });
  }
}

function addBlocked(checks, id, detail) {
  checks.push({ id, description: detail, status: "blocked", detail });
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) throw new Error(message);
}

function assertDeepEqual(actual, expected, message) {
  if (canonicalJson(actual) !== canonicalJson(expected)) throw new Error(message);
}

function validateOptionalCommitment(value, label) {
  if (value !== null && value !== undefined && !/^[a-f0-9]{64}$/.test(value)) {
    throw new Error(`${label} must be null or a lowercase SHA-256 digest`);
  }
}

function requireGithubUrl(value, label) {
  const result = requireString(value, label);
  if (!/^https:\/\/github\.com\/[^/]+\/[^/]+(?:\/|$)/.test(result)) {
    throw new Error(`${label} must be a GitHub URL`);
  }
  return result;
}

function requireIsoTimestamp(value, label) {
  const result = requireString(value, label);
  if (Number.isNaN(Date.parse(result)) || !result.endsWith("Z")) {
    throw new Error(`${label} must be an ISO-8601 UTC timestamp`);
  }
  return result;
}

function requireString(value, label, minimumLength = 1) {
  if (typeof value !== "string" || value.trim().length < minimumLength) {
    throw new Error(`${label} must be a non-empty string`);
  }
  return value;
}

function requireObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value;
}
