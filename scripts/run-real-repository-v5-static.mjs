import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pathExists, readJson, writeJson } from "../src/lib/files.mjs";
import { runProcess } from "../src/lib/process.mjs";
import { repositoryRoot } from "../src/lib/root.mjs";
import { startSystemAwake } from "../src/lib/system-awake.mjs";
import { materializeV4Workspace } from "../src/lib/v4-execution.mjs";
import {
  analyzeV5Static,
  balancedV5Order,
  canonicalJson,
  measureV5Observation,
  sha256
} from "../src/lib/v5-static.mjs";

const protocolRoot = path.join(repositoryRoot, "protocol", "v5");
const privateRoot = path.join(repositoryRoot, ".benchmark-private", "v5");
const resultsRoot = path.join(repositoryRoot, "results", "real-repository-v5");
const defaultRuntimeRoot = path.join(
  process.env.LOCALAPPDATA || "C:/VertexPalaceBenchmark",
  "VertexPalaceBenchmark",
  "v5",
  "static"
);

export async function runV5Static(options = {}) {
  const context = await loadContext(options);
  if (!options.execute) return buildPlan(context);
  const observations = [];
  const awake = await startSystemAwake();
  try {
    for (let targetIndex = 0; targetIndex < context.targets.length; targetIndex += 1) {
      const target = context.targets[targetIndex];
      for (let repetition = 1; repetition <= context.binding.execution.repetitions; repetition += 1) {
        for (const condition of balancedV5Order(targetIndex, repetition)) {
          const observationId = `${target.id}-r${repetition}-${condition}`;
          const rawPath = path.join(context.runtime.rawRoot, `${observationId}.json`);
          if (options.resume && await pathExists(rawPath)) {
            observations.push(await readJson(rawPath));
            continue;
          }
          process.stdout.write(`[V5] ${observationId}\n`);
          const observation = await runObservation(context, { target, repetition, condition, observationId });
          observations.push(observation);
          await writeJson(rawPath, observation);
        }
      }
    }
  } finally {
    const stopped = await awake.stop();
    if (stopped.exitCode !== 0) throw new Error("V5 system-awake guard did not stop cleanly");
  }

  const analysis = analyzeV5Static(context.targets, observations, {
    repetitions: context.binding.execution.repetitions
  });
  const result = {
    schemaVersion: 1,
    artifact: "real-repository-v5-static-results",
    protocolVersion: context.binding.protocolVersion,
    generatedAt: new Date().toISOString(),
    preregistered: true,
    targetCount: context.targets.length,
    conditions: Object.keys(context.binding.conditions),
    repetitions: context.binding.execution.repetitions,
    bindingSha256: sha256(canonicalJson(context.binding)),
    executionAmendmentSha256: sha256(canonicalJson(context.amendment)),
    candidateSourceCommit: context.binding.targetFreeze.productSourceCommit,
    observations,
    analysis,
    agentGate: {
      allowed: analysis.agentStageAllowed,
      reason: analysis.agentStageAllowed
        ? "All preregistered static qualification gates passed."
        : "At least one preregistered static qualification gate failed; Agent execution is blocked."
    }
  };
  await mkdir(resultsRoot, { recursive: true });
  await writeJson(path.join(resultsRoot, "static-results.json"), result);
  await writeJson(path.join(resultsRoot, "agent-gate.json"), {
    schemaVersion: 1,
    protocolVersion: context.binding.protocolVersion,
    generatedAt: result.generatedAt,
    bindingSha256: result.bindingSha256,
    ...result.agentGate,
    gates: analysis.gates
  });
  return result;
}

