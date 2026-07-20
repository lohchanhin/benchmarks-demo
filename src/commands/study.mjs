import { randomBytes } from "node:crypto";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { booleanFlag, stringFlag } from "../lib/args.mjs";
import { pathExists, readJson, writeJson } from "../lib/files.mjs";
import { assertFrozenProtocolGitState } from "../lib/git.mjs";
import { repositoryRoot } from "../lib/root.mjs";
import {
  controlFirstScenarioIds,
  decisionMemoryOwnerCandidates,
  pilotScenarioIds,
  scenarioVariantKeyCommitment,
  scenarioVariantKeyEnvironment,
  seededDecisionMemoryStratum,
  seededTenantOwnerVariantId
} from "../lib/scenario.mjs";
import { prepareCommand } from "./prepare.mjs";
import { benchmarkExecutionEnvironment, orderedArms, runCommand } from "./run.mjs";

export const adaptiveWilliamsOrders = Object.freeze([
  ["control", "route-only", "adaptive-palace", "full-palace"],
  ["route-only", "full-palace", "control", "adaptive-palace"],
  ["full-palace", "adaptive-palace", "route-only", "control"],
  ["adaptive-palace", "control", "full-palace", "route-only"]
]);

const adaptiveProtocols = Object.freeze({
  "2.0.0": {
    tag: "protocol-v2.0.0",
    palaceVersion: "0.2.0",
    resultDirectory: "adaptive-pilot",
    studyId: "vertex-palace-adaptive-four-scenario-pilot-v2",
    trialLabel: "adaptive-pilot",
    retired: true
  },
  "2.1.0": {
    tag: "protocol-v2.1.0",
    palaceVersion: "0.2.1",
    resultDirectory: "adaptive-pilot-v2.1",
    studyId: "vertex-palace-adaptive-four-scenario-pilot-v2-1",
    trialLabel: "adaptive-v2-1-pilot",
    retired: true
  },
  "2.2.0": {
    tag: "protocol-v2.2.0",
    palaceVersion: "0.2.1",
    resultDirectory: "adaptive-pilot-v2.2",
    studyId: "vertex-palace-adaptive-four-scenario-pilot-v2-2",
    trialLabel: "adaptive-v2-2-pilot",
    executionEnvironment: {
      platform: "win32",
      sandboxProfile: "workspace-write/windows-elevated",
      lastMessageTransport: "workspace-local-then-artifacts-v1"
    }
  },
  "3.0.0": {
    tag: "protocol-v3.0.0",
    palaceVersion: "0.3.0",
    palaceSourceCommit: "a29053f5952131887ff057a8fa7e6777ab045e1f",
    palaceReleaseCommit: "1331d9da0aa242549026d70e7c752638c3169044",
    palacePackageShasum: "9a04440d7e95c4d34e68e1b7e2cd3f6ecd62e83e",
    palacePackageIntegrity: "sha512-DXALXKH1k/Gj7PoprNDmz/tHlYum2T7QsU32el76mHy/U3u42zY02cshm5P8lwY6yqzkIoZ6h9/6df0QOlJp4Q==",
    resultDirectory: "control-first-v3",
    studyId: "vertex-palace-control-first-four-scenario-pilot-v3",
    trialLabel: "control-first-v3-pilot",
    scenarioIds: controlFirstScenarioIds,
    primaryComparison: "adaptive-vs-control",
    primaryEfficiencyMetric: "reportedTokens",
    comparisonOrder: [
      "adaptive-vs-control",
      "adaptive-vs-full",
      "route-only-vs-control",
      "full-vs-route-only"
    ],
    scenarioVariantPolicy: {
      "decision-memory-dependent": {
        id: seededTenantOwnerVariantId,
        selection: "sha256-seed-stratum+hmac-sha256-secret-permutation",
        candidates: [...decisionMemoryOwnerCandidates],
        requiredCoverage: "all-strata",
        blindingKeyEnvironment: scenarioVariantKeyEnvironment,
        blindingKeyCommitmentAlgorithm: "sha256",
        revealPolicy: "publish-key-after-study-lock"
      }
    },
    planSchemaVersion: 6,
    executionEnvironment: {
      platform: "win32",
      sandboxProfile: "workspace-write/windows-elevated",
      lastMessageTransport: "workspace-local-then-artifacts-v1"
    }
  }
});

