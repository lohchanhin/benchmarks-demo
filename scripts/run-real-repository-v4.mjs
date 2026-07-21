import assert from "node:assert/strict";
import { appendFile, mkdir, readFile, rm, symlink } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { collectGitEvidence } from "../src/lib/git.mjs";
import { pathExists, readJson, writeJson, writeText } from "../src/lib/files.mjs";
import { invalidatePalaceIndex } from "../src/lib/palace.mjs";
import { runProcess } from "../src/lib/process.mjs";
import { repositoryRoot } from "../src/lib/root.mjs";
import { startSystemAwake } from "../src/lib/system-awake.mjs";
import { parseCodexTranscript } from "../src/lib/transcript.mjs";
import {
  assertV4FormalExecutionAllowed,
  codexV4Arguments,
  materializeV4Workspace,
  resolveV4BlindedOrder,
  scoreV4Arm,
  sha256File
} from "../src/lib/v4-execution.mjs";
import {
  buildV4ArmPrompt,
  buildV4ProcessEnvironment,
  completeV4Arm,
  sanitizeV4Evidence,
  validateV4ResumeManifest
} from "../src/lib/v4-runner.mjs";
import { sha256Canonical } from "../src/lib/v4-protocol.mjs";
import {
  buildV4ExecutionEnvironment,
  evaluateV4Verification,
  validateAsciiWorkspaceRoot
} from "../src/lib/v4-verification.mjs";

const protocolRoot = path.join(repositoryRoot, "protocol", "v4");
const privateRoot = path.join(repositoryRoot, ".benchmark-private", "v4");
const resultsRoot = path.join(repositoryRoot, "results", "real-repository-v4");
const manifestPath = path.join(resultsRoot, "manifest.json");
const defaultRuntimeRoot = path.join(privateRoot, "runtimes");
const defaultFormalRoot = path.join(
  process.env.LOCALAPPDATA || path.join(process.env.USERPROFILE || "C:/Users/Public", "AppData", "Local"),
  "VertexPalaceBenchmark",
  "v4",
  "formal"
);

export async function runV4(options) {
  const context = await loadContext(options);
  if (options.prepareOnly) return prepareOnly(context, options);
  assertV4FormalExecutionAllowed(context.binding, context.gate);
  validateV4ResumeManifest(context.manifest, { binding: context.binding, plan: context.plan });
  await assertFormalRepositoryState(context.manifest.executionBindingCommit);

  const selectedTrials = selectTrials(context.plan.trials, options);
  const awake = await startSystemAwake();
  assert.equal(awake.active, true, "Formal V4 Agent execution requires the Windows system-awake guard");
  try {
    for (const trial of selectedTrials) {
      await executeTrial(context, trial, options);
    }
  } finally {
    const stopped = await awake.stop();
    if (stopped.exitCode !== 0 || stopped.stderr) {
      throw new Error(`V4 system-awake guard did not stop cleanly (exit ${stopped.exitCode ?? "unknown"})`);
    }
  }
  return readJson(manifestPath);
}

async function loadContext(options) {
  const paths = {
    plan: path.join(protocolRoot, "plan.frozen.json"),
    fixtures: path.join(protocolRoot, "fixtures.candidates.json"),
    binding: path.join(protocolRoot, "execution.binding.frozen.json"),
    gate: path.join(protocolRoot, "execution.gate.json"),
    oracle: options.oraclePath || path.join(privateRoot, "oracle.json"),
    key: options.keyPath || path.join(privateRoot, "blinding-key.txt"),
    evaluator: options.evaluatorPath || path.join(privateRoot, "evaluator.mjs")
  };
  const [plan, fixtureManifest, binding, gate, oracle, manifest, blindingKey] = await Promise.all([
    readJson(paths.plan),
    readJson(paths.fixtures),
    readJson(paths.binding),
    readJson(paths.gate),
    readJson(paths.oracle),
    readJson(manifestPath),
    readFile(paths.key, "utf8").then((value) => value.trim())
  ]);
  const fixtures = new Map(fixtureManifest.fixtures.map((fixture) => [fixture.id, fixture]));
  const oracleFixtures = new Map(oracle.fixtures.map((fixture) => [fixture.fixtureId, fixture]));
  const evaluatorSha256 = await sha256File(paths.evaluator);
  assert.equal(evaluatorSha256, binding.evaluator.sourceSha256, "Private evaluator changed after execution freeze");
  assert.equal(sha256Canonical(binding), manifest.executionBindingSha256, "Results manifest binding mismatch");
  const runtime = resolveRuntime(options);
  validateAsciiWorkspaceRoot(runtime.formalRoot);
  return {
    plan,
    binding,
    gate,
    manifest,
    fixtures,
    oracleFixtures,
    blindingKey,
    evaluatorPath: paths.evaluator,
    runtime
  };
}

