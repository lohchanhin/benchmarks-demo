import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  V4_EXECUTION_BINDING_VERSION,
  assertV4FormalExecutionAllowed,
  buildV4ExecutionCandidate,
  buildV4ExecutionReviewReceipt,
  codexV4Arguments,
  evaluateV4ExecutionFreezeGate,
  freezeV4ExecutionBinding,
  materializeV4Workspace,
  resolveV4BlindedOrder,
  scoreV4Arm,
  sha1File,
  sha256V4RunnerSources,
  sha512IntegrityFile,
  sha256File
} from "../src/lib/v4-execution.mjs";
import { runProcess } from "../src/lib/process.mjs";
import { commitV4BlindingKey, sha256Canonical } from "../src/lib/v4-protocol.mjs";
import { buildV4FixtureProfiles } from "../src/lib/v4-verification.mjs";

test("blinded mapping is deterministic, bijective, and preserves balanced trial order", () => {
  const key = "22".repeat(32);
  const trials = [
    { trialId: "trial-1", blindedOrder: ["arm-a", "arm-b"] },
    { trialId: "trial-2", blindedOrder: ["arm-b", "arm-a"] }
  ];
  const first = trials.map((trial) => resolveV4BlindedOrder(trial, key));
  const second = trials.map((trial) => resolveV4BlindedOrder(trial, key));

  assert.deepEqual(first, second);
  assert.equal(first.every((order) => new Set(order).size === 2), true);
  assert.equal(first.every((order) => order.includes("control") && order.includes("adaptive-palace")), true);
  assert.notDeepEqual(first[0], first[1]);
});

test("execution candidate binds the frozen study, runner, product artifact, and network-off settings", () => {
  const context = bindingContext();
  const candidate = buildV4ExecutionCandidate(context);

  assert.equal(candidate.schemaVersion, V4_EXECUTION_BINDING_VERSION);
  assert.equal(candidate.frozen, false);
  assert.equal(candidate.executionAllowed, false);
  assert.equal(candidate.formalAgentArmsRun, 0);
  assert.equal(candidate.study.planSha256, sha256Canonical(context.frozenPlan));
  assert.equal(candidate.study.reviewReceiptSha256, sha256Canonical(context.studyReviewReceipt));
  assert.equal(candidate.runner.sourceCommit, context.runnerSourceCommit);
  assert.equal(candidate.product.sourceCommit, context.product.sourceCommit);
  assert.equal(candidate.product.tarball.sha512Integrity, context.product.tarball.sha512Integrity);
  assert.equal(candidate.agent.networkAccess, false);
  assert.equal(candidate.agent.ignoreUserConfig, true);
  assert.equal(candidate.agent.ignoreRules, true);
  assert.equal(candidate.agent.ephemeral, true);
  assert.equal(candidate.workspace.rootPolicy, "absolute-ascii-only");
  assert.equal(candidate.evaluator.sourceSha256, context.executionProfile.externalEvaluator.sha256);
});

test("freeze gate rejects network access, mismatched artifacts, and non-empty formal results", () => {
  const context = bindingContext();
  const candidate = buildV4ExecutionCandidate(context);
  const receipt = buildV4ExecutionReviewReceipt({
    binding: candidate,
    reviewer: "HIN (repository owner)",
    reviewedAt: "2026-07-21T10:00:00.000Z",
    approved: true
  });
  candidate.agent.networkAccess = true;
  candidate.product.tarball.sha512Integrity = "sha512-wrong";

  const gate = evaluateV4ExecutionFreezeGate({
    binding: candidate,
    frozenPlan: context.frozenPlan,
    studyReviewReceipt: context.studyReviewReceipt,
    privateOracle: context.privateOracle,
    blindingKey: context.blindingKey,
    reviewReceipt: receipt,
    resultsManifest: { protocolVersion: context.frozenPlan.protocolVersion, arms: [{ armId: "ran" }] },
    actual: context.actual
  });

  assert.equal(gate.passed, false);
  assert.deepEqual(
    gate.checks.filter((check) => check.status === "failed").map((check) => check.id),
    ["binding-structure", "product-artifact", "execution-review", "formal-results-empty"]
  );
});

