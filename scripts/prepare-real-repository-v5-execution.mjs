import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pathExists, readJson, writeJson, writeText } from "../src/lib/files.mjs";
import { runProcess } from "../src/lib/process.mjs";
import { repositoryRoot } from "../src/lib/root.mjs";
import { canonicalJson, sha256 } from "../src/lib/v5-static.mjs";

const protocolRoot = path.join(repositoryRoot, "protocol", "v5");
const privateRoot = path.join(repositoryRoot, ".benchmark-private", "v5");
const productRoot = path.join(privateRoot, "product");
const runnerSources = [
  "scripts/run-real-repository-v5-static.mjs",
  "src/lib/files.mjs",
  "src/lib/process.mjs",
  "src/lib/root.mjs",
  "src/lib/system-awake.mjs",
  "src/lib/v4-execution.mjs",
  "src/lib/v5-static.mjs"
];

export async function prepareV5Execution(options = {}) {
  const productRepository = path.resolve(requireOption(options.productRepository, "product repository"));
  const [freeze, targets, semanticReview] = await Promise.all([
    readJson(path.join(protocolRoot, "freeze.json")),
    readJson(path.join(protocolRoot, "targets.frozen.json")),
    readJson(path.join(protocolRoot, "semantic-review.json"))
  ]);
  assert.equal(freeze.status, "frozen-before-palace-observation");
  assert.equal(semanticReview.roundDecision, "proceed");
  assert.equal(semanticReview.reviewedBeforeTargetRouting, true);
  assert.equal(targets.targets.length, 12);
  await assertCleanRepository(repositoryRoot);
  await assertCommit(productRepository, freeze.productSourceCommit);

  await safeRemove(productRoot, privateRoot);
  await mkdir(productRoot, { recursive: true });
  const candidateSource = path.join(productRoot, "candidate-source");
  await runProcess("git", ["clone", "--no-hardlinks", productRepository, candidateSource], { check: true });
  await runProcess("git", ["checkout", "--detach", freeze.productSourceCommit], { cwd: candidateSource, check: true });
  await runProcess("pnpm", ["install", "--frozen-lockfile"], {
    cwd: candidateSource,
    check: true,
    windowsShim: true,
    timeoutMs: 600_000
  });
  await runProcess("pnpm", ["build"], {
    cwd: candidateSource,
    check: true,
    windowsShim: true,
    timeoutMs: 600_000
  });
  const generatedDiff = await runProcess("git", ["diff", "--binary"], {
    cwd: candidateSource,
    check: true
  });
  const changedNames = await runProcess("git", ["diff", "--name-only"], {
    cwd: candidateSource,
    check: true
  });
  const generatedTrackedFiles = changedNames.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replaceAll("\\", "/"));
  const allowedGeneratedFiles = new Set(["plugins/vertex-palace/mcp/server.cjs"]);
  assert.equal(
    generatedTrackedFiles.every((file) => allowedGeneratedFiles.has(file)),
    true,
    "Candidate build changed an unexpected tracked source file"
  );
  assert.equal(generatedTrackedFiles.length === 0, generatedDiff.stdout.length === 0);

  const candidate = await packAndInstall({
    label: "candidate",
    source: candidateSource,
    packSpec: "."
  });
  if (generatedTrackedFiles.length > 0) {
    candidate.generatedTrackedFiles = generatedTrackedFiles;
    candidate.generatedTrackedDiffSha256 = sha256(generatedDiff.stdout);
  }
  const baseline = await packAndInstall({
    label: "baseline-0.4.0",
    source: repositoryRoot,
    packSpec: "vertex-palace@0.4.0"
  });
  assert.equal(candidate.version, "0.4.0");
  assert.equal(baseline.version, "0.4.0");
  assert.notEqual(candidate.tarballSha256, baseline.tarballSha256, "Candidate and baseline tarballs unexpectedly match");

  const runnerSourceSha256 = await hashSources(runnerSources);
  const runnerSourceCommit = (await runProcess("git", ["rev-parse", "HEAD"], {
    cwd: repositoryRoot,
    check: true
  })).stdout.trim();
  const preparedAt = new Date().toISOString();
  const binding = {
    schemaVersion: 1,
    protocolVersion: freeze.protocolVersion,
    status: "prepared-before-static-observation",
    preparedAt,
    observationsAtPreparation: 0,
    targetFreeze: {
      productSourceCommit: freeze.productSourceCommit,
      targetsSha256: freeze.artifacts.targetsSha256,
      privateOracleCommitment: freeze.artifacts.privateOracleCommitment,
      semanticReviewSha256: await sha256File(path.join(protocolRoot, "semantic-review.json"))
    },
    runner: {
      sourceCommit: runnerSourceCommit,
      sourceFiles: runnerSources,
      sourceSha256: runnerSourceSha256
    },
    conditions: {
      candidate: publicProduct(candidate, freeze.productSourceCommit),
      "baseline-0.4.0": publicProduct(baseline, "npm:vertex-palace@0.4.0")
    },
    execution: {
      repetitions: 2,
      order: "balanced within target and sequential",
      contextBudgetTokens: 6000,
      routeLimit: 8,
      localAndHighConnectivityReferencePolicy: "off",
      referenceGroundedPolicy: "auto-with-frozen-cache",
      agentStage: "blocked-until-static-gates-pass"
    },
    declaration: "The exact candidate and npm baseline packages, runner sources, target freeze, and zero-observation state were bound before any selected target was sent to Palace."
  };
  const receipt = {
    ...binding,
    local: {
      candidate: candidate.local,
      "baseline-0.4.0": baseline.local
    }
  };
  await writeJson(path.join(protocolRoot, "execution.binding.json"), binding);
  await writeJson(path.join(privateRoot, "execution.receipt.json"), receipt);
  return binding;
}