function resolveRuntime(options) {
  if (!process.env.LOCALAPPDATA && !options.python) {
    throw new Error("V4 Windows execution requires LOCALAPPDATA or an explicit --python path");
  }
  const runtimeRoot = path.resolve(options.runtimeRoot || defaultRuntimeRoot);
  const nodeBin = path.join(runtimeRoot, "node-v22.23.1-win-x64");
  const pythonTools = path.join(runtimeRoot, "python-tools", "Scripts");
  const palaceInstall = path.resolve(options.palaceInstall || path.join(privateRoot, "palace-install"));
  const codexBin = path.resolve(
    options.codexBin || path.join(privateRoot, "codex-cli", "node_modules", ".bin", "codex.cmd")
  );
  return {
    formalRoot: path.resolve(options.formalRoot || defaultFormalRoot),
    runtimeRoot,
    nodeBin,
    node: path.join(nodeBin, "node.exe"),
    npm: path.join(nodeBin, "npm.cmd"),
    pnpm: path.join(nodeBin, "pnpm.cmd"),
    uv: path.join(pythonTools, "uv.exe"),
    systemPython: path.resolve(
      options.python || path.join(process.env.LOCALAPPDATA, "Programs", "Python", "Python311", "python.exe")
    ),
    corepackHome: path.join(runtimeRoot, "corepack"),
    codexBin,
    palaceInstall,
    palaceBinDirectory: path.join(palaceInstall, "node_modules", ".bin"),
    palaceCli: path.join(palaceInstall, "node_modules", "vertex-palace", "dist", "palace.cjs"),
    cacheRoot: path.join(privateRoot, "cache"),
    rawRoot: path.join(privateRoot, "raw"),
    dependencyRoot: path.resolve(options.formalRoot || defaultFormalRoot, "dependencies"),
    runsRoot: path.resolve(options.formalRoot || defaultFormalRoot, "runs")
  };
}

async function prepareOnly(context, options) {
  const selectedFixtures = selectFixtureIds(context.plan.trials, options);
  const report = {
    schemaVersion: 1,
    protocolVersion: context.plan.protocolVersion,
    status: "no-agent-dry-run",
    generatedAt: new Date().toISOString(),
    formalAgentArmsRun: 0,
    fixtures: []
  };
  for (const fixtureId of selectedFixtures) {
    const fixture = requireFixture(context, fixtureId);
    const bundle = await prepareDependencyBundle(context, fixture);
    const trial = context.plan.trials.find((entry) => entry.fixtureId === fixtureId);
    const armId = `dry-run-${fixtureId}`;
    const dryRoot = path.join(context.runtime.formalRoot, "dry-run");
    await safeRemove(path.join(dryRoot, armId), dryRoot);
    const materialized = await materializeV4Workspace({
      fixture,
      armId,
      cacheRoot: context.runtime.cacheRoot,
      runsRoot: dryRoot
    });
    await attachDependencies(materialized.workspace, bundle);
    const head = (await runProcess("git", ["rev-parse", "HEAD"], {
      cwd: materialized.workspace,
      check: true
    })).stdout.trim();
    report.fixtures.push({
      fixtureId,
      frozenCommit: fixture.repository.frozenCommit,
      workspaceCommitMatches: head === fixture.repository.frozenCommit,
      dependencyBundle: bundle.kind,
      verificationPolicies: context.binding.executionProfile.fixtures[fixtureId].verification.map(
        (entry) => entry.policy.kind
      ),
      trialScheduleObserved: Boolean(trial),
      agentInvoked: false
    });
  }
  report.passed = report.fixtures.every((fixture) => fixture.workspaceCommitMatches && fixture.agentInvoked === false);
  const output = path.join(repositoryRoot, "docs", "research", "evidence", "real-repository-v4-no-agent-dry-run.json");
  await writeJson(output, report);
  return report;
}

