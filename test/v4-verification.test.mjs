import assert from "node:assert/strict";
import test from "node:test";
import {
  buildV4ExecutionEnvironment,
  buildV4FixtureProfiles,
  evaluateV4Verification,
  parseSvelteCheckSummary,
  validateAsciiWorkspaceRoot
} from "../src/lib/v4-verification.mjs";

test("parses the frozen Open WebUI svelte-check baseline", () => {
  assert.deepEqual(
    parseSvelteCheckSummary("svelte-check found 9702 errors and 274 warnings in 386 files"),
    { errors: 9702, warnings: 274, files: 386 }
  );
  assert.equal(parseSvelteCheckSummary("unrelated output"), null);
});

test("baseline-aware verification accepts no regression but rejects added errors", () => {
  const policy = {
    kind: "baseline-delta",
    baseline: { errors: 9702, warnings: 274, files: 386 }
  };
  const unchanged = evaluateV4Verification({
    command: "npm run check",
    exitCode: 1,
    output: "svelte-check found 9702 errors and 274 warnings in 386 files",
    policy
  });
  assert.equal(unchanged.passed, true);
  assert.equal(unchanged.baselineCompared, true);

  const regression = evaluateV4Verification({
    command: "npm run check",
    exitCode: 1,
    output: "svelte-check found 9703 errors and 274 warnings in 386 files",
    policy
  });
  assert.equal(regression.passed, false);
  assert.equal(regression.delta.errors, 1);
});

test("invalid frozen verification remains visible and is not counted as a failure", () => {
  const result = evaluateV4Verification({
    command: "python -m pytest -q backend/tests",
    exitCode: 4,
    output: "ERROR: file or directory not found: backend/tests",
    policy: {
      kind: "preflight-invalid",
      reason: "backend/tests does not exist at the frozen commit"
    }
  });
  assert.equal(result.valid, false);
  assert.equal(result.passed, null);
  assert.match(result.reason, /does not exist/);
});

test("fixture profiles bind exact runtimes, setup, and Windows exceptions", () => {
  const profiles = buildV4FixtureProfiles({
    requestsLockSha256: "a".repeat(64),
    openWebuiBaselineSha256: "b".repeat(64),
    evaluatorSha256: "c".repeat(64),
    pythonExecutableSha256: "d".repeat(64),
    uvExecutableSha256: "e".repeat(64),
    codexPackageLockSha256: "f".repeat(64)
  });
  assert.equal(profiles.runtimes.node.version, "22.23.1");
  assert.equal(profiles.runtimes.python.version, "3.11.9");
  assert.equal(profiles.runtimes.codex.version, "0.145.0-alpha.28");
  assert.equal(profiles.fixtures["zod-transform-refine-4926"].environment.CI, "1");
  assert.match(
    profiles.fixtures["requests-stream-regression-7432"].environment.PYTEST_ADDOPTS,
    /not test_different_connection_pool/
  );
  assert.equal(
    profiles.fixtures["open-webui-analytics-25919"].verification[0].policy.kind,
    "baseline-delta"
  );
  assert.equal(
    profiles.fixtures["open-webui-analytics-25919"].verification[1].policy.kind,
    "preflight-invalid"
  );
  assert.equal(profiles.externalEvaluator.sha256, "c".repeat(64));
});

test("execution environment pins the reviewed tools ahead of inherited PATH", () => {
  const environment = buildV4ExecutionEnvironment({
    inheritedPath: ["C:/Windows/System32", "C:/Node"].join(";"),
    nodeBin: "C:/reviewed/node",
    pythonBin: "C:/reviewed/python",
    dependencyBin: "C:/reviewed/dependencies",
    corepackHome: "C:/reviewed/corepack",
    extra: { CI: "1" }
  });
  const parts = environment.PATH.split(";").map((entry) => entry.replaceAll("\\", "/"));
  assert.deepEqual(parts.slice(0, 3), [
    "C:/reviewed/dependencies",
    "C:/reviewed/python",
    "C:/reviewed/node"
  ]);
  assert.equal(environment.COREPACK_HOME, "C:/reviewed/corepack");
  assert.equal(environment.CI, "1");
});

test("formal Windows workspaces must use an ASCII-only root", () => {
  assert.equal(validateAsciiWorkspaceRoot("C:/Users/HIN/AppData/Local/VertexPalaceBenchmark/v4"), true);
  assert.throws(() => validateAsciiWorkspaceRoot("D:/工作资料/v4"), /ASCII-only/);
});
