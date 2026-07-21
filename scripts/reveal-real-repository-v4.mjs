import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readJson, writeJson } from "../src/lib/files.mjs";
import { runProcess } from "../src/lib/process.mjs";
import { repositoryRoot } from "../src/lib/root.mjs";
import { resolveV4BlindedOrder, sha256File } from "../src/lib/v4-execution.mjs";
import { commitV4BlindingKey, sha256Canonical } from "../src/lib/v4-protocol.mjs";

export const V4_BLINDING_KEY_ENVIRONMENT = "VERTEX_PALACE_V4_BLINDING_KEY";

const defaultResultsRoot = path.join(repositoryRoot, "results", "real-repository-v4");
const defaultRevealPath = path.join(defaultResultsRoot, "blinding-reveal.json");
const defaultPlanPath = path.join(repositoryRoot, "protocol", "v4", "plan.frozen.json");
const manifestRepositoryPath = "results/real-repository-v4/manifest.json";

export async function buildRealRepositoryV4Reveal(options = {}) {
  const resultsRoot = path.resolve(options.resultsRoot ?? defaultResultsRoot);
  const planPath = path.resolve(options.planPath ?? defaultPlanPath);
  const manifestPath = path.join(resultsRoot, "manifest.json");
  const plan = await readJson(planPath);
  const manifest = await readJson(manifestPath);
  const blindingKey = String(options.blindingKey ?? "").trim().toLowerCase();
  const outcomesLockedAtCommit = String(options.outcomesLockedAtCommit ?? "").trim().toLowerCase();

  assert.match(outcomesLockedAtCommit, /^[a-f0-9]{40}$/, "A full result-lock commit is required");
  assert.equal(plan.frozen, true);
  assert.equal(plan.humanReviewApproved, true);
  assert.equal(plan.statistics?.frozenBeforeExecution, true);
  assert.equal(manifest.protocolVersion, plan.protocolVersion);
  assert.equal(manifest.status, "formal-complete-awaiting-reveal");
  assert.equal(manifest.mappingRevealed, false);
  assert.equal(manifest.completedTrials, manifest.plannedTrials);
  assert.equal(manifest.completedArmRuns, manifest.plannedArmRuns);
  assert.equal(manifest.arms.length, manifest.plannedArmRuns);
  assert.equal(commitV4BlindingKey(blindingKey), plan.blinding.keyCommitment);

  const locked = await readLockedManifest(outcomesLockedAtCommit);
  assert.equal(
    sha256Canonical(locked.manifest),
    sha256Canonical(manifest),
    "The current result manifest differs from the outcome-lock commit"
  );

  const evidence = [];
  for (const arm of manifest.arms) {
    const evidencePath = path.resolve(repositoryRoot, arm.evidencePath);
    const publicEvidence = await readJson(evidencePath);
    assert.equal(await sha256File(evidencePath), arm.evidenceSha256, `Evidence hash mismatch for ${arm.armId}`);
    assert.equal(publicEvidence.armId, arm.armId);
    assert.equal(publicEvidence.trialId, arm.trialId);
    assert.equal(publicEvidence.blindedLabel, arm.blindedLabel);
    assert.equal(publicEvidence.metrics?.success, arm.success);
    evidence.push(publicEvidence);
  }

  const assignments = plan.trials.flatMap((trial) => {
    const treatments = resolveV4BlindedOrder(trial, blindingKey);
    return trial.blindedOrder.map((blindedLabel, index) => {
      const armId = `${trial.trialId}-${blindedLabel}`;
      assert.ok(manifest.arms.some((arm) => arm.armId === armId), `Missing completed arm ${armId}`);
      return {
        armId,
        trialId: trial.trialId,
        fixtureId: trial.fixtureId,
        sequence: index + 1,
        blindedLabel,
        treatment: treatments[index]
      };
    });
  });
  const labelMapping = Object.fromEntries(
    assignments.slice(0, 2).map(({ blindedLabel, treatment }) => [blindedLabel, treatment])
  );
  for (const assignment of assignments) {
    assert.equal(labelMapping[assignment.blindedLabel], assignment.treatment, "V4 label mapping must be global");
  }

  return {
    schemaVersion: 1,
    artifact: "real-repository-v4-blinding-reveal",
    revealedAt: options.revealedAt ?? new Date().toISOString(),
    study: {
      id: plan.id,
      protocolVersion: plan.protocolVersion,
      outcomesLockedAtCommit,
      lockedManifestSha256: locked.sha256,
      lockedManifestCanonicalSha256: sha256Canonical(locked.manifest),
      evidenceFiles: evidence.length
    },
    blinding: {
      keyEncoding: "64-character lowercase hexadecimal",
      key: blindingKey,
      keyCommitment: plan.blinding.keyCommitment,
      commitmentFormula: "sha256(UTF-8 vertex-palace-v4-arm-key + NUL + UTF-8 hex key)",
      mappingFormula: "HMAC-SHA256(hex key, UTF-8 vertex-palace-v4-global-arm-map); arm-a is Adaptive Palace when byte 0 is even",
      labelMapping
    },
    verification: {
      resultsComplete: true,
      plannedTrials: manifest.plannedTrials,
      completedTrials: manifest.completedTrials,
      plannedArmRuns: manifest.plannedArmRuns,
      completedArmRuns: manifest.completedArmRuns,
      infrastructureFailures: manifest.infrastructureFailures,
      evidenceHashesVerified: evidence.length,
      keyMatchesFrozenCommitment: true,
      lockedManifestMatchesCurrentResults: true,
      allAssignmentsReproduced: true,
      oracleDetailsPublished: false
    },
    assignments
  };
}