async function loadContext(options) {
  const paths = {
    freeze: path.join(protocolRoot, "freeze.json"),
    targets: path.join(protocolRoot, "targets.frozen.json"),
    review: path.join(protocolRoot, "semantic-review.json"),
    binding: path.join(protocolRoot, "execution.binding.json"),
    amendment: path.join(protocolRoot, "execution.amendment-1.json"),
    receipt: options.receiptPath || path.join(privateRoot, "execution.receipt.json"),
    oracle: options.oraclePath || path.join(privateRoot, "oracle.json")
  };
  const [freeze, targetManifest, review, binding, amendment, receipt, oracle] = await Promise.all([
    readJson(paths.freeze),
    readJson(paths.targets),
    readJson(paths.review),
    readJson(paths.binding),
    readJson(paths.amendment),
    readJson(paths.receipt),
    readJson(paths.oracle)
  ]);
  await verifyFrozenInputs({ freeze, targetManifest, review, binding, amendment, receipt, oracle });
  const runtimeRoot = path.resolve(options.runtimeRoot || defaultRuntimeRoot);
  assertAsciiPath(runtimeRoot);
  const runtime = {
    root: runtimeRoot,
    cacheRoot: path.join(runtimeRoot, "source-cache"),
    runsRoot: path.join(runtimeRoot, "runs"),
    rawRoot: path.join(repositoryRoot, ".benchmark-runs", "v5", "static")
  };
  if (!options.resume) {
    await safeRemove(runtime.runsRoot, runtime.root);
    await safeRemove(runtime.rawRoot, path.join(repositoryRoot, ".benchmark-runs"));
  }
  await mkdir(runtime.runsRoot, { recursive: true });
  await mkdir(runtime.rawRoot, { recursive: true });
  const oracleById = new Map(oracle.targets.map((target) => [target.id, target]));
  return { freeze, targets: targetManifest.targets, review, binding, amendment, receipt, oracleById, runtime };
}

async function runObservation(context, run) {
  const oracle = context.oracleById.get(run.target.id);
  assert.ok(oracle, `Missing private oracle for ${run.target.id}`);
  const fixture = {
    id: run.target.id,
    repository: { url: run.target.repository, frozenCommit: run.target.baseCommit }
  };
  const workspaceRoot = path.join(context.runtime.runsRoot, run.observationId);
  await safeRemove(workspaceRoot, context.runtime.runsRoot);
  const materialized = await materializeV4Workspace({
    fixture,
    armId: run.observationId,
    cacheRoot: context.runtime.cacheRoot,
    runsRoot: context.runtime.runsRoot
  });
  const product = context.receipt.local[run.condition];
  const cliPath = product.cliPath;
  const call = (args, timeoutMs, check = true) => runProcess(process.execPath, [cliPath, ...args], {
    cwd: materialized.workspace,
    timeoutMs,
    check,
    env: sanitizedEnvironment()
  });
  const init = await call(["init"], 180_000);
  const index = await call(["index"], 1_200_000);
  const referencePolicy = run.target.stratum === "reference-grounded" ? "auto" : "off";
  if (referencePolicy === "auto") await writeReferenceCache(materialized.workspace, run.target, oracle, context.freeze);
  const contextCommand = await call([
    "context",
    run.target.task,
    "--auto",
    "--format", "json",
    "--route-limit", String(context.binding.execution.routeLimit),
    "--budget", String(context.binding.execution.contextBudgetTokens),
    "--references", referencePolicy
  ], 300_000, false);
  let output = {};
  let parseError = null;
  if (contextCommand.exitCode === 0) {
    try {
      output = JSON.parse(contextCommand.stdout);
    } catch (error) {
      parseError = error instanceof Error ? error.message : String(error);
    }
  }
  const status = await runProcess("git", ["status", "--short", "--untracked-files=all"], {
    cwd: materialized.workspace,
    check: true
  });
  const measurement = measureV5Observation({
    target: run.target,
    oracle,
    output,
    rawBytes: Buffer.byteLength(contextCommand.stdout, "utf8"),
    status: status.stdout
  });
  const observation = {
    observationId: run.observationId,
    condition: run.condition,
    repetition: run.repetition,
    sequencePolicy: balancedV5Order(context.targets.indexOf(run.target), run.repetition),
    referencePolicy,
    productVersion: context.binding.conditions[run.condition].packageVersion,
    productTarballSha256: context.binding.conditions[run.condition].tarballSha256,
    baseCommit: run.target.baseCommit,
    durationsMs: {
      init: init.durationMs,
      index: index.durationMs,
      context: contextCommand.durationMs
    },
    executionPassed: contextCommand.exitCode === 0 && parseError === null,
    executionError: contextCommand.exitCode === 0 && parseError === null ? null : {
      exitCode: contextCommand.exitCode,
      timedOut: contextCommand.timedOut,
      phase: "context",
      message: sanitizeError(parseError || contextCommand.stderr || contextCommand.stdout)
    },
    ...measurement
  };
  await writeFile(path.join(context.runtime.rawRoot, `${run.observationId}.context.json`), contextCommand.stdout, "utf8");
  await safeRemove(workspaceRoot, context.runtime.runsRoot);
  return observation;
}

