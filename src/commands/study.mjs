import { randomBytes } from "node:crypto";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { booleanFlag, stringFlag } from "../lib/args.mjs";
import { pathExists, readJson, writeJson } from "../lib/files.mjs";
import { repositoryRoot } from "../lib/root.mjs";
import { pilotScenarioIds } from "../lib/scenario.mjs";
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
  const scenarios = options.scenarios ?? pilotScenarioIds;
  for (const [scenarioIndex, scenario] of scenarios.entries()) {
    for (let index = 0; index < adaptiveWilliamsOrders.length; index += 1) {
      const orderIndex = (index + scenarioIndex) % adaptiveWilliamsOrders.length;
      trials.push({
        trialId: `${scenario}-${protocol.trialLabel}-${String(index + 1).padStart(2, "0")}`,
        scenario,
        seed: randomBytes(16).toString("hex"),
        order: [...adaptiveWilliamsOrders[orderIndex]],
        cacheState: index % 2 === 0 ? "warm" : "cold"
      });
    }
  }
  return {
    schemaVersion: protocol.executionEnvironment ? 3 : 2,
    protocolVersion,
    protocolTag: protocol.tag,
    id: protocol.studyId,
    createdAt: new Date().toISOString(),
    frozen: false,
    execution: {
      model: "gpt-5.6-sol",
      reasoningEffort: "xhigh",
      codexVersion: options.codexVersion ?? "codex-cli 0.145.0-alpha.18",
      timeoutMs: 600000,
      cooldownMs: 15000,
      palaceVersion: protocol.palaceVersion,
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
  if (plan.trials.length !== pilotScenarioIds.length * adaptiveWilliamsOrders.length) {
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
    if (!pilotScenarioIds.includes(trial.scenario)) throw new Error(`Unregistered scenario: ${trial.scenario}`);
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

  for (const scenario of pilotScenarioIds) {
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
  }
  for (const [order, counts] of cacheByOrder) {
    if (counts.warm !== 2 || counts.cold !== 2) {
      throw new Error(`Williams order ${order} must occur twice warm and twice cold across scenarios`);
    }
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
