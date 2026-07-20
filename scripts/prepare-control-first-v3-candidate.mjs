import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pathExists } from "../src/lib/files.mjs";
import { repositoryRoot } from "../src/lib/root.mjs";
import { candidateTrialId } from "./run-control-first-v3-candidate.mjs";

const formalPlanPath = path.join(repositoryRoot, "results", "control-first-v3", "plan.json");
const candidateRoot = path.join(repositoryRoot, "results", "control-first-v3-candidate");

export async function prepareCandidateStudy(commitment, createdAt = new Date().toISOString()) {
  assert.match(commitment, /^[a-f0-9]{64}$/, "A SHA-256 blinding-key commitment is required");
  const planPath = path.join(candidateRoot, "plan.json");
  const manifestPath = path.join(candidateRoot, "manifest.json");
  assert.equal(await pathExists(planPath), false, "Candidate plan already exists and cannot be overwritten");
  assert.equal(await pathExists(manifestPath), false, "Candidate manifest already exists and cannot be overwritten");

  const source = await readFile(formalPlanPath);
  const formal = JSON.parse(source);
  const claimBoundary = "Non-formal prepublication Agent validation using the exact local 0.3.0 tarball. It does not replace or contribute observations to formal v3.";
  const packagePin = {
    name: "vertex-palace",
    version: formal.execution.palaceVersion,
    sourceCommit: formal.execution.palaceSourceCommit,
    releaseCommit: formal.execution.palaceReleaseCommit,
    shasum: formal.execution.palacePackageShasum,
    integrity: formal.execution.palacePackageIntegrity
  };
  const trials = formal.trials.map((trial) => ({
    trialId: candidateTrialId(trial.trialId),
    formalTrialId: trial.trialId,
    scenario: trial.scenario,
    seed: trial.seed,
    order: trial.order,
    cacheState: trial.cacheState
  }));
  const plan = {
    schemaVersion: 1,
    protocolVersion: "3.0.0",
    formal: false,
    nonFormalReason: "prepublication-local-tarball-validation",
    claimBoundary,
    createdAt,
    sourcePlan: {
      path: "results/control-first-v3/plan.json",
      protocolTag: formal.protocolTag,
      sha256: createHash("sha256").update(source).digest("hex")
    },
    primaryComparison: formal.primaryComparison,
    primaryEfficiencyMetric: formal.primaryEfficiencyMetric,
    comparisonOrder: formal.comparisonOrder,
    execution: formal.execution,
    package: packagePin,
    blindingKeyCommitment: commitment,
    trials
  };
  const manifest = {
    schemaVersion: 1,
    protocolVersion: "3.0.0",
    formal: false,
    status: "candidate-not-started",
    claimBoundary,
    plannedTrials: 16,
    completedTrials: 0,
    plannedScenarios: [
      "small-local-bug",
      "cross-stack-regression",
      "decision-memory-dependent",
      "stale-memory-adversarial"
    ],
    plannedSeedsPerScenario: 4,
    package: packagePin,
    blindingKeyCommitment: commitment,
    trials: [],
    attempts: []
  };

  await mkdir(candidateRoot, { recursive: true });
  await Promise.all([
    writeFile(planPath, `${JSON.stringify(plan, null, 2)}\n`, "utf8"),
    writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8")
  ]);
  return { planPath, manifestPath };
}

async function main() {
  const commitmentIndex = process.argv.indexOf("--commitment");
  const commitment = commitmentIndex >= 0 ? process.argv[commitmentIndex + 1] : "";
  const output = await prepareCandidateStudy(commitment);
  process.stdout.write(`Candidate plan: ${output.planPath}\nCandidate manifest: ${output.manifestPath}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
