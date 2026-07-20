import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { prepareCommand } from "../src/commands/prepare.mjs";
import { runCommand } from "../src/commands/run.mjs";
import { pathExists, readJson, writeJson } from "../src/lib/files.mjs";
import { runProcess } from "../src/lib/process.mjs";
import { repositoryRoot } from "../src/lib/root.mjs";
import {
  controlFirstScenarioIds,
  scenarioVariantKeyCommitment,
  scenarioVariantKeyEnvironment
} from "../src/lib/scenario.mjs";
import { publishRun } from "./publish-run.mjs";

const formalPlanPath = path.join(repositoryRoot, "results", "control-first-v3", "plan.json");
const formalManifestPath = path.join(repositoryRoot, "results", "control-first-v3", "manifest.json");
const candidateRoot = path.join(repositoryRoot, "results", "control-first-v3-candidate");
const candidatePlanPath = path.join(candidateRoot, "plan.json");
const candidateManifestPath = path.join(candidateRoot, "manifest.json");
const runsRoot = path.join(repositoryRoot, ".benchmark-runs");

export function candidateTrialId(formalTrialId) {
  return formalTrialId.replace("control-first-v3-pilot", "control-first-v3-candidate");
}

export function validateCandidatePlan(candidatePlan, formalPlan) {
  assert.equal(candidatePlan.schemaVersion, 1);
  assert.equal(candidatePlan.protocolVersion, "3.0.0");
  assert.equal(candidatePlan.formal, false);
  assert.equal(candidatePlan.nonFormalReason, "prepublication-local-tarball-validation");
  assert.match(candidatePlan.claimBoundary, /non-formal/i);
  assert.equal(candidatePlan.sourcePlan.path, "results/control-first-v3/plan.json");
  assert.equal(candidatePlan.sourcePlan.protocolTag, formalPlan.protocolTag);
  assert.match(candidatePlan.sourcePlan.sha256, /^[a-f0-9]{64}$/);
  assert.equal(candidatePlan.primaryComparison, formalPlan.primaryComparison);
  assert.equal(candidatePlan.primaryEfficiencyMetric, formalPlan.primaryEfficiencyMetric);
  assert.deepEqual(candidatePlan.comparisonOrder, formalPlan.comparisonOrder);
  assert.deepEqual(candidatePlan.execution, formalPlan.execution);
  assert.equal(candidatePlan.package.name, "vertex-palace");
  assert.equal(candidatePlan.package.version, formalPlan.execution.palaceVersion);
  assert.equal(candidatePlan.package.sourceCommit, formalPlan.execution.palaceSourceCommit);
  assert.equal(candidatePlan.package.releaseCommit, formalPlan.execution.palaceReleaseCommit);
  assert.equal(candidatePlan.package.shasum, formalPlan.execution.palacePackageShasum);
  assert.equal(candidatePlan.package.integrity, formalPlan.execution.palacePackageIntegrity);
  assert.match(candidatePlan.blindingKeyCommitment, /^[a-f0-9]{64}$/);
  assert.equal(candidatePlan.trials.length, formalPlan.trials.length);
  assert.equal(candidatePlan.trials.length, 16);
  assert.equal(new Set(candidatePlan.trials.map((trial) => trial.trialId)).size, 16);

  const expectedIds = formalPlan.trials.map((trial) => candidateTrialId(trial.trialId));
  assert.deepEqual(candidatePlan.trials.map((trial) => trial.trialId), expectedIds);
  for (const [index, trial] of candidatePlan.trials.entries()) {
    const formalTrial = formalPlan.trials[index];
    assert.equal(trial.formalTrialId, formalTrial.trialId);
    assert.equal(trial.scenario, formalTrial.scenario);
    assert.equal(trial.seed, formalTrial.seed);
    assert.deepEqual(trial.order, formalTrial.order);
    assert.equal(trial.cacheState, formalTrial.cacheState);
  }
  return true;
}

export function candidateTarballMetadata(source) {
  return {
    shasum: createHash("sha1").update(source).digest("hex"),
    integrity: `sha512-${createHash("sha512").update(source).digest("base64")}`
  };
}

