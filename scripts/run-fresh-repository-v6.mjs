import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pathExists, readJson, writeJson } from "../src/lib/files.mjs";
import { runProcess } from "../src/lib/process.mjs";
import { repositoryRoot } from "../src/lib/root.mjs";
import { startSystemAwake } from "../src/lib/system-awake.mjs";
import { canonicalJson, measureV5Observation, sha256 } from "../src/lib/v5-static.mjs";

const protocolRoot = path.join(repositoryRoot, "protocol", "v6");
const privateRoot = path.join(repositoryRoot, ".benchmark-private", "v6");
const resultsRoot = path.join(repositoryRoot, "results", "fresh-repository-v6");
const rawRoot = path.join(repositoryRoot, ".benchmark-runs", "v6");
const defaultRuntimeRoot = path.join(
  process.env.LOCALAPPDATA || "C:/VertexPalaceBenchmark",
  "VertexPalaceBenchmark",
  "v6"
);
const conditions = Object.freeze(["candidate", "baseline-0.4.0"]);

export async function runFreshRepositoryV6(options = {}) {
  const context = await loadContext(options);
  if (!options.execute) return buildPlan(context);
  await prepareRuntime(context);
  const observations = [];
  const awake = await startSystemAwake();
  try {
    for (let repetition = 1; repetition <= 2; repetition += 1) {
      for (const condition of balancedOrder(repetition)) {
        const observationId = `${context.target.id}-r${repetition}-${condition}`;
        process.stdout.write(`[V6] ${observationId}\n`);
        const observation = await runObservation(context, { repetition, condition, observationId });
        observations.push(observation);
        await writeJson(path.join(rawRoot, `${observationId}.measurement.json`), observation);
      }
    }
  } finally {
    const stopped = await awake.stop();
    if (stopped.exitCode !== 0) throw new Error("V6 system-awake guard did not stop cleanly.");
  }
  const analysis = analyze(context, observations);
  const result = {
    schemaVersion: 1,
    artifact: "fresh-repository-v6-static-result",
    protocolVersion: context.freeze.protocolVersion,
    generatedAt: new Date().toISOString(),
    claimBoundary: context.freeze.claimBoundary,
    target: context.target,
    candidate: context.freeze.product,
    baseline: context.freeze.baseline,
    observations,
    analysis,
    privateOracleCommitment: context.freeze.artifacts.privateOracleCommitment
  };
  await mkdir(resultsRoot, { recursive: true });
  await writeJson(path.join(resultsRoot, "static-result.json"), result);
  await writeJson(path.join(resultsRoot, "oracle-reveal.json"), {
    schemaVersion: 1,
    protocolVersion: context.freeze.protocolVersion,
    revealedAt: result.generatedAt,
    targetId: context.oracle.targetId,
    repository: context.oracle.repository,
    exactChangedFiles: context.oracle.exactChangedFiles,
    implementationFiles: context.oracle.implementationFiles,
    testFiles: context.oracle.testFiles,
    auxiliaryFiles: context.oracle.auxiliaryFiles,
    diffSha256: context.oracle.diffSha256,
    commitment: context.freeze.artifacts.privateOracleCommitment,
    commitmentVerified: true
  });
  return result;
}

