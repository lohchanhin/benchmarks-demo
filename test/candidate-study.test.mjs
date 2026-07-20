import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { repositoryRoot } from "../src/lib/root.mjs";
import {
  candidateTarballMetadata,
  candidateSourcePlanHash,
  candidateTrialId,
  validateCandidatePlan
} from "../scripts/run-control-first-v3-candidate.mjs";

test("candidate validation mirrors all formal v3 trials without sharing result ids", async () => {
  const formal = JSON.parse(await readFile(`${repositoryRoot}/results/control-first-v3/plan.json`, "utf8"));
  const candidate = JSON.parse(
    await readFile(`${repositoryRoot}/results/control-first-v3-candidate/plan.json`, "utf8")
  );
  assert.equal(validateCandidatePlan(candidate, formal), true);
  assert.equal(new Set(candidate.trials.map((trial) => trial.trialId)).size, 16);
  assert.ok(candidate.trials.every((trial) => trial.trialId !== trial.formalTrialId));
});

test("candidate manifest evolves only inside its own preregistered trial set", async () => {
  const [formal, candidate, plan] = await Promise.all([
    readFile(`${repositoryRoot}/results/control-first-v3/manifest.json`, "utf8").then(JSON.parse),
    readFile(`${repositoryRoot}/results/control-first-v3-candidate/manifest.json`, "utf8").then(JSON.parse),
    readFile(`${repositoryRoot}/results/control-first-v3-candidate/plan.json`, "utf8").then(JSON.parse)
  ]);
  assert.deepEqual(formal.trials, []);
  assert.equal(candidate.formal, false);
  assert.equal(candidate.plannedTrials, 16);
  assert.ok(candidate.trials.length <= candidate.plannedTrials);
  assert.equal(new Set(candidate.trials.map((trial) => trial.trialId)).size, candidate.trials.length);
  const plannedIds = new Set(plan.trials.map((trial) => trial.trialId));
  assert.ok(candidate.trials.every((trial) => plannedIds.has(trial.trialId)));
  assert.ok(candidate.attempts.every((attempt) => plannedIds.has(attempt.trialId)));
  assert.equal(
    candidate.completedTrials,
    candidate.trials.filter((trial) => trial.status === "completed").length
  );
});

test("candidate ids change only the study label", () => {
  assert.equal(
    candidateTrialId("small-local-bug-control-first-v3-pilot-01"),
    "small-local-bug-control-first-v3-candidate-01"
  );
});

test("candidate tarball metadata uses npm-compatible hashes", () => {
  const source = Buffer.from("verified candidate artifact");
  assert.deepEqual(candidateTarballMetadata(source), {
    shasum: createHash("sha1").update(source).digest("hex"),
    integrity: `sha512-${createHash("sha512").update(source).digest("base64")}`
  });
});

test("candidate source plan hash is byte-exact", () => {
  const source = Buffer.from("frozen source plan\n");
  assert.equal(candidateSourcePlanHash(source), createHash("sha256").update(source).digest("hex"));
});