export async function verifyRealRepositoryV4Reveal(revealPath = defaultRevealPath, options = {}) {
  const absoluteRevealPath = path.resolve(revealPath);
  const reveal = await readJson(absoluteRevealPath);
  const rebuilt = await buildRealRepositoryV4Reveal({
    resultsRoot: options.resultsRoot ?? path.dirname(absoluteRevealPath),
    planPath: options.planPath,
    blindingKey: reveal.blinding?.key,
    outcomesLockedAtCommit: reveal.study?.outcomesLockedAtCommit,
    revealedAt: reveal.revealedAt
  });
  assert.deepEqual(reveal, rebuilt, "Published V4 reveal does not reproduce from locked results");
  return rebuilt;
}

async function readLockedManifest(commit) {
  const ancestor = await runProcess("git", ["merge-base", "--is-ancestor", commit, "HEAD"], {
    cwd: repositoryRoot
  });
  assert.equal(ancestor.exitCode, 0, "Outcome-lock commit must be an ancestor of HEAD");
  const shown = await runProcess("git", ["show", `${commit}:${manifestRepositoryPath}`], {
    cwd: repositoryRoot,
    check: true
  });
  return {
    manifest: JSON.parse(shown.stdout),
    sha256: createHash("sha256").update(shown.stdout, "utf8").digest("hex")
  };
}

function argumentValue(args, flag) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
}

async function main() {
  const args = process.argv.slice(2);
  const outputPath = path.resolve(argumentValue(args, "--out") ?? defaultRevealPath);
  if (args.includes("--verify")) {
    const reveal = await verifyRealRepositoryV4Reveal(outputPath);
    process.stdout.write(`${JSON.stringify({
      mode: "verify",
      outputPath,
      assignmentsVerified: reveal.assignments.length,
      outcomesLockedAtCommit: reveal.study.outcomesLockedAtCommit,
      keyPrinted: false
    }, null, 2)}\n`);
    return;
  }

  const blindingKey = process.env[V4_BLINDING_KEY_ENVIRONMENT];
  delete process.env[V4_BLINDING_KEY_ENVIRONMENT];
  const reveal = await buildRealRepositoryV4Reveal({
    resultsRoot: path.dirname(outputPath),
    blindingKey,
    outcomesLockedAtCommit: argumentValue(args, "--locked-commit")
  });
  const write = args.includes("--write");
  if (write) await writeJson(outputPath, reveal);
  process.stdout.write(`${JSON.stringify({
    mode: write ? "write" : "preview",
    outputPath,
    keyCommitment: reveal.blinding.keyCommitment,
    assignmentsVerified: reveal.assignments.length,
    outcomesLockedAtCommit: reveal.study.outcomesLockedAtCommit,
    keyPrinted: false
  }, null, 2)}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