async function executeTrial(context, trial, options) {
  const fixture = requireFixture(context, trial.fixtureId);
  const treatments = resolveV4BlindedOrder(trial, context.blindingKey);
  for (let index = 0; index < trial.blindedOrder.length; index += 1) {
    const blindedLabel = trial.blindedOrder[index];
    const treatment = treatments[index];
    const armId = `${trial.trialId}-${blindedLabel}`;
    context.manifest = await readJson(manifestPath);
    validateV4ResumeManifest(context.manifest, { binding: context.binding, plan: context.plan });
    if (context.manifest.arms.some((arm) => arm.armId === armId)) {
      process.stdout.write(`Skipping immutable completed V4 arm ${armId}\n`);
      continue;
    }
    const completed = await executeArmWithRetry(context, { fixture, trial, blindedLabel, treatment, armId, sequence: index + 1 }, options);
    if (!completed) throw new Error(`${armId} exhausted infrastructure retries without a valid Agent session`);
    if (context.binding.agent.cooldownMs > 0) await delay(context.binding.agent.cooldownMs);
  }
}

async function executeArmWithRetry(context, arm, options) {
  const maxAttempts = options.maxInfrastructureRetries + 1;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const result = await executeArm(context, arm, attempt);
    if (!result.infrastructureFailure) return true;
    await recordInfrastructureAttempt(context, arm, attempt, result.infrastructureReason);
  }
  return false;
}

