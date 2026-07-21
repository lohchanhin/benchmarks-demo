import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readJson, writeJson } from "../src/lib/files.mjs";
import { runProcess } from "../src/lib/process.mjs";
import { repositoryRoot } from "../src/lib/root.mjs";
import { sha256File } from "../src/lib/v4-execution.mjs";
import { sha256Canonical } from "../src/lib/v4-protocol.mjs";

const defaultManifestPath = path.join(repositoryRoot, "results", "real-repository-v4", "manifest.json");
const defaultOutputPath = path.join(
  repositoryRoot,
  "results",
  "real-repository-v4",
  "infrastructure-attempt-costs.json"
);
const defaultPrivateRawRoot = path.join(repositoryRoot, ".benchmark-private", "v4", "raw");

export async function buildRealRepositoryV4RetryCostDisclosure(options = {}) {
  const manifestPath = path.resolve(options.manifestPath ?? defaultManifestPath);
  const privateRawRoot = path.resolve(options.privateRawRoot ?? defaultPrivateRawRoot);
  const manifest = await readJson(manifestPath);
  assert.equal(manifest.status, "formal-complete-awaiting-reveal");
  assert.equal(manifest.completedArmRuns, manifest.plannedArmRuns);
  assert.equal(manifest.infrastructureFailures, manifest.attempts.length);
  const outcomesLockedAtCommit = requireSha1(options.outcomesLockedAtCommit);
  const lockedManifestCanonicalSha256 = await verifyOutcomeLock(manifest, outcomesLockedAtCommit);

  const attempts = [];
  for (const publicAttempt of manifest.attempts) {
    const directoryName = publicAttempt.attempt === 1
      ? publicAttempt.armId
      : `${publicAttempt.armId}-retry-${publicAttempt.attempt}`;
    const privateAttemptPath = path.join(privateRawRoot, directoryName, "attempt.json");
    const privateTranscriptPath = path.join(privateRawRoot, directoryName, "transcript.jsonl");
    const privateAttempt = await readJson(privateAttemptPath);
    const transcript = await readFile(privateTranscriptPath, "utf8");
    const usageEventObserved = /"(?:input_tokens|output_tokens|cached_input_tokens|total_tokens)"\s*:/i.test(transcript);

    assert.equal(privateAttempt.armId, publicAttempt.armId);
    assert.equal(privateAttempt.attempt, publicAttempt.attempt);
    assert.equal(privateAttempt.infrastructureFailure, true);
    assert.equal(privateAttempt.reason, publicAttempt.reason);
    assert.equal(privateAttempt.execution?.timedOut, true);
    assert.ok(Number.isFinite(privateAttempt.execution?.durationMs));

    const usage = privateAttempt.transcript?.usage ?? {};
    attempts.push({
      armId: publicAttempt.armId,
      attempt: publicAttempt.attempt,
      status: publicAttempt.status,
      reason: publicAttempt.reason,
      metrics: {
        wallTimeMs: Math.round(privateAttempt.execution.durationMs),
        timedOut: privateAttempt.execution.timedOut === true,
        toolCalls: integerOrNull(privateAttempt.transcript?.toolCalls),
        failedCalls: integerOrNull(privateAttempt.transcript?.failedCalls),
        usageEventObserved,
        reportedTokens: usageEventObserved ? numberOrNull(usage.totalTokens) : null,
        inputTokens: usageEventObserved ? numberOrNull(usage.inputTokens) : null,
        cachedInputTokens: usageEventObserved ? numberOrNull(usage.cachedInputTokens) : null,
        outputTokens: usageEventObserved ? numberOrNull(usage.outputTokens) : null
      },
      sourceCommitments: {
        privateAttemptSha256: await sha256File(privateAttemptPath),
        privateTranscriptSha256: await sha256File(privateTranscriptPath)
      }
    });
  }

  return {
    schemaVersion: 1,
    artifact: "real-repository-v4-infrastructure-attempt-costs",
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    outcomesLockedAtCommit,
    manifestSha256: await sha256File(manifestPath),
    lockedManifestCanonicalSha256,
    accounting: {
      infrastructureAttempts: attempts.length,
      wallTimeComplete: attempts.every((attempt) => Number.isFinite(attempt.metrics.wallTimeMs)),
      tokenUsageComplete: attempts.every((attempt) => attempt.metrics.usageEventObserved),
      missingTokenUsageAttempts: attempts
        .filter((attempt) => !attempt.metrics.usageEventObserved)
        .map((attempt) => `${attempt.armId}#${attempt.attempt}`),
      zeroWithoutUsageEventMeansUnknown: true
    },
    privacy: {
      rawTranscriptsPublished: false,
      sessionIdsPublished: false,
      privatePathsPublished: false,
      oracleDetailsPublished: false,
      sourceHashesPermitEvaluatorSideAudit: true
    },
    attempts
  };
}

