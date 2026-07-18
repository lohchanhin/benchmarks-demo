import { randomBytes } from "node:crypto";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { booleanFlag, stringFlag } from "../lib/args.mjs";
import { pathExists, readJson, writeJson } from "../lib/files.mjs";
import { repositoryRoot } from "../lib/root.mjs";
import { pilotScenarioIds } from "../lib/scenario.mjs";
import { prepareCommand } from "./prepare.mjs";
import { orderedArms, runCommand } from "./run.mjs";

export async function studyCommand(flags) {
  const planPath = path.resolve(stringFlag(flags, "plan", path.join(repositoryRoot, "results", "pilot", "plan.json")));
  const execute = booleanFlag(flags, "execute");
  if (!(await pathExists(planPath))) {
    throw new Error(`Study plan does not exist: ${planPath}. Commit a reviewed plan before execution.`);
  }
  const plan = await readJson(planPath);
  validateStudyPlan(plan);
  console.log(`Study plan: ${plan.id} (${plan.trials.length} trials, ${plan.trials.length * 3} arm runs)`);
  if (!execute) {
    console.log("Plan validated. Pass --execute to begin or resume the preregistered runs.");
    return { plan, executed: false };
  }

  const resultsManifestPath = path.resolve(
    stringFlag(flags, "manifest", path.join(repositoryRoot, "results", "manifest.json"))
  );
  const runsRoot = path.resolve(stringFlag(flags, "runs-root", path.join(repositoryRoot, ".benchmark-runs")));
  const limit = positiveIntegerOrInfinity(stringFlag(flags, "limit", undefined), "--limit");
  const results = await readJson(resultsManifestPath);
  const fixedExecution = {
    model: fixedFlag(flags, "model", plan.execution.model),
    reasoningEffort: fixedFlag(flags, "reasoning-effort", plan.execution.reasoningEffort),
    cooldownMs: fixedFlag(flags, "cooldown-ms", String(plan.execution.cooldownMs)),
    timeoutMs: fixedFlag(flags, "timeout-ms", String(plan.execution.timeoutMs))
  };
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

export function validateStudyPlan(plan) {
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