async function packAndInstall({ label, source, packSpec }) {
  const artifactRoot = path.join(productRoot, label, "artifact");
  const installRoot = path.join(productRoot, label, "install");
  await mkdir(artifactRoot, { recursive: true });
  await mkdir(installRoot, { recursive: true });
  await writeText(path.join(installRoot, "package.json"), JSON.stringify({ private: true }));
  const packed = await runProcess("npm", [
    "pack",
    packSpec,
    "--json",
    "--ignore-scripts",
    "--pack-destination",
    artifactRoot
  ], { cwd: source, check: true, windowsShim: true, timeoutMs: 300_000 });
  const payload = JSON.parse(packed.stdout);
  assert.equal(Array.isArray(payload), true);
  assert.equal(payload.length, 1);
  const tarballPath = path.join(artifactRoot, payload[0].filename);
  assert.equal(await pathExists(tarballPath), true, `Missing ${label} tarball`);
  await runProcess("npm", [
    "install",
    "--ignore-scripts",
    "--no-audit",
    "--no-fund",
    "--loglevel=error",
    tarballPath
  ], { cwd: installRoot, check: true, windowsShim: true, timeoutMs: 300_000 });
  const packageJson = await readJson(path.join(installRoot, "node_modules", "vertex-palace", "package.json"));
  const cliPath = path.join(installRoot, "node_modules", "vertex-palace", "dist", "palace.cjs");
  const version = (await runProcess(process.execPath, [cliPath, "--version"], {
    cwd: installRoot,
    check: true
  })).stdout.trim();
  return {
    label,
    version,
    packageName: packageJson.name,
    tarballSha256: await sha256File(tarballPath),
    tarballIntegrity: await sha512Integrity(tarballPath),
    cliSha256: await sha256File(cliPath),
    local: { tarballPath, installRoot, cliPath }
  };
}

function publicProduct(product, source) {
  const result = {
    source,
    packageName: product.packageName,
    packageVersion: product.version,
    tarballSha256: product.tarballSha256,
    tarballIntegrity: product.tarballIntegrity,
    cliSha256: product.cliSha256
  };
  if (product.generatedTrackedFiles) {
    result.buildGeneratedTrackedFiles = product.generatedTrackedFiles;
    result.buildGeneratedTrackedDiffSha256 = product.generatedTrackedDiffSha256;
  }
  return result;
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
  return sha256(await readFile(file));
}

async function sha512Integrity(file) {
  return `sha512-${createHash("sha512").update(await readFile(file)).digest("base64")}`;
}

async function assertCommit(root, commit) {
  const result = await runProcess("git", ["cat-file", "-e", `${commit}^{commit}`], { cwd: root });
  assert.equal(result.exitCode, 0, `Candidate commit ${commit} is unavailable`);
}

async function assertCleanRepository(root) {
  const status = await runProcess("git", ["status", "--porcelain", "--untracked-files=all"], {
    cwd: root,
    check: true
  });
  assert.equal(status.stdout.trim(), "", "V5 execution preparation requires a clean benchmark repository");
}

async function safeRemove(target, root) {
  const resolvedTarget = path.resolve(target);
  const resolvedRoot = path.resolve(root);
  if (resolvedTarget === resolvedRoot || !resolvedTarget.startsWith(`${resolvedRoot}${path.sep}`)) {
    throw new Error(`Refusing to remove path outside V5 private root: ${resolvedTarget}`);
  }
  await rm(resolvedTarget, { recursive: true, force: true });
}

function requireOption(value, label) {
  if (typeof value !== "string" || value.trim() === "") throw new Error(`Missing --${label.replaceAll(" ", "-")}`);
  return value;
}

function parseArgs(argv) {
  const values = new Map();
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) continue;
    values.set(arg.slice(2), argv[index + 1]);
    index += 1;
  }
  return { productRepository: values.get("product-repository") };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await prepareV5Execution(parseArgs(process.argv.slice(2)));
  process.stdout.write(`${JSON.stringify({
    status: result.status,
    candidateTarballSha256: result.conditions.candidate.tarballSha256,
    baselineTarballSha256: result.conditions["baseline-0.4.0"].tarballSha256,
    runnerSourceSha256: result.runner.sourceSha256
  }, null, 2)}\n`);
}