export async function verifyRealRepositoryV4RetryCostDisclosure(
  disclosurePath = defaultOutputPath,
  options = {}
) {
  const absolutePath = path.resolve(disclosurePath);
  const disclosure = await readJson(absolutePath);
  const manifest = await readJson(path.resolve(options.manifestPath ?? defaultManifestPath));
  assert.equal(disclosure.artifact, "real-repository-v4-infrastructure-attempt-costs");
  assert.equal(
    disclosure.lockedManifestCanonicalSha256,
    await verifyOutcomeLock(manifest, requireSha1(disclosure.outcomesLockedAtCommit))
  );
  assert.equal(disclosure.attempts.length, manifest.attempts.length);
  assert.equal(disclosure.accounting.infrastructureAttempts, manifest.infrastructureFailures);
  for (const publicAttempt of manifest.attempts) {
    const disclosed = disclosure.attempts.find((attempt) => (
      attempt.armId === publicAttempt.armId && attempt.attempt === publicAttempt.attempt
    ));
    assert.ok(disclosed, `Missing disclosed retry cost for ${publicAttempt.armId}#${publicAttempt.attempt}`);
    assert.equal(disclosed.status, publicAttempt.status);
    assert.equal(disclosed.reason, publicAttempt.reason);
    assert.ok(Number.isFinite(disclosed.metrics.wallTimeMs));
    if (!disclosed.metrics.usageEventObserved) {
      assert.equal(disclosed.metrics.reportedTokens, null);
      assert.equal(disclosed.metrics.inputTokens, null);
      assert.equal(disclosed.metrics.cachedInputTokens, null);
      assert.equal(disclosed.metrics.outputTokens, null);
    }
  }
  const serialized = JSON.stringify(disclosure);
  for (const forbidden of [
    /[A-Za-z]:\\/,
    /\.benchmark-private/i,
    /"sessionId"\s*:/i,
    /"privateOracle"\s*:/i,
    /transcript\.jsonl/i
  ]) {
    assert.equal(forbidden.test(serialized), false, `Retry disclosure contains forbidden material: ${forbidden}`);
  }
  return disclosure;
}

function integerOrNull(value) {
  return Number.isInteger(value) ? value : null;
}

function numberOrNull(value) {
  return Number.isFinite(value) ? Number(value) : null;
}

function requireSha1(value) {
  const result = String(value ?? "").trim().toLowerCase();
  assert.match(result, /^[a-f0-9]{40}$/, "A full result-lock commit is required");
  return result;
}

async function verifyOutcomeLock(manifest, commit) {
  const ancestor = await runProcess("git", ["merge-base", "--is-ancestor", commit, "HEAD"], {
    cwd: repositoryRoot
  });
  assert.equal(ancestor.exitCode, 0, "Outcome-lock commit must be an ancestor of HEAD");
  const shown = await runProcess("git", ["show", `${commit}:results/real-repository-v4/manifest.json`], {
    cwd: repositoryRoot,
    check: true
  });
  const locked = JSON.parse(shown.stdout);
  assert.equal(
    sha256Canonical(locked),
    sha256Canonical(manifest),
    "The current result manifest differs from the outcome-lock commit"
  );
  return sha256Canonical(locked);
}

function argumentValue(args, flag) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
}

async function main() {
  const args = process.argv.slice(2);
  const outputPath = path.resolve(argumentValue(args, "--out") ?? defaultOutputPath);
  if (args.includes("--verify")) {
    const disclosure = await verifyRealRepositoryV4RetryCostDisclosure(outputPath);
    process.stdout.write(`${JSON.stringify({
      mode: "verify",
      outputPath,
      attemptsVerified: disclosure.attempts.length,
      tokenUsageComplete: disclosure.accounting.tokenUsageComplete,
      rawDataPrinted: false
    }, null, 2)}\n`);
    return;
  }
  const disclosure = await buildRealRepositoryV4RetryCostDisclosure({
    privateRawRoot: argumentValue(args, "--private-raw-root"),
    outcomesLockedAtCommit: argumentValue(args, "--locked-commit")
  });
  const write = args.includes("--write");
  if (write) await writeJson(outputPath, disclosure);
  process.stdout.write(`${JSON.stringify({
    mode: write ? "write" : "preview",
    outputPath,
    attemptsPublished: disclosure.attempts.length,
    tokenUsageComplete: disclosure.accounting.tokenUsageComplete,
    rawDataPrinted: false
  }, null, 2)}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