async function executeArm(context, arm, attempt) {
  const { fixture, trial, blindedLabel, treatment, armId, sequence } = arm;
  const profile = context.binding.executionProfile.fixtures[fixture.id];
  const bundle = await prepareDependencyBundle(context, fixture);
  const attemptArmId = attempt === 1 ? armId : `${armId}-retry-${attempt}`;
  const attemptRoot = path.join(context.runtime.runsRoot, attemptArmId);
  await safeRemove(attemptRoot, context.runtime.runsRoot);
  const materialized = await materializeV4Workspace({
    fixture,
    armId: attemptArmId,
    cacheRoot: context.runtime.cacheRoot,
    runsRoot: context.runtime.runsRoot
  });
  await attachDependencies(materialized.workspace, bundle);
  await addHarnessExcludes(materialized.workspace);

  if (treatment === "adaptive-palace") {
    await prepareAdaptivePalace(context, fixture, trial, materialized.workspace);
  }

  const rawRoot = path.join(context.runtime.rawRoot, attemptArmId);
  await mkdir(rawRoot, { recursive: true });
  const transcriptPath = path.join(rawRoot, "transcript.jsonl");
  const stderrPath = path.join(rawRoot, "stderr.txt");
  const lastMessagePath = path.join(rawRoot, "last-message.md");
  const promptPath = path.join(rawRoot, "prompt.txt");
  const prompt = buildV4ArmPrompt({ fixture, treatment, verificationProfile: profile.verification });
  await writeText(promptPath, prompt);

  const inheritedPath = [context.runtime.nodeBin, process.env.PATH || ""].filter(Boolean).join(path.delimiter);
  const forbiddenPalaceDirectories = await discoverPalaceDirectories(context.runtime.palaceBinDirectory);
  const treatmentEnvironment = buildV4ProcessEnvironment({
    treatment,
    inheritedPath,
    palaceBinDirectory: context.runtime.palaceBinDirectory,
    forbiddenPalaceDirectories
  });
  const { PATH: treatmentPath, Path: _treatmentPathAlias, ...treatmentExtra } = treatmentEnvironment.env;
  const environment = buildV4ExecutionEnvironment({
    inheritedPath: treatmentPath,
    nodeBin: context.runtime.nodeBin,
    pythonBin: bundle.pythonBin,
    dependencyBin: bundle.dependencyBin,
    corepackHome: context.runtime.corepackHome,
    extra: {
      ...profile.environment,
      ...treatmentExtra,
      NO_COLOR: "1",
      FORCE_COLOR: "0"
    }
  });
  const args = codexV4Arguments({
    workspace: materialized.workspace,
    model: context.binding.agent.model,
    reasoningEffort: context.binding.agent.reasoningEffort,
    lastMessagePath
  });
  const execution = await runProcess(context.runtime.codexBin, args, {
    cwd: materialized.workspace,
    windowsShim: true,
    timeoutMs: context.binding.agent.timeoutMs,
    input: prompt,
    env: environment,
    unsetEnv: treatmentEnvironment.unsetEnv,
    stdoutPath: transcriptPath,
    stderrPath
  });
  const transcript = execution.stdout;
  const lastMessage = await readOptionalText(lastMessagePath);
  const parsed = parseCodexTranscript(transcript, [], fixture.prompt);
  const infrastructureReason = classifyInfrastructureFailure(execution, parsed);
  if (infrastructureReason) {
    await writeJson(path.join(rawRoot, "attempt.json"), {
      schemaVersion: 1,
      armId,
      attempt,
      infrastructureFailure: true,
      reason: infrastructureReason,
      execution: summarizeExecution(execution),
      transcript: parsed
    });
    return { infrastructureFailure: true, infrastructureReason };
  }

  const verification = [];
  for (const entry of profile.verification) {
    if (entry.policy.kind === "preflight-invalid") {
      verification.push(evaluateV4Verification({
        command: entry.command,
        exitCode: 4,
        output: entry.policy.reason,
        policy: entry.policy,
        durationMs: 0
      }));
      continue;
    }
    const commandResult = await runVerificationCommand(entry.command, materialized.workspace, environment, context.runtime);
    const combined = `${commandResult.stdout}\n${commandResult.stderr}`;
    await writeText(path.join(rawRoot, `verification-${verification.length + 1}.txt`), combined);
    verification.push(evaluateV4Verification({
      command: entry.command,
      exitCode: commandResult.exitCode,
      output: combined,
      policy: entry.policy,
      durationMs: commandResult.durationMs
    }));
  }

  const git = await collectGitEvidence(materialized.workspace);
  const evaluator = await import(`${pathToFileURL(context.evaluatorPath).href}?sha=${context.binding.evaluator.sourceSha256}`);
  const privateEvaluation = await evaluator.evaluateV4PrivateArm({
    fixtureId: fixture.id,
    workspace: materialized.workspace,
    lastMessage,
    verification
  });
  const oracle = context.oracleFixtures.get(fixture.id);
  assert.ok(oracle, `Private oracle is missing ${fixture.id}`);
  const scored = scoreV4Arm({
    correctnessPassed: privateEvaluation.correctnessPassed,
    changedFiles: git.changedFiles,
    exactChangedFiles: oracle.exactChangedFiles,
    forbiddenFiles: oracle.forbiddenFiles,
    diffCheckPassed: git.diffCheckPassed,
    executionPassed: execution.exitCode === 0 && execution.timedOut !== true
  });
  const usage = parsed.usage || {};
  const rawEvidence = {
    schemaVersion: 1,
    protocolVersion: context.plan.protocolVersion,
    armId,
    trialId: trial.trialId,
    blindedLabel,
    treatment,
    sessionId: parsed.sessionId,
    workspace: materialized.workspace,
    privateOracle: oracle,
    privateEvaluation,
    lastMessage,
    metrics: {
      ...scored,
      reportedTokens: usage.totalTokens || 0,
      inputTokens: usage.inputTokens || 0,
      outputTokens: usage.outputTokens || 0,
      cachedInputTokens: usage.cachedInputTokens || 0,
      toolCalls: parsed.toolCalls || 0,
      failedCalls: parsed.failedCalls || 0,
      wallTimeMs: execution.durationMs
    },
    changedFiles: git.changedFiles,
    verification,
    git,
    execution: summarizeExecution(execution),
    transcriptMetrics: parsed
  };
  await writeJson(path.join(rawRoot, "evidence.private.json"), rawEvidence);
  const publicEvidence = sanitizeV4Evidence(rawEvidence, {
    privateRoots: [context.runtime.formalRoot, privateRoot]
  });
  const publicDirectory = path.join(resultsRoot, armId);
  await mkdir(publicDirectory, { recursive: true });
  const evidencePath = path.join(publicDirectory, "evidence.json");
  await writeJson(evidencePath, publicEvidence);
  const evidenceSha256 = await sha256File(evidencePath);
  const latest = await readJson(manifestPath);
  const next = completeV4Arm(latest, {
    armId,
    trialId: trial.trialId,
    fixtureId: fixture.id,
    blindedLabel,
    sequence,
    status: "completed",
    success: scored.success,
    evidencePath: path.relative(repositoryRoot, evidencePath).replaceAll("\\", "/"),
    evidenceSha256,
    completedAt: new Date().toISOString()
  });
  await writeJson(manifestPath, next);
  process.stdout.write(
    `Completed ${armId}: success=${scored.success}; tokens=${usage.totalTokens || 0}; time=${execution.durationMs}ms\n`
  );
  return { infrastructureFailure: false };
}