async function loadContext(options) {
  const [freeze, target, review, oracle] = await Promise.all([
    readJson(path.join(protocolRoot, "freeze.json")),
    readJson(path.join(protocolRoot, "target.frozen.json")),
    readJson(path.join(protocolRoot, "semantic-review.json")),
    readJson(options.oraclePath || path.join(privateRoot, "oracle.json"))
  ]);
  assert.equal(freeze.status, "frozen-before-palace-observation");
  assert.equal(target.status, "frozen-before-palace-observation");
  assert.equal(review.decision, "proceed");
  assert.equal(review.reviewedBeforeTargetRouting, true);
  assert.equal(target.id, oracle.targetId);
  assert.equal(review.diffSha256, oracle.diffSha256);
  assert.equal(canonicalJson(oracle) && sha256(canonicalJson(oracle)), freeze.artifacts.privateOracleCommitment);
  assert.equal(await sha256File(freeze.product.cliPath), freeze.product.cliSha256);
  const productRoot = path.dirname(path.dirname(freeze.product.cliPath));
  const head = await runProcess("git", ["rev-parse", "HEAD"], { cwd: productRoot, check: true });
  assert.equal(head.stdout.trim(), freeze.product.sourceCommit, "Product HEAD changed after V6 freeze.");
  const dirty = await runProcess("git", ["status", "--short", "--untracked-files=no"], { cwd: productRoot, check: true });
  assert.equal(dirty.stdout.trim(), "", "Tracked product files changed after V6 freeze.");
  const runtimeRoot = path.resolve(options.runtimeRoot || defaultRuntimeRoot);
  assertAsciiPath(runtimeRoot);
  return {
    freeze,
    target: { ...target, stratum: "fresh-historical" },
    review,
    oracle,
    runtime: {
      root: runtimeRoot,
      source: path.join(runtimeRoot, "source"),
      runs: path.join(runtimeRoot, "runs"),
      tools: path.join(runtimeRoot, "tools")
    },
    cli: {
      candidate: freeze.product.cliPath,
      "baseline-0.4.0": path.join(runtimeRoot, "tools", "baseline", "package", "dist", "palace.cjs")
    }
  };
}

async function prepareRuntime(context) {
  await safeRemove(context.runtime.root, path.dirname(context.runtime.root));
  await safeRemove(rawRoot, path.join(repositoryRoot, ".benchmark-runs"));
  await mkdir(context.runtime.root, { recursive: true });
  await mkdir(rawRoot, { recursive: true });
  const clone = await runProcess("git", ["clone", "--no-checkout", context.target.cloneUrl, context.runtime.source], {
    cwd: context.runtime.root,
    check: true,
    timeoutMs: 300_000
  });
  assert.equal(clone.exitCode, 0);
  await runProcess("git", ["checkout", "--detach", context.target.baseCommit], {
    cwd: context.runtime.source,
    check: true,
    timeoutMs: 120_000
  });
  await prepareBaseline(context);
}

async function prepareBaseline(context) {
  const metadataResponse = await fetch("https://registry.npmjs.org/vertex-palace/0.4.0", {
    signal: AbortSignal.timeout(30_000)
  });
  assert.equal(metadataResponse.ok, true, `npm metadata request failed with HTTP ${metadataResponse.status}.`);
  const metadata = await metadataResponse.json();
  assert.equal(metadata?.dist?.shasum, context.freeze.baseline.npmShasum);
  assert.ok(metadata?.dist?.tarball, "npm metadata did not include a tarball URL.");
  const tarballResponse = await fetch(metadata.dist.tarball, { signal: AbortSignal.timeout(120_000) });
  assert.equal(tarballResponse.ok, true, `npm tarball request failed with HTTP ${tarballResponse.status}.`);
  const tarball = Buffer.from(await tarballResponse.arrayBuffer());
  assert.equal(createHash("sha1").update(tarball).digest("hex"), context.freeze.baseline.npmShasum);
  const tarballPath = path.join(context.runtime.tools, "vertex-palace-0.4.0.tgz");
  const extractRoot = path.join(context.runtime.tools, "baseline");
  await mkdir(extractRoot, { recursive: true });
  await writeFile(tarballPath, tarball);
  await runProcess("tar.exe", ["-xzf", tarballPath, "-C", extractRoot], {
    cwd: context.runtime.tools,
    check: true,
    timeoutMs: 120_000
  });
  assert.equal(await pathExists(context.cli["baseline-0.4.0"]), true, "Extracted baseline CLI is missing.");
}