async function writeReferenceCache(root, target, oracle, freeze) {
  const match = /^https:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?$/i.exec(target.repository);
  assert.ok(match, `Unsupported GitHub repository URL for ${target.id}`);
  const repository = `${match[1]}/${match[2]}`;
  const number = target.issue.number;
  const key = sha256(`${repository.toLowerCase()}#${number}`).slice(0, 24);
  const title = oracle.issue.title;
  const bodyExcerpt = String(oracle.issue.body || "").slice(0, 8192);
  const labels = [];
  const cache = {
    schemaVersion: 1,
    fetchedAt: freeze.frozenAt,
    expiresAt: "2099-01-01T00:00:00.000Z",
    reference: {
      provider: "github",
      kind: "issue",
      repository,
      number,
      url: target.issue.url,
      resolutionStatus: "fetched",
      title,
      contentHash: sha256(`${title}\n${bodyExcerpt}\n${labels.join("\n")}`)
    },
    bodyExcerpt,
    labels
  };
  const cachePath = path.join(root, ".palace", "cache", "references", `github-${key}.json`);
  await mkdir(path.dirname(cachePath), { recursive: true });
  await writeJson(cachePath, cache);
}

async function verifyFrozenInputs({ freeze, targetManifest, review, binding, amendment, receipt, oracle }) {
  assert.equal(freeze.status, "frozen-before-palace-observation");
  assert.equal(targetManifest.targets.length, 12);
  assert.equal(review.roundDecision, "proceed");
  assert.equal(review.summary.coherent, 12);
  assert.equal(binding.status, "prepared-before-static-observation");
  assert.equal(binding.observationsAtPreparation, 0);
  assert.equal(canonicalJson(binding), canonicalJson(stripLocalReceipt(receipt)));
  assert.equal(amendment.status, "frozen-after-interrupted-attempt");
  assert.equal(amendment.baseBindingSha256, sha256(canonicalJson(binding)));
  assert.equal(amendment.observedBeforeAmendment.selectedTargetCallsStarted, 1);
  assert.equal(amendment.observedBeforeAmendment.completedObservations, 0);
  assert.equal(amendment.repair.productChanged, false);
  assert.equal(amendment.repair.targetsChanged, false);
  assert.equal(amendment.repair.thresholdsChanged, false);
  assert.equal(sha256(canonicalJson(oracle)), freeze.artifacts.privateOracleCommitment);
  assert.equal(
    await sha256File(path.join(protocolRoot, "targets.frozen.json")),
    freeze.artifacts.targetsSha256,
    "Frozen target bytes changed after selection"
  );
  assert.equal(
    await sha256File(path.join(protocolRoot, "semantic-review.json")),
    binding.targetFreeze.semanticReviewSha256,
    "Semantic review changed after execution binding"
  );
  assert.equal(
    await hashSources(amendment.runner.sourceFiles),
    amendment.runner.sourceSha256,
    "V5 static runner sources changed after execution amendment"
  );
  assert.equal(
    await sha256File(path.join(resultsRoot, "attempt-1-harness-failure.json")),
    amendment.observedBeforeAmendment.attemptArtifactSha256,
    "Interrupted attempt disclosure changed after amendment"
  );
  assert.deepEqual(
    targetManifest.targets.map((target) => target.id).sort(),
    oracle.targets.map((target) => target.id).sort()
  );
  for (const condition of Object.keys(binding.conditions)) {
    const local = receipt.local[condition];
    assert.ok(local?.cliPath, `Missing installed CLI for ${condition}`);
    assert.equal(await pathExists(local.tarballPath), true, `Missing tarball for ${condition}`);
    assert.equal(await pathExists(local.cliPath), true, `Missing CLI for ${condition}`);
    assert.equal(
      await sha256File(local.tarballPath),
      binding.conditions[condition].tarballSha256,
      `Tarball hash changed for ${condition}`
    );
    assert.equal(
      await sha512Integrity(local.tarballPath),
      binding.conditions[condition].tarballIntegrity,
      `Tarball integrity changed for ${condition}`
    );
    assert.equal(
      await sha256File(local.cliPath),
      binding.conditions[condition].cliSha256,
      `CLI hash changed for ${condition}`
    );
  }
}