async function prepareDependencyBundle(context, fixture) {
  const profile = context.binding.executionProfile.fixtures[fixture.id];
  const profileSha256 = sha256Canonical(profile);
  const root = path.join(context.runtime.dependencyRoot, fixture.id);
  const workspace = path.join(root, "workspace");
  const markerPath = path.join(root, "bundle.json");
  if (await pathExists(markerPath)) {
    const marker = await readJson(markerPath);
    if (marker.frozenCommit === fixture.repository.frozenCommit && marker.profileSha256 === profileSha256) {
      return dependencyBundleDescriptor(fixture, workspace);
    }
    await safeRemove(root, context.runtime.dependencyRoot);
  } else if (await pathExists(root)) {
    await safeRemove(root, context.runtime.dependencyRoot);
  }
  await materializeV4Workspace({
    fixture,
    armId: fixture.id,
    cacheRoot: context.runtime.cacheRoot,
    runsRoot: context.runtime.dependencyRoot
  });
  const environment = buildV4ExecutionEnvironment({
    inheritedPath: process.env.PATH || "",
    nodeBin: context.runtime.nodeBin,
    pythonBin: path.dirname(context.runtime.systemPython),
    dependencyBin: context.runtime.nodeBin,
    corepackHome: context.runtime.corepackHome,
    extra: {
      ...profile.environment,
      UV_CACHE_DIR: path.join(privateRoot, "uv-cache"),
      PNPM_HOME: context.runtime.nodeBin
    }
  });
  if (fixture.id.startsWith("zod-")) {
    await runProcess(context.runtime.pnpm, ["install", "--frozen-lockfile", "--ignore-scripts"], {
      cwd: workspace,
      env: environment,
      windowsShim: true,
      timeoutMs: 900_000,
      check: true
    });
  } else if (fixture.id === "requests-stream-regression-7432") {
    const python = path.join(workspace, ".venv", "Scripts", "python.exe");
    const lock = path.join(repositoryRoot, "protocol", "v4", "dependencies", "requests-win-py311.txt");
    await runProcess(context.runtime.uv, ["venv", "--python", context.runtime.systemPython, ".venv"], {
      cwd: workspace, env: environment, check: true, timeoutMs: 300_000
    });
    await runProcess(context.runtime.uv, ["pip", "sync", lock, "--python", python, "--require-hashes", "--link-mode=copy"], {
      cwd: workspace, env: environment, check: true, timeoutMs: 900_000
    });
    await runProcess(context.runtime.uv, ["pip", "install", "--python", python, "--no-deps", "-e", "."], {
      cwd: workspace, env: environment, check: true, timeoutMs: 300_000
    });
  } else if (fixture.id === "open-webui-analytics-25919") {
    await runProcess(context.runtime.uv, ["sync", "--frozen", "--group", "dev", "--no-install-project", "--link-mode=copy"], {
      cwd: workspace, env: environment, check: true, timeoutMs: 1_800_000
    });
    await runProcess(context.runtime.npm, ["ci", "--ignore-scripts", "--no-audit", "--no-fund"], {
      cwd: workspace,
      env: environment,
      windowsShim: true,
      check: true,
      timeoutMs: 1_800_000
    });
  } else {
    throw new Error(`No dependency setup for ${fixture.id}`);
  }
  const head = (await runProcess("git", ["rev-parse", "HEAD"], { cwd: workspace, check: true })).stdout.trim();
  assert.equal(head, fixture.repository.frozenCommit, `${fixture.id} dependency checkout moved`);
  await writeJson(markerPath, {
    schemaVersion: 1,
    fixtureId: fixture.id,
    frozenCommit: fixture.repository.frozenCommit,
    profileSha256,
    preparedAt: new Date().toISOString()
  });
  return dependencyBundleDescriptor(fixture, workspace);
}