async function runObservation(context, run) {
  const workspace = path.join(context.runtime.runs, run.observationId);
  await mkdir(context.runtime.runs, { recursive: true });
  await runProcess("git", ["clone", "--no-hardlinks", context.runtime.source, workspace], {
    cwd: context.runtime.runs,
    check: true,
    timeoutMs: 300_000
  });
  await runProcess("git", ["checkout", "--detach", context.target.baseCommit], {
    cwd: workspace,
    check: true,
    timeoutMs: 120_000
  });
  await runProcess("git", ["remote", "set-url", "--push", "origin", "DISABLED"], {
    cwd: workspace,
    check: true
  });
  const call = (args, timeoutMs, check = true) => runProcess(
    process.execPath,
    [context.cli[run.condition], ...args],
    { cwd: workspace, timeoutMs, check, env: sanitizedEnvironment() }
  );
  const init = await call(["init"], 180_000);
  const index = await call(["index"], 1_200_000);
  const command = await call([
    "context",
    context.target.task,
    "--auto",
    "--format", "json",
    "--route-limit", "8",
    "--budget", "6000",
    "--references", context.target.referencePolicy
  ], 300_000, false);
  const rawPath = path.join(rawRoot, `${run.observationId}.context.json`);
  await writeFile(rawPath, command.stdout, "utf8");
  let output = {};
  let parseError = null;
  if (command.exitCode === 0) {
    try {
      output = JSON.parse(command.stdout);
    } catch (error) {
      parseError = error instanceof Error ? error.message : String(error);
    }
  }
  const status = await runProcess("git", ["status", "--short", "--untracked-files=all"], {
    cwd: workspace,
    check: true
  });
  const measurement = measureV5Observation({
    target: context.target,
    oracle: context.oracle,
    output,
    rawBytes: Buffer.byteLength(command.stdout, "utf8"),
    status: status.stdout
  });
  await safeRemove(workspace, context.runtime.runs);
  return {
    observationId: run.observationId,
    condition: run.condition,
    repetition: run.repetition,
    sequence: balancedOrder(run.repetition),
    productVersion: run.condition === "candidate" ? context.freeze.product.reportedVersion : context.freeze.baseline.version,
    productCliSha256: await sha256File(context.cli[run.condition]),
    durationsMs: { init: init.durationMs, index: index.durationMs, context: command.durationMs },
    executionPassed: command.exitCode === 0 && parseError === null,
    executionError: command.exitCode === 0 && parseError === null ? null : {
      exitCode: command.exitCode,
      timedOut: command.timedOut,
      message: sanitizeError(parseError || command.stderr || command.stdout)
    },
    ...measurement
  };
}

function analyze(context, observations) {
  const candidate = observations.filter((item) => item.condition === "candidate");
  const baseline = observations.filter((item) => item.condition === "baseline-0.4.0");
  const candidateSummary = summarize(candidate);
  const baselineSummary = summarize(baseline);
  const gates = {
    twoCandidateRunsCompleted: candidate.length === 2,
    allCandidateContextCommandsSucceeded: candidate.length === 2 && candidate.every((item) => item.executionPassed),
    deterministicCandidateRoute: deterministic(candidate),
    implementationAndTestRoleClosure: candidate.length === 2 && candidate.every((item) => item.roleClosure),
    coreCoverageMinimum50: candidateSummary.coreCoverage >= 0.5,
    routeFocusMinimum40: candidateSummary.routeFocus >= 0.4,
    contextCeiling6000: candidate.length === 2 && candidate.every((item) => item.contextTokens <= 6000),
    zeroTrackedFilePollution: candidate.every((item) => item.trackedFilePollution.length === 0),
    zeroPayloadMetricDisagreement: candidate.every((item) => item.payloadMetricAgreement)
  };
  return {
    pass: Object.values(gates).every(Boolean),
    gates,
    candidate: candidateSummary,
    baseline: baselineSummary,
    descriptiveDeltaCandidateMinusBaseline: {
      coreCoverage: round(candidateSummary.coreCoverage - baselineSummary.coreCoverage),
      routeFocus: round(candidateSummary.routeFocus - baselineSummary.routeFocus),
      contextTokens: round(candidateSummary.contextTokens - baselineSummary.contextTokens),
      contextMs: round(candidateSummary.contextMs - baselineSummary.contextMs)
    },
    interpretationBoundary: "One target and two repeated static calls per condition; no general routing, Token, speed, or Agent claim is permitted."
  };
}