export async function studyCommand(flags) {
  const planPath = path.resolve(stringFlag(flags, "plan", path.join(repositoryRoot, "results", "pilot", "plan.json")));
  const execute = booleanFlag(flags, "execute");
  if (!(await pathExists(planPath))) {
    throw new Error(`Study plan does not exist: ${planPath}. Commit a reviewed plan before execution.`);
  }
  const plan = await readJson(planPath);
  validateStudyPlan(plan);
  const armRuns = plan.trials.reduce((sum, trial) => sum + trial.order.length, 0);
  console.log(`Study plan: ${plan.id} (${plan.trials.length} trials, ${armRuns} arm runs)`);
  if (!execute) {
    console.log("Plan validated. Pass --execute to begin or resume the preregistered runs.");
    return { plan, executed: false };
  }
  const adaptiveProtocol = adaptiveProtocols[plan.protocolVersion];
  if (adaptiveProtocol?.retired) {
    throw new Error(
      `Protocol ${plan.protocolVersion} is retired and cannot execute new trials; use the frozen successor plan`
    );
  }
  const defaultManifest = adaptiveProtocol
    ? path.join(repositoryRoot, "results", adaptiveProtocol.resultDirectory, "manifest.json")
    : path.join(repositoryRoot, "results", "manifest.json");
  const resultsManifestPath = path.resolve(stringFlag(flags, "manifest", defaultManifest));
  const runsRoot = path.resolve(stringFlag(flags, "runs-root", path.join(repositoryRoot, ".benchmark-runs")));
  const limit = positiveIntegerOrInfinity(stringFlag(flags, "limit", undefined), "--limit");
  const results = await readJson(resultsManifestPath);
  await validatePalacePackageLock(plan);
  await assertFrozenProtocolGitState(plan, repositoryRoot, {
    resume: Array.isArray(results.trials) && results.trials.length > 0
  });
  validateScenarioVariantKey(plan);
  const fixedExecution = {
    model: fixedFlag(flags, "model", plan.execution.model),
    reasoningEffort: fixedFlag(flags, "reasoning-effort", plan.execution.reasoningEffort),
    cooldownMs: fixedFlag(flags, "cooldown-ms", String(plan.execution.cooldownMs)),
    timeoutMs: fixedFlag(flags, "timeout-ms", String(plan.execution.timeoutMs))
  };
  assertCurrentExecutionEnvironment(plan);
  let attempted = 0;

  for (const trial of plan.trials) {
    if (attempted >= limit) break;
    const existing = (results.trials ?? []).find((entry) => entry.trialId === trial.trialId);
    if (existing?.status === "completed") {
      console.log(`Skipping completed trial ${trial.trialId}`);
      continue;
    }
    attempted += 1;
    const runDirectory = path.join(runsRoot, trial.trialId);
    let error = null;
    try {
      if (!(await pathExists(runDirectory))) {
        await prepareCommand(new Map([
          ["scenario", trial.scenario],
          ["run-id", trial.trialId],
          ["seed", trial.seed],
          ["runs-root", runsRoot],
          ["protocol-version", plan.protocolVersion],
          ["cache-state", trial.cacheState ?? "warm"],
          ...optionalFlag(flags, "palace-bin")
        ]));
      }
      const reportPath = path.join(runDirectory, "reports", "comparison.json");
      if (!(await pathExists(reportPath))) {
        await runCommand(new Map([
          ["run-dir", runDirectory],
          ["arm", "all"],
          ["order", trial.order.join(",")],
          ["model", fixedExecution.model],
          ["reasoning-effort", fixedExecution.reasoningEffort],
          ["cooldown-ms", fixedExecution.cooldownMs],
          ["timeout-ms", fixedExecution.timeoutMs],
          ["expected-codex-version", plan.execution.codexVersion],
          ["expected-palace-version", plan.execution.palaceVersion],
          ["resume", true],
          ...optionalFlag(flags, "codex-bin")
        ]));
      }
    } catch (caught) {
      error = caught instanceof Error ? caught.message : String(caught);
      console.error(`${trial.trialId}: ${error}`);
    }

    const reportPath = path.join(runDirectory, "reports", "comparison.json");
    const reportExists = await pathExists(reportPath);
    upsertTrial(results, {
      trialId: trial.trialId,
      scenario: trial.scenario,
      seed: trial.seed,
      order: trial.order,
      status: reportExists ? "completed" : "attempted-no-report",
      attemptedAt: new Date().toISOString(),
      runDirectory: toManifestRelative(resultsManifestPath, runDirectory),
      report: reportExists ? toManifestRelative(resultsManifestPath, reportPath) : null,
      error
    });
    results.status = allPlannedTrialsComplete(results, plan) ? "pilot-complete" : "pilot-in-progress";
    await mkdir(path.dirname(resultsManifestPath), { recursive: true });
    await writeJson(resultsManifestPath, results);
  }

  return { plan, executed: true, attempted };
}