function dependencyBundleDescriptor(fixture, workspace) {
  const hasNode = fixture.id.startsWith("zod-") || fixture.id === "open-webui-analytics-25919";
  const hasPython = ["requests-stream-regression-7432", "open-webui-analytics-25919"].includes(fixture.id);
  return {
    kind: "reviewed-shared-bundle",
    workspace,
    nodeModules: hasNode ? path.join(workspace, "node_modules") : null,
    venv: hasPython ? path.join(workspace, ".venv") : null,
    dependencyBin: hasNode ? path.join(workspace, "node_modules", ".bin") : path.join(workspace, ".venv", "Scripts"),
    pythonBin: hasPython ? path.join(workspace, ".venv", "Scripts") : path.dirname(process.execPath)
  };
}

async function attachDependencies(workspace, bundle) {
  if (bundle.nodeModules) await symlink(bundle.nodeModules, path.join(workspace, "node_modules"), "junction");
  if (bundle.venv) await symlink(bundle.venv, path.join(workspace, ".venv"), "junction");
}

async function prepareAdaptivePalace(context, fixture, trial, workspace) {
  assert.equal(await pathExists(context.runtime.palaceCli), true, "Reviewed Palace CLI is not installed");
  const call = (args) => runProcess(context.runtime.node, [context.runtime.palaceCli, ...args], {
    cwd: workspace,
    check: true,
    timeoutMs: 600_000,
    env: { PATH: [context.runtime.nodeBin, process.env.PATH || ""].join(path.delimiter) }
  });
  await call(["init"]);
  await call(["index"]);
  let routeId = null;
  if (fixture.palaceSetup.memoryProfile === "current-owner-decision") {
    await call(["route", fixture.prompt]);
    routeId = (await readJson(path.join(workspace, ".palace", "routes", "latest-route.json"))).id;
    await seedDecisionMemory(call, fixture, routeId);
  } else if (fixture.palaceSetup.memoryProfile === "stale-migration-advice") {
    await call(["route", fixture.prompt]);
    routeId = (await readJson(path.join(workspace, ".palace", "routes", "latest-route.json"))).id;
    await seedStaleMemory(call, fixture, routeId);
  }
  if (trial.cacheState === "cold") await invalidatePalaceIndex(workspace);
}

async function seedDecisionMemory(call, fixture, routeId) {
  await call([
    "memory", "write",
    "--task", "Explain whether failing Zod input values should be included in issues.",
    "--outcome", "success",
    "--client", "zod-v4",
    "--route-id", routeId,
    "--decision", "Use the existing reportInput parse option for explicit opt-in. Preserve privacy by default; no source or documentation change is required.",
    "--test", "pnpm vitest packages/zod/src/v4/classic/tests/error.test.ts|passed|Existing behavior and option verified",
    "--tag", "benchmark", "owner-decision", "privacy-default",
    "--notes", "Current owner decision and documentation outrank feature-request assumptions."
  ]);
}