export function candidateSourcePlanHash(source) {
  return createHash("sha256").update(source).digest("hex");
}

async function main() {
  const options = parseOptions(process.argv.slice(2));
  const [formalPlanSource, formalPlan, formalManifest, candidatePlan, candidateManifest] = await Promise.all([
    readFile(formalPlanPath),
    readJson(formalPlanPath),
    readJson(formalManifestPath),
    readJson(candidatePlanPath),
    readJson(candidateManifestPath)
  ]);
  validateCandidatePlan(candidatePlan, formalPlan);
  assert.equal(
    candidateSourcePlanHash(formalPlanSource),
    candidatePlan.sourcePlan.sha256,
    "Formal source plan changed after candidate preregistration"
  );
  assert.equal(formalPlan.frozen, false, "Formal v3 must remain unfrozen during candidate validation");
  assert.deepEqual(formalManifest.trials, [], "Formal v3 manifest must remain at 0/16");
  assert.equal(candidateManifest.formal, false);
  assert.equal(candidateManifest.plannedTrials, 16);

  const selectedTrials = candidatePlan.trials.filter((trial) => trial.scenario === options.scenario);
  assert.equal(selectedTrials.length, 4, `${options.scenario} must contain four balanced trials`);
  const key = (await readFile(options.keyFile, "utf8")).trim();
  assert.equal(
    scenarioVariantKeyCommitment(key),
    candidatePlan.blindingKeyCommitment,
    "Candidate blinding key does not match the preregistered commitment"
  );

  const tarball = await readFile(options.tarball);
  const metadata = candidateTarballMetadata(tarball);
  assert.equal(metadata.shasum, candidatePlan.package.shasum, "Candidate tarball SHA-1 mismatch");
  assert.equal(metadata.integrity, candidatePlan.package.integrity, "Candidate tarball integrity mismatch");
  await assertCandidateOnlyWorktreeChanges();
  await installCandidateTarball(options.tarball);
  const installed = await readJson(path.join(repositoryRoot, "node_modules", "vertex-palace", "package.json"));
  assert.equal(installed.version, candidatePlan.package.version);

  process.env[scenarioVariantKeyEnvironment] = key;
  try {
    for (const trial of selectedTrials) await executeTrial(trial, candidatePlan);
  } finally {
    delete process.env[scenarioVariantKeyEnvironment];
  }
  await updateCandidateStatus();
  process.stdout.write(`Completed candidate block ${options.scenario} (4 trials / 16 Agent arms).\n`);
}

async function executeTrial(trial, candidatePlan) {
  const runDirectory = path.join(runsRoot, trial.trialId);
  const outputRoot = path.join(candidateRoot, trial.trialId);
  if (await pathExists(outputRoot)) {
    const manifest = await readJson(candidateManifestPath);
    const published = manifest.trials.find((entry) => entry.trialId === trial.trialId);
    if (published?.status === "completed") {
      process.stdout.write(`Skipping published candidate trial ${trial.trialId}\n`);
      return;
    }
    throw new Error(`${trial.trialId} has evidence on disk but is not registered as completed`);
  }
  if (!(await pathExists(runDirectory))) {
    await prepareCommand(new Map([
      ["scenario", trial.scenario],
      ["run-id", trial.trialId],
      ["seed", trial.seed],
      ["runs-root", runsRoot],
      ["protocol-version", "3.0.0"],
      ["cache-state", trial.cacheState]
    ]));
  }

  let error = null;
  try {
    await runCommand(new Map([
      ["run-dir", runDirectory],
      ["arm", "all"],
      ["order", trial.order.join(",")],
      ["model", candidatePlan.execution.model],
      ["reasoning-effort", candidatePlan.execution.reasoningEffort],
      ["cooldown-ms", String(candidatePlan.execution.cooldownMs)],
      ["timeout-ms", String(candidatePlan.execution.timeoutMs)],
      ["expected-codex-version", candidatePlan.execution.codexVersion],
      ["expected-palace-version", candidatePlan.package.version],
      ["resume", true]
    ]));
  } catch (caught) {
    error = caught instanceof Error ? caught.message : String(caught);
    process.stderr.write(`${trial.trialId}: ${error}\n`);
  }

  const reportPath = path.join(runDirectory, "reports", "comparison.json");
  if (await pathExists(reportPath)) {
    await registerCandidateTrial(trial);
    await publishRun(runDirectory, {
      outputRoot,
      resultsManifestPath: candidateManifestPath
    });
    await updateCandidateAttempt(trial.trialId, {
      status: "completed",
      attemptedAt: new Date().toISOString(),
      error
    });
    await updateCandidateTrial(trial.trialId, {
      status: "completed",
      error
    });
    return;
  }
  await updateCandidateAttempt(trial.trialId, {
    status: "attempted-no-report",
    attemptedAt: new Date().toISOString(),
    error
  });
}