export function buildPilotPlan(options = {}) {
  const seedsPerScenario = Number(options.seedsPerScenario ?? 5);
  if (!Number.isInteger(seedsPerScenario) || seedsPerScenario <= 0) {
    throw new Error("seedsPerScenario must be a positive integer");
  }
  const trials = [];
  for (const scenario of options.scenarios ?? pilotScenarioIds) {
    const usedOrders = new Set();
    for (let index = 1; index <= seedsPerScenario; index += 1) {
      let seed;
      let order;
      do {
        seed = randomBytes(16).toString("hex");
        order = orderedArms("all", "seeded", seed);
      } while (usedOrders.has(order.join(",")) && usedOrders.size < 6);
      usedOrders.add(order.join(","));
      trials.push({
        trialId: `${scenario}-pilot-${String(index).padStart(2, "0")}`,
        scenario,
        seed,
        order
      });
    }
  }
  return {
    schemaVersion: 1,
    protocolVersion: "1.0.0",
    protocolTag: "protocol-v1.0.0",
    id: "vertex-palace-four-scenario-pilot-v1",
    createdAt: new Date().toISOString(),
    frozen: false,
    execution: {
      model: "gpt-5.6-sol",
      reasoningEffort: "xhigh",
      codexVersion: "codex-cli 0.145.0-alpha.18",
      timeoutMs: 600000,
      cooldownMs: 15000,
      palaceVersion: "0.1.6"
    },
    trials
  };
}

export function buildAdaptivePilotPlan(options = {}) {
  const protocolVersion = options.protocolVersion ?? "2.2.0";
  const protocol = adaptiveProtocols[protocolVersion];
  if (!protocol) throw new Error(`Unsupported adaptive protocol: ${protocolVersion}`);
  const trials = [];
  const scenarios = options.scenarios ?? protocol.scenarioIds ?? pilotScenarioIds;
  for (const [scenarioIndex, scenario] of scenarios.entries()) {
    const scenarioSeeds = generateScenarioSeeds(scenario, protocol);
    for (let index = 0; index < adaptiveWilliamsOrders.length; index += 1) {
      const orderIndex = (index + scenarioIndex) % adaptiveWilliamsOrders.length;
      trials.push({
        trialId: `${scenario}-${protocol.trialLabel}-${String(index + 1).padStart(2, "0")}`,
        scenario,
        seed: scenarioSeeds[index],
        order: [...adaptiveWilliamsOrders[orderIndex]],
        cacheState: index % 2 === 0 ? "warm" : "cold"
      });
    }
  }
  return {
    schemaVersion: protocol.planSchemaVersion ?? (protocol.executionEnvironment ? 3 : 2),
    protocolVersion,
    protocolTag: protocol.tag,
    id: protocol.studyId,
    createdAt: new Date().toISOString(),
    frozen: false,
    ...(protocol.primaryComparison
      ? {
          primaryComparison: protocol.primaryComparison,
          primaryEfficiencyMetric: protocol.primaryEfficiencyMetric,
          comparisonOrder: protocol.comparisonOrder
        }
      : {}),
    ...(protocol.scenarioVariantPolicy
      ? { scenarioVariantPolicy: buildScenarioVariantPolicy(protocol, options.variantKey) }
      : {}),
    execution: {
      model: "gpt-5.6-sol",
      reasoningEffort: "xhigh",
      codexVersion: options.codexVersion ?? "codex-cli 0.145.0-alpha.18",
      timeoutMs: 600000,
      cooldownMs: 15000,
      palaceVersion: protocol.palaceVersion,
      ...(protocol.palaceSourceCommit ? { palaceSourceCommit: protocol.palaceSourceCommit } : {}),
      ...(protocol.palaceReleaseCommit ? { palaceReleaseCommit: protocol.palaceReleaseCommit } : {}),
      ...(protocol.palacePackageShasum ? { palacePackageShasum: protocol.palacePackageShasum } : {}),
      ...(protocol.palacePackageIntegrity ? { palacePackageIntegrity: protocol.palacePackageIntegrity } : {}),
      ...(protocol.executionEnvironment ?? {})
    },
    trials
  };
}