test("matching review freezes execution while preserving zero formal arms", () => {
  const context = bindingContext();
  const candidate = buildV4ExecutionCandidate(context);
  const receipt = buildV4ExecutionReviewReceipt({
    binding: candidate,
    reviewer: "HIN (repository owner)",
    reviewedAt: "2026-07-21T10:00:00.000Z",
    approved: true
  });
  const resultsManifest = { protocolVersion: context.frozenPlan.protocolVersion, arms: [] };
  const gate = evaluateV4ExecutionFreezeGate({
    binding: candidate,
    frozenPlan: context.frozenPlan,
    studyReviewReceipt: context.studyReviewReceipt,
    privateOracle: context.privateOracle,
    blindingKey: context.blindingKey,
    reviewReceipt: receipt,
    resultsManifest,
    actual: context.actual
  });
  assert.equal(gate.passed, true);

  const frozen = freezeV4ExecutionBinding({
    binding: candidate,
    frozenPlan: context.frozenPlan,
    studyReviewReceipt: context.studyReviewReceipt,
    privateOracle: context.privateOracle,
    blindingKey: context.blindingKey,
    reviewReceipt: receipt,
    resultsManifest,
    actual: context.actual,
    frozenAt: "2026-07-21T10:01:00.000Z"
  });
  assert.equal(frozen.frozen, true);
  assert.equal(frozen.executionAllowed, true);
  assert.equal(frozen.formalAgentArmsRun, 0);
  assert.doesNotThrow(() => assertV4FormalExecutionAllowed(frozen, { ...gate, passed: true }));
});

test("Codex v4 arguments fail closed with strict network-off sandbox settings", () => {
  const args = codexV4Arguments({
    workspace: "C:/fixture",
    model: "gpt-5.6-sol",
    reasoningEffort: "xhigh",
    lastMessagePath: "C:/fixture/.benchmark-last-message.md"
  });
  assert.deepEqual(args, [
    "--strict-config",
    "-c",
    "sandbox_workspace_write.network_access=false",
    "-a",
    "never",
    "-s",
    "workspace-write",
    "-C",
    "C:/fixture",
    "-m",
    "gpt-5.6-sol",
    "-c",
    'windows.sandbox="elevated"',
    "-c",
    'model_reasoning_effort="xhigh"',
    "exec",
    "--ignore-user-config",
    "--ignore-rules",
    "--json",
    "--ephemeral",
    "--output-last-message",
    "C:/fixture/.benchmark-last-message.md",
    "-"
  ]);
});

test("materializes independent clean workspaces at the exact frozen commit", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "v4-workspace-"));
  const source = path.join(root, "source");
  await runProcess("git", ["init", "--initial-branch=main", source], { check: true });
  await runProcess("git", ["-C", source, "config", "user.name", "V4 Test"], { check: true });
  await runProcess("git", ["-C", source, "config", "user.email", "v4@example.invalid"], { check: true });
  await runProcess(process.execPath, ["-e", "require('fs').writeFileSync(process.argv[1], 'baseline\\n')", path.join(source, "file.txt")], { check: true });
  await runProcess("git", ["-C", source, "add", "file.txt"], { check: true });
  await runProcess("git", ["-C", source, "commit", "-m", "baseline"], { check: true });
  const revision = (await runProcess("git", ["-C", source, "rev-parse", "HEAD"], { check: true })).stdout.trim();
  const cacheRoot = path.join(root, "cache");
  const runsRoot = path.join(root, "runs");

  const first = await materializeV4Workspace({
    fixture: { id: "local", repository: { url: source, frozenCommit: revision } },
    armId: "trial-1-arm-a",
    cacheRoot,
    runsRoot
  });
  const second = await materializeV4Workspace({
    fixture: { id: "local", repository: { url: source, frozenCommit: revision } },
    armId: "trial-1-arm-b",
    cacheRoot,
    runsRoot
  });

  assert.notEqual(first.workspace, second.workspace);
  assert.equal(first.head, revision);
  assert.equal(second.head, revision);
  assert.equal(first.tree, second.tree);
  assert.equal((await readFile(path.join(first.workspace, "file.txt"), "utf8")), "baseline\n");
  assert.equal(first.clean, true);
  assert.equal(second.clean, true);
});

test("v4 scoring requires correctness, exact scope, no forbidden files, and valid execution", () => {
  const successful = scoreV4Arm({
    correctnessPassed: true,
    changedFiles: ["src/a.ts", "test/a.test.ts"],
    exactChangedFiles: ["src/a.ts", "test/a.test.ts"],
    forbiddenFiles: ["package.json"],
    diffCheckPassed: true,
    executionPassed: true
  });
  assert.equal(successful.success, true);
  assert.equal(successful.exactScopePassed, true);

  const broad = scoreV4Arm({
    correctnessPassed: true,
    changedFiles: ["src/a.ts", "test/a.test.ts", "package.json"],
    exactChangedFiles: ["src/a.ts", "test/a.test.ts"],
    forbiddenFiles: ["package.json"],
    diffCheckPassed: true,
    executionPassed: true
  });
  assert.equal(broad.success, false);
  assert.equal(broad.forbiddenViolation, true);
  assert.deepEqual(broad.extraFiles, ["package.json"]);
});