async function seedStaleMemory(call, fixture, routeId) {
  await call([
    "memory", "write",
    "--task", "Migrate Requests stream detection to collections.abc.Iterable.",
    "--outcome", "success",
    "--client", "requests",
    "--route-id", routeId,
    "--decision", "Historical advice: replace the newer Iterable check with a simple __iter__ check and adjust redirect session handling.",
    "--test", "python -m pytest -q tests/test_requests.py|passed|Historical migration scope",
    "--tag", "benchmark", "stale-memory", "migration",
    "--pitfall", "This record predates the delegated-wrapper regression and may be stale; current code and tests must outrank it."
  ]);
}

async function runVerificationCommand(command, workspace, environment, runtime) {
  if (command.startsWith("pnpm ")) {
    return runProcess(runtime.pnpm, splitCommand(command).slice(1), {
      cwd: workspace, env: environment, windowsShim: true, timeoutMs: 900_000
    });
  }
  if (command === "npm run check") {
    return runProcess(runtime.npm, ["run", "check"], {
      cwd: workspace, env: environment, windowsShim: true, timeoutMs: 900_000
    });
  }
  if (command.startsWith("python ")) {
    return runProcess(path.join(workspace, ".venv", "Scripts", "python.exe"), splitCommand(command).slice(1), {
      cwd: workspace, env: environment, timeoutMs: 900_000
    });
  }
  throw new Error(`Unsupported bound V4 verification command: ${command}`);
}

async function discoverPalaceDirectories(reviewedDirectory) {
  const result = await runProcess("where.exe", ["palace"]);
  const directories = result.exitCode === 0
    ? result.stdout.split(/\r?\n/).filter(Boolean).map((entry) => path.dirname(entry.trim()))
    : [];
  return [...new Set([reviewedDirectory, ...directories])];
}

async function addHarnessExcludes(workspace) {
  const exclude = path.join(workspace, ".git", "info", "exclude");
  await appendFile(exclude, "\n.palace/\n.benchmark-last-message.md\n", "utf8");
}

async function recordInfrastructureAttempt(context, arm, attempt, reason) {
  const manifest = await readJson(manifestPath);
  manifest.attempts.push({
    armId: arm.armId,
    trialId: arm.trial.trialId,
    blindedLabel: arm.blindedLabel,
    attempt,
    status: "infrastructure-failure",
    reason,
    attemptedAt: new Date().toISOString()
  });
  manifest.infrastructureFailures = manifest.attempts.filter(
    (entry) => entry.status === "infrastructure-failure"
  ).length;
  await writeJson(manifestPath, manifest);
  context.manifest = manifest;
}

async function assertFormalRepositoryState(bindingCommit) {
  const [ancestor, status, changed] = await Promise.all([
    runProcess("git", ["merge-base", "--is-ancestor", bindingCommit, "HEAD"], { cwd: repositoryRoot }),
    runProcess("git", ["status", "--porcelain", "--untracked-files=all"], { cwd: repositoryRoot, check: true }),
    runProcess("git", ["diff", "--name-only", `${bindingCommit}..HEAD`], { cwd: repositoryRoot, check: true })
  ]);
  if (ancestor.exitCode !== 0) throw new Error("V4 execution binding commit is not an ancestor of HEAD");
  const allowed = (file) => file.replaceAll("\\", "/").startsWith("results/real-repository-v4/");
  const committedForbidden = lines(changed.stdout).filter((file) => !allowed(file));
  if (committedForbidden.length) {
    throw new Error(`V4 runner changed after binding: ${committedForbidden.join(", ")}`);
  }
  const dirtyForbidden = status.stdout
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => line.slice(3).trim().replaceAll("\\", "/"))
    .filter((file) => !allowed(file));
  if (dirtyForbidden.length) throw new Error(`V4 formal run has unrelated worktree changes: ${dirtyForbidden.join(", ")}`);
}