function stripLocalReceipt(receipt) {
  const clone = structuredClone(receipt);
  delete clone.local;
  return clone;
}

async function hashSources(files) {
  const hash = createHash("sha256");
  for (const file of files) {
    const bytes = await readFile(path.join(repositoryRoot, file));
    hash.update(Buffer.from(`${file}\0${bytes.length}\0`, "utf8"));
    hash.update(bytes);
    hash.update(Buffer.from("\0", "utf8"));
  }
  return hash.digest("hex");
}

async function sha256File(file) {
  return createHash("sha256").update(await readFile(file)).digest("hex");
}

async function sha512Integrity(file) {
  return `sha512-${createHash("sha512").update(await readFile(file)).digest("base64")}`;
}

function buildPlan(context) {
  return {
    protocolVersion: context.binding.protocolVersion,
    targets: context.targets.length,
    repetitions: context.binding.execution.repetitions,
    observations: context.targets.length * context.binding.execution.repetitions * 2,
    conditions: Object.keys(context.binding.conditions),
    executeRequired: true
  };
}

function sanitizedEnvironment() {
  const env = { ...process.env };
  delete env.GH_TOKEN;
  delete env.GITHUB_TOKEN;
  return env;
}

function sanitizeError(value) {
  return String(value || "Unknown context execution failure")
    .replace(/[A-Za-z]:[\\/][^\r\n]*/g, "[local-path]")
    .trim()
    .slice(0, 2000);
}

function assertAsciiPath(value) {
  if (!/^[\x00-\x7F]+$/.test(value)) throw new Error(`V5 runtime root must be ASCII-only: ${value}`);
}

async function safeRemove(target, root) {
  const resolvedTarget = path.resolve(target);
  const resolvedRoot = path.resolve(root);
  if (resolvedTarget === resolvedRoot || !resolvedTarget.startsWith(`${resolvedRoot}${path.sep}`)) {
    throw new Error(`Refusing to remove path outside V5 runtime root: ${resolvedTarget}`);
  }
  await rm(resolvedTarget, { recursive: true, force: true });
}

function parseArgs(argv) {
  const flags = new Set(argv.filter((arg) => arg.startsWith("--")));
  const values = new Map();
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!["--runtime-root", "--oracle", "--receipt"].includes(arg)) continue;
    values.set(arg, argv[index + 1]);
    index += 1;
  }
  return {
    execute: flags.has("--execute"),
    resume: flags.has("--resume"),
    runtimeRoot: values.get("--runtime-root"),
    oraclePath: values.get("--oracle"),
    receiptPath: values.get("--receipt")
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await runV5Static(parseArgs(process.argv.slice(2)));
  process.stdout.write(`${JSON.stringify(result.agentGate ? {
    pass: result.analysis.pass,
    agentStageAllowed: result.agentGate.allowed,
    observations: result.observations.length,
    failedGates: Object.entries(result.analysis.gates).filter(([, passed]) => !passed).map(([name]) => name)
  } : result, null, 2)}\n`);
}