test("sha256File hashes the exact artifact bytes", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "v4-hash-"));
  const source = path.join(root, "artifact.tgz");
  await runProcess(process.execPath, ["-e", "require('fs').writeFileSync(process.argv[1], 'artifact')", source], { check: true });
  assert.equal(await sha256File(source), "c7c5c1d70c5dec4416ab6158afd0b223ef40c29b1dc1f97ed9428b94d4cadb1c");
  assert.equal(await sha1File(source), "1e5dcbb59b753cb1d46e234d8f6180285b8b86ad");
  assert.match(await sha512IntegrityFile(source), /^sha512-[A-Za-z0-9+/]+={0,2}$/);
});

test("runner source hash is path-aware and changes with any bound file", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "v4-runner-hash-"));
  const sourceFiles = [
    "scripts/run-real-repository-v4.mjs",
    "src/lib/files.mjs",
    "src/lib/git.mjs",
    "src/lib/palace.mjs",
    "src/lib/process.mjs",
    "src/lib/root.mjs",
    "src/lib/system-awake.mjs",
    "src/lib/transcript.mjs",
    "src/lib/v4-execution.mjs",
    "src/lib/v4-protocol.mjs",
    "src/lib/v4-runner.mjs",
    "src/lib/v4-verification.mjs"
  ];
  for (const file of sourceFiles) {
    const target = path.join(root, file);
    await mkdir(path.dirname(target), { recursive: true });
    await runProcess(process.execPath, ["-e", "require('fs').writeFileSync(process.argv[1], process.argv[2])", target, file], { check: true });
  }
  const first = await sha256V4RunnerSources(root);
  await runProcess(process.execPath, ["-e", "require('fs').appendFileSync(process.argv[1], '!')", path.join(root, sourceFiles[0])], { check: true });
  const second = await sha256V4RunnerSources(root);
  assert.match(first, /^[a-f0-9]{64}$/);
  assert.notEqual(first, second);
});

function bindingContext() {
  const blindingKey = "22".repeat(32);
  const privateOracle = {
    schemaVersion: 1,
    protocolVersion: "4.0.0-candidate.1",
    fixtures: [{
      fixtureId: "fixture",
      referenceResolution: {
        url: "https://github.com/example/repository/commit/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        commit: "a".repeat(40)
      },
      correctnessCriteria: ["Correct behavior"],
      exactChangedFiles: ["src/a.ts"],
      forbiddenFiles: ["package.json"],
      expectedChangePolicy: "exact-files"
    }]
  };
  const frozenPlan = {
    schemaVersion: 7,
    protocolVersion: "4.0.0-candidate.1",
    protocolTag: "protocol-v4.0.0-candidate.1",
    frozen: true,
    humanReviewApproved: true,
    executionAllowed: true,
    statistics: { frozenBeforeExecution: true },
    oracle: { commitment: sha256Canonical(privateOracle) },
    blinding: { keyCommitment: commitV4BlindingKey(blindingKey) },
    fixtureManifest: { sha256: "f".repeat(64) },
    execution: { formalAgentTrialsRun: 0 },
    trials: []
  };
  const studyReviewReceipt = { approved: true, receipt: "study" };
  const product = {
    repository: "https://github.com/lohchanhin/vertex-palace",
    sourceCommit: "b".repeat(40),
    packageVersion: "0.4.0-alpha.0",
    tarball: {
      filename: "vertex-palace-0.4.0-alpha.0.tgz",
      sha1: "c".repeat(40),
      sha256: "d".repeat(64),
      sha512Integrity: `sha512-${Buffer.alloc(64, 1).toString("base64")}`
    }
  };
  const executionProfile = buildV4FixtureProfiles({
    requestsLockSha256: "4".repeat(64),
    openWebuiBaselineSha256: "5".repeat(64),
    evaluatorSha256: "6".repeat(64),
    pythonExecutableSha256: "7".repeat(64),
    uvExecutableSha256: "8".repeat(64),
    codexPackageLockSha256: "9".repeat(64)
  });
  const actual = {
    codexVersion: "codex-cli 0.145.0-alpha.18",
    palaceVersion: product.packageVersion,
    runnerSourceCommit: "e".repeat(40),
    runnerSourceSha256: "1".repeat(64),
    productSourceCommit: product.sourceCommit,
    productTarballSha1: product.tarball.sha1,
    productTarballSha256: product.tarball.sha256,
    productTarballIntegrity: product.tarball.sha512Integrity,
    executionProfileSha256: sha256Canonical(executionProfile),
    evaluatorSha256: executionProfile.externalEvaluator.sha256
  };
  return {
    frozenPlan,
    studyReviewReceipt,
    privateOracle,
    blindingKey,
    runnerSourceCommit: actual.runnerSourceCommit,
    runnerSourceSha256: actual.runnerSourceSha256,
    product,
    executionProfile,
    agent: {
      model: "gpt-5.6-sol",
      reasoningEffort: "xhigh",
      codexVersion: actual.codexVersion,
      timeoutMs: 900000,
      cooldownMs: 15000
    },
    generatedAt: "2026-07-21T09:00:00.000Z",
    actual
  };
}
