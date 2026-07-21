import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readJson, writeJson } from "../src/lib/files.mjs";
import { runProcess } from "../src/lib/process.mjs";
import { repositoryRoot } from "../src/lib/root.mjs";
import { prepareV4SourceCache, sha256File } from "../src/lib/v4-execution.mjs";
import { buildV4FixtureProfiles, parseSvelteCheckSummary } from "../src/lib/v4-verification.mjs";

const privateRoot = path.join(repositoryRoot, ".benchmark-private", "v4");
const runtimeRoot = path.join(privateRoot, "runtimes");
const fixturePath = path.join(repositoryRoot, "protocol", "v4", "fixtures.candidates.json");
const lockPath = path.join(repositoryRoot, "protocol", "v4", "dependencies", "requests-win-py311.txt");
const baselinePath = path.join(privateRoot, "baselines", "open-webui-check.txt");
const evaluatorPath = path.join(privateRoot, "evaluator.mjs");
const profilePath = path.join(repositoryRoot, "protocol", "v4", "execution.profile.json");
const evidencePath = path.join(
  repositoryRoot,
  "docs",
  "research",
  "evidence",
  "real-repository-v4-agent-preflight.json"
);

export async function prepareV4ExecutionProfile() {
  const fixtureManifest = await readJson(fixturePath);
  const systemPython = path.join(process.env.LOCALAPPDATA, "Programs", "Python", "Python311", "python.exe");
  const uvExecutable = path.join(runtimeRoot, "python-tools", "Scripts", "uv.exe");
  const codexLock = path.join(privateRoot, "codex-cli", "package-lock.json");
  const [
    requestsLockSha256,
    openWebuiBaselineSha256,
    evaluatorSha256,
    pythonExecutableSha256,
    uvExecutableSha256,
    codexPackageLockSha256,
    baselineSource
  ] = await Promise.all([
    sha256File(lockPath),
    sha256File(baselinePath),
    sha256File(evaluatorPath),
    sha256File(systemPython),
    sha256File(uvExecutable),
    sha256File(codexLock),
    readFile(baselinePath, "utf8")
  ]);
  const profile = buildV4FixtureProfiles({
    requestsLockSha256,
    openWebuiBaselineSha256,
    evaluatorSha256,
    pythonExecutableSha256,
    uvExecutableSha256,
    codexPackageLockSha256
  });
  const observedBaseline = parseSvelteCheckSummary(baselineSource);
  assert.deepEqual(
    observedBaseline,
    profile.fixtures["open-webui-analytics-25919"].verification[0].policy.baseline,
    "Open WebUI observed baseline differs from the bound profile"
  );

  const nodeRoot = path.join(runtimeRoot, "node-v22.23.1-win-x64");
  const toolsRoot = path.join(runtimeRoot, "python-tools", "Scripts");
  const codex = path.join(privateRoot, "codex-cli", "node_modules", ".bin", "codex.cmd");
  const versions = {
    node: await version(path.join(nodeRoot, "node.exe"), ["--version"]),
    npm: await version(path.join(nodeRoot, "npm.cmd"), ["--version"], true),
    pnpm: await version(path.join(nodeRoot, "pnpm.cmd"), ["--version"], true, {
      COREPACK_HOME: path.join(runtimeRoot, "corepack")
    }),
    python: await version(
      systemPython,
      ["--version"]
    ),
    uv: await version(path.join(toolsRoot, "uv.exe"), ["--version"]),
    codex: await version(codex, ["--version"], true)
  };
  assert.match(versions.node, /^v22\.23\.1$/);
  assert.equal(versions.npm, "10.9.8");
  assert.equal(versions.pnpm, "10.12.1");
  assert.match(versions.python, /^Python 3\.11\.9$/);
  assert.match(versions.uv, /^uv 0\.11\.30\b/);
  assert.equal(versions.codex, "codex-cli 0.145.0-alpha.28");

  const sourceChecks = [];
  for (const fixture of fixtureManifest.fixtures) {
    const cache = await prepareV4SourceCache({
      fixture,
      cacheRoot: path.join(privateRoot, "cache")
    });
    const commit = await runProcess(
      "git",
      ["--git-dir", cache, "cat-file", "-t", `${fixture.repository.frozenCommit}^{commit}`],
      { check: true }
    );
    sourceChecks.push({
      fixtureId: fixture.id,
      frozenCommit: fixture.repository.frozenCommit,
      objectType: commit.stdout.trim(),
      available: commit.stdout.trim() === "commit"
    });
  }

  const evidence = {
    schemaVersion: 1,
    protocolVersion: fixtureManifest.protocolVersion,
    status: "passed-with-preregistered-platform-adaptations",
    generatedAt: new Date().toISOString(),
    formalAgentArmsRun: 0,
    runtimeVersions: versions,
    sourceChecks,
    baselines: {
      zodTransform: { testsPassed: 34, errors: 0 },
      zodDecision: { testsPassed: 54, errors: 0 },
      requestsWindows: {
        testsPassed: 335,
        skipped: 1,
        deselected: 1,
        xfailed: 1,
        adaptation: "one unrelated TLS symlink test deselected before execution"
      },
      openWebui: {
        command: "npm run check",
        exitCode: 1,
        ...observedBaseline,
        outputSha256: openWebuiBaselineSha256,
        adaptation: "score no-new-diagnostics relative to the frozen baseline"
      },
      openWebuiBackendTests: {
        command: "python -m pytest -q backend/tests",
        valid: false,
        reason: "backend/tests does not exist at the frozen commit",
        adaptation: "preserve the invalid command publicly and use the committed hidden-evaluator hash"
      }
    },
    commitments: {
      requestsDependencyLockSha256: requestsLockSha256,
      openWebuiBaselineOutputSha256: openWebuiBaselineSha256,
      privateEvaluatorSha256: evaluatorSha256,
      pythonExecutableSha256,
      uvExecutableSha256,
      codexPackageLockSha256
    },
    executionProfilePath: "protocol/v4/execution.profile.json",
    agentInvoked: false
  };
  await writeJson(profilePath, profile);
  await writeJson(evidencePath, evidence);
  return { profile, evidence };
}

async function version(command, args, windowsShim = false, env = {}) {
  const result = await runProcess(command, args, { check: true, windowsShim, env });
  return `${result.stdout}${result.stderr}`.trim();
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await prepareV4ExecutionProfile();
  process.stdout.write(
    `Wrote V4 execution profile with ${result.evidence.sourceChecks.length} verified frozen sources and 0 Agent arms.\n`
  );
}