export function validateStudyPlan(plan) {
  if (adaptiveProtocols[plan.protocolVersion]) {
    return validateAdaptiveStudyPlan(plan, adaptiveProtocols[plan.protocolVersion]);
  }
  return validateLegacyStudyPlan(plan);
}

function validateLegacyStudyPlan(plan) {
  if (plan.protocolVersion !== "1.0.0" || plan.protocolTag !== "protocol-v1.0.0") {
    throw new Error("Study plan does not match frozen protocol 1.0.0");
  }
  if (!Array.isArray(plan.trials) || !plan.trials.length) throw new Error("Study plan has no trials");
  if (plan.frozen !== true) throw new Error("Study plan must be frozen before execution");
  if (plan.trials.length !== pilotScenarioIds.length * 5) {
    throw new Error("Frozen pilot plan must contain five trials per preregistered scenario");
  }
  if (plan.execution?.model !== "gpt-5.6-sol"
      || plan.execution?.reasoningEffort !== "xhigh"
      || plan.execution?.codexVersion !== "codex-cli 0.145.0-alpha.18"
      || plan.execution?.timeoutMs !== 600000
      || plan.execution?.cooldownMs !== 15000
      || plan.execution?.palaceVersion !== "0.1.6") {
    throw new Error("Study execution settings do not match protocol 1.0.0");
  }
  const ids = new Set();
  for (const trial of plan.trials) {
    if (ids.has(trial.trialId)) throw new Error(`Duplicate trial id: ${trial.trialId}`);
    ids.add(trial.trialId);
    if (!pilotScenarioIds.includes(trial.scenario)) throw new Error(`Unregistered scenario: ${trial.scenario}`);
    if (typeof trial.seed !== "string" || !trial.seed) throw new Error(`Missing seed: ${trial.trialId}`);
    const arms = new Set(trial.order);
    if (arms.size !== 3 || !["control", "route-only", "full-palace"].every((arm) => arms.has(arm))) {
      throw new Error(`Invalid arm order: ${trial.trialId}`);
    }
    const derived = orderedArms("all", "seeded", trial.seed);
    if (derived.join(",") !== trial.order.join(",")) {
      throw new Error(`Arm order is not derived from seed: ${trial.trialId}`);
    }
  }
  for (const scenario of pilotScenarioIds) {
    const trials = plan.trials.filter((trial) => trial.scenario === scenario);
    if (trials.length !== 5 || new Set(trials.map((trial) => trial.order.join(","))).size !== 5) {
      throw new Error(`Scenario ${scenario} must have five trials with five distinct arm orders`);
    }
  }
  return true;
}

