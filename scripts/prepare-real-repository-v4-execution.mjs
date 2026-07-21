import assert from "node:assert/strict";
import { rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readJson, writeJson } from "../src/lib/files.mjs";
import { runProcess } from "../src/lib/process.mjs";
import { repositoryRoot } from "../src/lib/root.mjs";
import {
  buildV4ExecutionCandidate,
  buildV4ExecutionReviewReceipt,
  evaluateV4ExecutionFreezeGate,
  freezeV4ExecutionBinding,
  sha1File,
  sha256File,
  sha256V4RunnerSources,
  sha512IntegrityFile
} from "../src/lib/v4-execution.mjs";
import { sha256Canonical } from "../src/lib/v4-protocol.mjs";

const protocolRoot = path.join(repositoryRoot, "protocol", "v4");
const privateRoot = path.join(repositoryRoot, ".benchmark-private", "v4");
const runtimeRoot = path.join(privateRoot, "runtimes");
const palaceInstall = path.join(privateRoot, "palace-install");

export async function prepareV4Execution(options) {
  const tarballPath = path.resolve(requireOption(options.tarball, "--tarball"));
  const productSourceCommit = requireSha1(options.productSourceCommit, "--product-source-commit");
  const productVersion = options.productVersion || "0.3.0";
  await assertCleanPushedHead();

  const [frozenPlan, studyReviewReceipt, executionProfile, privateOracle, blindingKey] = await Promise.all([
    readJson(path.join(protocolRoot, "plan.frozen.json")),
    readJson(path.join(protocolRoot, "review.receipt.json")),
    readJson(path.join(protocolRoot, "execution.profile.json")),
    readJson(path.join(privateRoot, "oracle.json")),
    import("node:fs/promises").then(({ readFile }) => readFile(path.join(privateRoot, "blinding-key.txt"), "utf8"))
      .then((value) => value.trim())
  ]);
  const runnerSourceCommit = (
    await runProcess("git", ["rev-parse", "HEAD"], { cwd: repositoryRoot, check: true })
  ).stdout.trim();
  const [
    runnerSourceSha256,
    productTarballSha1,
    productTarballSha256,
    productTarballIntegrity,
    evaluatorSha256
  ] = await Promise.all([
    sha256V4RunnerSources(repositoryRoot),
    sha1File(tarballPath),
    sha256File(tarballPath),
    sha512IntegrityFile(tarballPath),
    sha256File(path.join(privateRoot, "evaluator.mjs"))
  ]);
  assert.equal(
    evaluatorSha256,
    executionProfile.externalEvaluator.sha256,
    "Private evaluator differs from the public execution profile"
  );

  const runtime = runtimePaths();
  await installPalace({
    tarballPath,
    productSourceCommit,
    productVersion,
    productTarballSha1,
    productTarballSha256,
    productTarballIntegrity,
    runtime
  });
  const codexVersion = await version(runtime.codex, ["--version"], true);
  const palaceVersion = await version(runtime.node, [runtime.palaceCli, "--version"]);
  assert.equal(codexVersion, `codex-cli ${executionProfile.runtimes.codex.version}`);
  assert.equal(palaceVersion, productVersion);

  const candidate = buildV4ExecutionCandidate({
    frozenPlan,
    studyReviewReceipt,
    runnerSourceCommit,
    runnerSourceSha256,
    product: {
      repository: "https://github.com/lohchanhin/vertex-palace",
      sourceCommit: productSourceCommit,
      packageVersion: productVersion,
      tarball: {
        filename: path.basename(tarballPath),
        sha1: productTarballSha1,
        sha256: productTarballSha256,
        sha512Integrity: productTarballIntegrity
      }
    },
    executionProfile,
    agent: {
      model: options.model || "gpt-5.6-sol",
      reasoningEffort: options.reasoningEffort || "xhigh",
      codexVersion,
      timeoutMs: Number(options.timeoutMs || 900_000),
      cooldownMs: Number(options.cooldownMs || 15_000)
    },
    generatedAt: new Date().toISOString()
  });
  const reviewReceipt = buildV4ExecutionReviewReceipt({
    binding: candidate,
    reviewer: "HIN (repository owner)",
    reviewedAt: new Date().toISOString(),
    approved: true
  });
  reviewReceipt.authorization = {
    source: "Explicit user authorization in Codex",
    scope: "Full V4 execution amendment and formal run after technical audit",
    technicalAuditPerformedBy: "Codex",
    independentThirdPartyReview: false
  };
  const emptyResults = {
    schemaVersion: 1,
    protocolVersion: frozenPlan.protocolVersion,
    status: "not-started",
    formalAgentArmsRun: 0,
    arms: []
  };
  const actual = {
    codexVersion,
    palaceVersion,
    runnerSourceCommit,
    runnerSourceSha256,
    productSourceCommit,
    productTarballSha1,
    productTarballSha256,
    productTarballIntegrity,
    executionProfileSha256: sha256Canonical(executionProfile),
    evaluatorSha256
  };
  const gate = evaluateV4ExecutionFreezeGate({
    binding: candidate,
    frozenPlan,
    studyReviewReceipt,
    privateOracle,
    blindingKey,
    reviewReceipt,
    resultsManifest: emptyResults,
    actual
  });
  assert.equal(gate.passed, true, "V4 execution gate must pass before freeze");
  const frozen = freezeV4ExecutionBinding({
    binding: candidate,
    frozenPlan,
    studyReviewReceipt,
    privateOracle,
    blindingKey,
    reviewReceipt,
    resultsManifest: emptyResults,
    actual,
    frozenAt: new Date().toISOString()
  });
  const evidence = {
    schemaVersion: 1,
    protocolVersion: frozenPlan.protocolVersion,
    status: "frozen-human-reviewed",
    generatedAt: new Date().toISOString(),
    formalAgentArmsRun: 0,
    runnerSourceCommit,
    runnerSourceSha256,
    productSourceCommit,
    productTarballSha256,
    executionProfileSha256: actual.executionProfileSha256,
    evaluatorSha256,
    gateSummary: gate.summary,
    ownerReview: true,
    independentThirdPartyReview: false
  };

  await Promise.all([
    writeJson(path.join(protocolRoot, "execution.binding.candidate.json"), candidate),
    writeJson(path.join(protocolRoot, "execution.review.receipt.json"), reviewReceipt),
    writeJson(path.join(protocolRoot, "execution.results.empty.json"), emptyResults),
    writeJson(path.join(protocolRoot, "execution.actual.json"), actual),
    writeJson(path.join(protocolRoot, "execution.gate.json"), gate),
    writeJson(path.join(protocolRoot, "execution.binding.frozen.json"), frozen),
    writeJson(
      path.join(repositoryRoot, "docs", "research", "evidence", "real-repository-v4-execution-freeze.json"),
      evidence
    )
  ]);
  return { candidate, reviewReceipt, emptyResults, actual, gate, frozen, evidence };
}