function classifyInfrastructureFailure(execution, parsed) {
  if (execution.timedOut) return "codex-timeout";
  if (execution.exitCode === 0 && parsed.eventCount > 0 && parsed.malformedLines < parsed.eventCount) return null;
  const detail = `${execution.stderr}\n${execution.stdout}`.toLowerCase();
  if (/unauthori[sz]ed|authentication|login|required|credential/.test(detail)) return "codex-authentication";
  if (/model.*(?:not found|unavailable|unsupported)/.test(detail)) return "codex-model-unavailable";
  if (parsed.eventCount === 0) return "codex-no-json-events";
  return `codex-exit-${execution.exitCode}`;
}

function summarizeExecution(execution) {
  return {
    exitCode: execution.exitCode,
    timedOut: execution.timedOut,
    durationMs: execution.durationMs,
    startedAt: execution.startedAt,
    endedAt: execution.endedAt,
    infrastructureFailure: false
  };
}

function requireFixture(context, fixtureId) {
  const fixture = context.fixtures.get(fixtureId);
  assert.ok(fixture, `Unknown V4 fixture: ${fixtureId}`);
  return fixture;
}

function selectTrials(trials, options) {
  let selected = trials;
  if (options.fixture) selected = selected.filter((trial) => trial.fixtureId === options.fixture);
  if (options.trial) selected = selected.filter((trial) => trial.trialId === options.trial);
  if (options.limit) selected = selected.slice(0, options.limit);
  if (selected.length === 0) throw new Error("No V4 trials match the requested selection");
  return selected;
}

function selectFixtureIds(trials, options) {
  return [...new Set(selectTrials(trials, options).map((trial) => trial.fixtureId))];
}

async function safeRemove(target, root) {
  const resolvedTarget = path.resolve(target);
  const resolvedRoot = path.resolve(root);
  const relative = path.relative(resolvedRoot, resolvedTarget);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Refusing recursive delete outside the V4 runtime root: ${resolvedTarget}`);
  }
  await rm(resolvedTarget, { recursive: true, force: true });
}

function splitCommand(command) {
  return command.match(/(?:[^\s"]+|"[^"]*")+/g)?.map((entry) => entry.replace(/^"|"$/g, "")) ?? [];
}

function lines(value) {
  return value.split(/\r?\n/).map((entry) => entry.trim()).filter(Boolean).map((entry) => entry.replaceAll("\\", "/"));
}

async function readOptionalText(file) {
  try {
    return await readFile(file, "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") return "";
    throw error;
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseOptions(args) {
  const values = new Map();
  const flags = new Set();
  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];
    if (!value.startsWith("--")) throw new Error(`Unexpected argument: ${value}`);
    const name = value.slice(2);
    if (["prepare-only"].includes(name)) {
      flags.add(name);
      continue;
    }
    const next = args[index + 1];
    if (!next || next.startsWith("--")) throw new Error(`--${name} requires a value`);
    values.set(name, next);
    index += 1;
  }
  const numeric = (name, fallback) => {
    const raw = values.get(name);
    if (raw === undefined) return fallback;
    const parsed = Number(raw);
    if (!Number.isInteger(parsed) || parsed < 0) throw new Error(`--${name} must be a non-negative integer`);
    return parsed;
  };
  return {
    prepareOnly: flags.has("prepare-only"),
    fixture: values.get("fixture"),
    trial: values.get("trial"),
    limit: numeric("limit", 0) || undefined,
    maxInfrastructureRetries: numeric("max-infrastructure-retries", 2),
    runtimeRoot: values.get("runtime-root"),
    formalRoot: values.get("formal-root"),
    palaceInstall: values.get("palace-install"),
    codexBin: values.get("codex-bin"),
    python: values.get("python"),
    oraclePath: values.get("oracle"),
    keyPath: values.get("key-file"),
    evaluatorPath: values.get("evaluator")
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const options = parseOptions(process.argv.slice(2));
  const result = await runV4(options);
  process.stdout.write(`${JSON.stringify({ status: result.status, completedArmRuns: result.completedArmRuns ?? 0 }, null, 2)}\n`);
}