function summarize(runs) {
  return {
    runs: runs.length,
    successfulRuns: runs.filter((item) => item.executionPassed).length,
    mode: runs[0]?.mode || null,
    degradation: runs[0]?.degradation || null,
    decision: runs[0]?.decision || null,
    coreCoverage: mean(runs.map((item) => item.core.coverage)),
    implementationCoverage: mean(runs.map((item) => item.implementation.coverage)),
    testCoverage: mean(runs.map((item) => item.tests.coverage)),
    auxiliaryCoverage: mean(runs.map((item) => item.auxiliary.coverage)),
    roleClosure: runs.length > 0 && runs.every((item) => item.roleClosure),
    routeFocus: mean(runs.map((item) => item.routeFocus)),
    routeFileCount: mean(runs.map((item) => item.routeFileCount)),
    contextTokens: mean(runs.map((item) => item.contextTokens)),
    contextMs: mean(runs.map((item) => item.durationsMs.context)),
    deterministic: deterministic(runs),
    routeFiles: runs[0]?.routeFiles || []
  };
}

export function balancedOrder(repetition) {
  assert.ok(repetition === 1 || repetition === 2, "V6 repetition must be 1 or 2.");
  return repetition === 1 ? [...conditions] : [...conditions].reverse();
}

function deterministic(runs) {
  if (runs.length !== 2) return false;
  return runs[0].decision === runs[1].decision
    && runs[0].mode === runs[1].mode
    && canonicalJson(runs[0].routeFiles) === canonicalJson(runs[1].routeFiles);
}

function mean(values) {
  return values.length ? round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;
}

function round(value) {
  return Math.round((Number(value) + Number.EPSILON) * 1_000_000) / 1_000_000;
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

async function sha256File(file) {
  return createHash("sha256").update(await readFile(file)).digest("hex");
}

async function safeRemove(target, allowedRoot) {
  const resolvedTarget = path.resolve(target);
  const resolvedRoot = path.resolve(allowedRoot);
  assert.ok(resolvedTarget !== resolvedRoot && resolvedTarget.startsWith(`${resolvedRoot}${path.sep}`), `Refusing to remove path outside allowed root: ${resolvedTarget}`);
  await rm(resolvedTarget, { recursive: true, force: true });
}

function assertAsciiPath(value) {
  assert.match(value, /^[\x00-\x7F]+$/, `V6 runtime root must be ASCII-only: ${value}`);
}

function buildPlan(context) {
  return {
    protocolVersion: context.freeze.protocolVersion,
    targetId: context.target.id,
    repository: context.target.repository,
    observations: 4,
    sequence: [balancedOrder(1), balancedOrder(2)],
    executeRequired: true
  };
}

function parseArgs(argv) {
  const runtimeIndex = argv.indexOf("--runtime-root");
  const oracleIndex = argv.indexOf("--oracle");
  return {
    execute: argv.includes("--execute"),
    runtimeRoot: runtimeIndex >= 0 ? argv[runtimeIndex + 1] : undefined,
    oraclePath: oracleIndex >= 0 ? argv[oracleIndex + 1] : undefined
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await runFreshRepositoryV6(parseArgs(process.argv.slice(2)));
  process.stdout.write(`${JSON.stringify(result.analysis ? {
    pass: result.analysis.pass,
    target: result.target.id,
    candidate: result.analysis.candidate,
    baseline: result.analysis.baseline,
    failedGates: Object.entries(result.analysis.gates).filter(([, passed]) => !passed).map(([name]) => name)
  } : result, null, 2)}\n`);
}