async function installPalace(metadata) {
  const resolvedInstall = path.resolve(palaceInstall);
  const resolvedPrivateRoot = path.resolve(privateRoot);
  const relative = path.relative(resolvedPrivateRoot, resolvedInstall);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Refusing to replace a Palace installation outside the V4 private root");
  }
  await rm(resolvedInstall, { recursive: true, force: true });
  await runProcess(metadata.runtime.npm, [
    "install",
    "--prefix", resolvedInstall,
    "--package-lock=true",
    "--ignore-scripts",
    "--no-audit",
    "--no-fund",
    "--loglevel=error",
    metadata.tarballPath
  ], {
    cwd: repositoryRoot,
    windowsShim: true,
    check: true,
    timeoutMs: 300_000
  });
  const installed = await readJson(path.join(resolvedInstall, "node_modules", "vertex-palace", "package.json"));
  assert.equal(installed.version, metadata.productVersion, "Installed Palace package version mismatch");
  await writeJson(path.join(resolvedInstall, "installation.json"), {
    schemaVersion: 1,
    sourceCommit: metadata.productSourceCommit,
    packageVersion: metadata.productVersion,
    tarballPath: metadata.tarballPath,
    tarballSha1: metadata.productTarballSha1,
    tarballSha256: metadata.productTarballSha256,
    tarballIntegrity: metadata.productTarballIntegrity,
    installedAt: new Date().toISOString()
  });
}

function runtimePaths() {
  const nodeRoot = path.join(runtimeRoot, "node-v22.23.1-win-x64");
  return {
    node: path.join(nodeRoot, "node.exe"),
    npm: path.join(nodeRoot, "npm.cmd"),
    codex: path.join(privateRoot, "codex-cli", "node_modules", ".bin", "codex.cmd"),
    palaceCli: path.join(palaceInstall, "node_modules", "vertex-palace", "dist", "palace.cjs")
  };
}

async function version(command, args, windowsShim = false) {
  const result = await runProcess(command, args, { check: true, windowsShim });
  return `${result.stdout}${result.stderr}`.trim();
}

async function assertCleanPushedHead() {
  const [status, head, origin] = await Promise.all([
    runProcess("git", ["status", "--porcelain", "--untracked-files=all"], { cwd: repositoryRoot, check: true }),
    runProcess("git", ["rev-parse", "HEAD"], { cwd: repositoryRoot, check: true }),
    runProcess("git", ["rev-parse", "origin/main"], { cwd: repositoryRoot, check: true })
  ]);
  assert.equal(status.stdout.trim(), "", "V4 execution preparation requires a clean worktree");
  assert.equal(head.stdout.trim(), origin.stdout.trim(), "V4 runner commit must be pushed before execution freeze");
}

function parseOptions(args) {
  const values = new Map();
  for (let index = 0; index < args.length; index += 1) {
    const name = args[index];
    if (!name.startsWith("--")) throw new Error(`Unexpected argument: ${name}`);
    const next = args[index + 1];
    if (!next || next.startsWith("--")) throw new Error(`${name} requires a value`);
    values.set(name.slice(2), next);
    index += 1;
  }
  return Object.fromEntries([...values.entries()].map(([key, value]) => [camelCase(key), value]));
}

function camelCase(value) {
  return value.replace(/-([a-z])/g, (_, character) => character.toUpperCase());
}

function requireOption(value, label) {
  if (typeof value !== "string" || value.trim() === "") throw new Error(`${label} is required`);
  return value;
}

function requireSha1(value, label) {
  if (typeof value !== "string" || !/^[a-f0-9]{40}$/.test(value)) {
    throw new Error(`${label} must be a lowercase 40-character commit`);
  }
  return value;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await prepareV4Execution(parseOptions(process.argv.slice(2)));
  process.stdout.write(
    `PASS V4 execution freeze: ${result.gate.summary.passed}/${result.gate.summary.checks} checks; 0 formal Agent arms.\n`
  );
}