function validateAdaptiveStudyPlan(plan, protocol) {
  if (plan.protocolTag !== protocol.tag) {
    throw new Error(`Adaptive study plan does not match frozen protocol ${plan.protocolVersion}`);
  }
  if (!Array.isArray(plan.trials) || !plan.trials.length) throw new Error("Study plan has no trials");
  if (plan.frozen !== true) throw new Error("Study plan must be frozen before execution");
  const scenarioIds = protocol.scenarioIds ?? pilotScenarioIds;
  if (plan.trials.length !== scenarioIds.length * adaptiveWilliamsOrders.length) {
    throw new Error("Adaptive pilot must contain four trials per preregistered scenario");
  }
  if (plan.execution?.model !== "gpt-5.6-sol"
      || plan.execution?.reasoningEffort !== "xhigh"
      || typeof plan.execution?.codexVersion !== "string"
      || !plan.execution.codexVersion
      || plan.execution?.timeoutMs !== 600000
      || plan.execution?.cooldownMs !== 15000
      || plan.execution?.palaceVersion !== protocol.palaceVersion) {
    throw new Error(`Study execution settings do not match protocol ${plan.protocolVersion}`);
  }
  for (const key of [
    "palaceSourceCommit",
    "palaceReleaseCommit",
    "palacePackageShasum",
    "palacePackageIntegrity"
  ]) {
    if (protocol[key] && plan.execution?.[key] !== protocol[key]) {
      throw new Error(`Study ${key} does not match protocol ${plan.protocolVersion}`);
    }
  }
  if (protocol.primaryComparison && (
    plan.primaryComparison !== protocol.primaryComparison
    || plan.primaryEfficiencyMetric !== protocol.primaryEfficiencyMetric
    || JSON.stringify(plan.comparisonOrder) !== JSON.stringify(protocol.comparisonOrder)
  )) {
    throw new Error(`Study comparison hierarchy does not match protocol ${plan.protocolVersion}`);
  }
  validateScenarioVariantPolicy(plan, protocol);
  if (protocol.executionEnvironment) {
    for (const [key, expected] of Object.entries(protocol.executionEnvironment)) {
      if (plan.execution?.[key] !== expected) {
        throw new Error(`Study ${key} does not match protocol ${plan.protocolVersion}`);
      }
    }
  }

  const ids = new Set();
  const seeds = new Set();
  const cacheByOrder = new Map(
    adaptiveWilliamsOrders.map((order) => [order.join(","), { warm: 0, cold: 0 }])
  );
  for (const trial of plan.trials) {
    if (ids.has(trial.trialId)) throw new Error(`Duplicate trial id: ${trial.trialId}`);
    ids.add(trial.trialId);
    if (!scenarioIds.includes(trial.scenario)) throw new Error(`Unregistered scenario: ${trial.scenario}`);
    if (!trial.trialId.startsWith(`${trial.scenario}-${protocol.trialLabel}-`)) {
      throw new Error(`Trial id does not match protocol ${plan.protocolVersion}: ${trial.trialId}`);
    }
    if (typeof trial.seed !== "string" || !trial.seed) throw new Error(`Missing seed: ${trial.trialId}`);
    if (seeds.has(trial.seed)) throw new Error(`Duplicate adaptive fixture seed: ${trial.seed}`);
    seeds.add(trial.seed);
    if (!["warm", "cold"].includes(trial.cacheState)) throw new Error(`Invalid cache state: ${trial.trialId}`);
    const arms = new Set(trial.order);
    if (arms.size !== 4 || !["control", "route-only", "full-palace", "adaptive-palace"].every((arm) => arms.has(arm))) {
      throw new Error(`Invalid adaptive arm order: ${trial.trialId}`);
    }
    const orderKey = trial.order.join(",");
    if (!adaptiveWilliamsOrders.some((order) => order.join(",") === orderKey)) {
      throw new Error(`Arm order is not a preregistered Williams sequence: ${trial.trialId}`);
    }
    cacheByOrder.get(orderKey)[trial.cacheState] += 1;
  }

  for (const scenario of scenarioIds) {
    const trials = plan.trials.filter((trial) => trial.scenario === scenario);
    if (trials.length !== 4) throw new Error(`Scenario ${scenario} must have four adaptive trials`);
    if (new Set(trials.map((trial) => trial.order.join(","))).size !== 4) {
      throw new Error(`Scenario ${scenario} must use all four Williams orders exactly once`);
    }
    if (trials.filter((trial) => trial.cacheState === "warm").length !== 2
        || trials.filter((trial) => trial.cacheState === "cold").length !== 2) {
      throw new Error(`Scenario ${scenario} must balance warm and cold Palace indexes`);
    }
    for (let position = 0; position < 4; position += 1) {
      if (new Set(trials.map((trial) => trial.order[position])).size !== 4) {
        throw new Error(`Scenario ${scenario} does not balance arm position ${position + 1}`);
      }
    }
    const variantPolicy = protocol.scenarioVariantPolicy?.[scenario];
    if (variantPolicy?.requiredCoverage === "all-strata") {
      const strata = new Set(trials.map((trial) => seededDecisionMemoryStratum(trial.seed)));
      if (strata.size !== variantPolicy.candidates.length) {
        throw new Error(`Scenario ${scenario} must cover every blinded owner stratum`);
      }
    }
  }
  for (const [order, counts] of cacheByOrder) {
    if (counts.warm !== 2 || counts.cold !== 2) {
      throw new Error(`Williams order ${order} must occur twice warm and twice cold across scenarios`);
    }
  }
  return true;
}

function generateScenarioSeeds(scenario, protocol) {
  const count = adaptiveWilliamsOrders.length;
  const policy = protocol.scenarioVariantPolicy?.[scenario];
  for (let attempt = 0; attempt < 1000; attempt += 1) {
    const seeds = Array.from({ length: count }, () => randomBytes(16).toString("hex"));
    if (policy?.requiredCoverage !== "all-strata") return seeds;
    const strata = new Set(seeds.map(seededDecisionMemoryStratum));
    if (strata.size === policy.candidates.length) return seeds;
  }
  throw new Error(`Could not generate complete scenario owner strata for ${scenario}`);
}

function buildScenarioVariantPolicy(protocol, variantKey) {
  return Object.fromEntries(Object.entries(protocol.scenarioVariantPolicy).map(([scenario, policy]) => [
    scenario,
    {
      ...policy,
      blindingKeyCommitment: variantKey ? scenarioVariantKeyCommitment(variantKey) : null
    }
  ]));
}