async function registerCandidateTrial(trial) {
  const manifest = await readJson(candidateManifestPath);
  if (!manifest.trials.some((entry) => entry.trialId === trial.trialId)) {
    manifest.trials.push({ ...trial, status: "publishing" });
    await writeJson(candidateManifestPath, manifest);
  }
}

async function installCandidateTarball(tarballPath) {
  await runProcess(
    "npm",
    [
      "install",
      "--no-save",
      "--package-lock=false",
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
      "--loglevel=error",
      tarballPath
    ],
    { cwd: repositoryRoot, windowsShim: true, timeoutMs: 180_000, check: true, echo: true }
  );
}

async function assertCandidateOnlyWorktreeChanges() {
  const status = await runProcess(
    "git",
    ["status", "--porcelain", "--untracked-files=all"],
    { cwd: repositoryRoot, check: true }
  );
  const forbidden = status.stdout
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => line.slice(3).replaceAll("\\", "/").replace(/^"|"$/g, ""))
    .filter((file) => !file.startsWith("results/control-first-v3-candidate/"));
  if (forbidden.length) {
    throw new Error(`Candidate execution has unrelated worktree changes: ${forbidden.join(", ")}`);
  }
}

async function updateCandidateTrial(trialId, changes) {
  const manifest = await readJson(candidateManifestPath);
  const trial = manifest.trials.find((entry) => entry.trialId === trialId);
  assert.ok(trial, `Candidate manifest is missing ${trialId}`);
  Object.assign(trial, changes);
  await writeJson(candidateManifestPath, manifest);
}

async function updateCandidateAttempt(trialId, changes) {
  const manifest = await readJson(candidateManifestPath);
  manifest.attempts ??= [];
  const attempt = manifest.attempts.find((entry) => entry.trialId === trialId);
  if (attempt) Object.assign(attempt, changes);
  else manifest.attempts.push({ trialId, ...changes });
  await writeJson(candidateManifestPath, manifest);
}

async function updateCandidateStatus() {
  const manifest = await readJson(candidateManifestPath);
  const completed = manifest.trials.filter((trial) => trial.status === "completed").length;
  manifest.status = completed === manifest.plannedTrials ? "candidate-complete" : "candidate-in-progress";
  manifest.completedTrials = completed;
  await writeJson(candidateManifestPath, manifest);
}

function parseOptions(args) {
  const values = new Map();
  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];
    if (!value.startsWith("--")) continue;
    const name = value.slice(2);
    const next = args[index + 1];
    if (!next || next.startsWith("--")) throw new Error(`--${name} requires a value`);
    values.set(name, next);
    index += 1;
  }
  const scenario = values.get("scenario");
  if (!controlFirstScenarioIds.includes(scenario)) {
    throw new Error(`--scenario must be one of ${controlFirstScenarioIds.join(", ")}`);
  }
  const tarball = path.resolve(values.get("tarball") ?? "");
  const keyFile = path.resolve(values.get("key-file") ?? "");
  if (!values.get("tarball") || !values.get("key-file")) {
    throw new Error("--tarball and --key-file are required");
  }
  return { scenario, tarball, keyFile };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