function validateScenarioVariantPolicy(plan, protocol) {
  if (!protocol.scenarioVariantPolicy) return;
  for (const [scenario, expected] of Object.entries(protocol.scenarioVariantPolicy)) {
    const actual = plan.scenarioVariantPolicy?.[scenario];
    if (!actual) throw new Error(`Study scenario variant policy is missing ${scenario}`);
    for (const [key, value] of Object.entries(expected)) {
      if (JSON.stringify(actual[key]) !== JSON.stringify(value)) {
        throw new Error(`Study scenario variant policy does not match protocol ${plan.protocolVersion}`);
      }
    }
    if (!/^[a-f0-9]{64}$/.test(actual.blindingKeyCommitment ?? "")) {
      throw new Error(`Study scenario variant policy for ${scenario} needs a committed blinding key`);
    }
  }
}

export function validateScenarioVariantKey(plan, explicitKey) {
  for (const [scenario, policy] of Object.entries(plan.scenarioVariantPolicy ?? {})) {
    const key = explicitKey ?? process.env[policy.blindingKeyEnvironment];
    if (scenarioVariantKeyCommitment(key) !== policy.blindingKeyCommitment) {
      throw new Error(`Scenario blinding key does not match the preregistered commitment for ${scenario}`);
    }
  }
  return true;
}

export async function validatePalacePackageLock(plan, root = repositoryRoot) {
  const expectedVersion = plan.execution?.palaceVersion;
  const expectedIntegrity = plan.execution?.palacePackageIntegrity;
  if (!expectedIntegrity) return true;

  const [packageJson, packageLock, installedPackage] = await Promise.all([
    readJson(path.join(root, "package.json")),
    readJson(path.join(root, "package-lock.json")),
    readJson(path.join(root, "node_modules", "vertex-palace", "package.json"))
  ]);
  const rootLock = packageLock.packages?.[""];
  const lockedPackage = packageLock.packages?.["node_modules/vertex-palace"];
  const expectedTarballSuffix = `/vertex-palace-${expectedVersion}.tgz`;

  if (packageJson.dependencies?.["vertex-palace"] !== expectedVersion
      || rootLock?.dependencies?.["vertex-palace"] !== expectedVersion
      || lockedPackage?.version !== expectedVersion
      || installedPackage.version !== expectedVersion) {
    throw new Error(`Installed Vertex Palace does not match frozen version ${expectedVersion}`);
  }
  if (lockedPackage.integrity !== expectedIntegrity) {
    throw new Error("Vertex Palace package-lock integrity does not match the frozen protocol");
  }
  if (typeof lockedPackage.resolved !== "string" || !lockedPackage.resolved.endsWith(expectedTarballSuffix)) {
    throw new Error("Vertex Palace package-lock tarball does not match the frozen protocol");
  }
  return true;
}

function upsertTrial(results, value) {
  results.trials ??= [];
  const index = results.trials.findIndex((entry) => entry.trialId === value.trialId);
  if (index === -1) results.trials.push(value);
  else results.trials[index] = { ...results.trials[index], ...value };
}

function allPlannedTrialsComplete(results, plan) {
  return plan.trials.every((trial) => (
    results.trials?.some((entry) => entry.trialId === trial.trialId && entry.status === "completed")
  ));
}

function toManifestRelative(manifestPath, target) {
  return path.relative(path.dirname(manifestPath), target).replaceAll("\\", "/");
}

function optionalFlag(flags, name) {
  const value = flags.get(name);
  return value === undefined ? [] : [[name, value]];
}

function positiveIntegerOrInfinity(value, name) {
  if (value === undefined) return Number.POSITIVE_INFINITY;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) throw new Error(`${name} must be a positive integer`);
  return parsed;
}

function fixedFlag(flags, name, expected) {
  const value = stringFlag(flags, name, String(expected));
  if (value !== String(expected)) {
    throw new Error(`--${name} is frozen at ${expected} by the committed study plan`);
  }
  return value;
}

function assertCurrentExecutionEnvironment(plan) {
  if (!plan.execution?.platform) return;
  const actual = benchmarkExecutionEnvironment();
  for (const key of ["platform", "sandboxProfile", "lastMessageTransport"]) {
    if (actual[key] !== plan.execution[key]) {
      throw new Error(
        `Current ${key} ${actual[key]} does not match frozen study value ${plan.execution[key]}`
      );
    }
  }
}
