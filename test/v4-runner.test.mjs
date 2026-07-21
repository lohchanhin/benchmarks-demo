import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import {
  buildV4ArmPrompt,
  buildV4ProcessEnvironment,
  completeV4Arm,
  createV4ResultsManifest,
  sanitizeV4Evidence,
  validateV4ResumeManifest
} from "../src/lib/v4-runner.mjs";
import { sha256Canonical } from "../src/lib/v4-protocol.mjs";

test("creates an empty blinded 16-trial manifest bound to the frozen execution amendment", () => {
  const { binding, plan } = runnerContext();
  const manifest = createV4ResultsManifest({
    binding,
    plan,
    bindingCommit: "9".repeat(40),
    createdAt: "2026-07-21T11:00:00.000Z"
  });
  assert.equal(manifest.plannedTrials, 16);
  assert.equal(manifest.plannedArmRuns, 32);
  assert.equal(manifest.completedArmRuns, 0);
  assert.deepEqual(manifest.arms, []);
  assert.equal(manifest.executionBindingSha256, sha256Canonical(binding));
  assert.equal(manifest.trials.every((trial) => !Object.hasOwn(trial, "treatment")), true);
  assert.deepEqual(manifest.trials[0].blindedOrder, ["arm-a", "arm-b"]);
});

test("completed arms are immutable and resume rejects a different execution binding", () => {
  const { binding, plan } = runnerContext();
  const manifest = createV4ResultsManifest({
    binding,
    plan,
    bindingCommit: "9".repeat(40),
    createdAt: "2026-07-21T11:00:00.000Z"
  });
  const completed = completeV4Arm(manifest, {
    armId: "fixture-v4-01-arm-a",
    trialId: "fixture-v4-01",
    blindedLabel: "arm-a",
    sequence: 1,
    status: "completed",
    success: true,
    evidenceSha256: "8".repeat(64),
    completedAt: "2026-07-21T11:10:00.000Z"
  });
  assert.equal(completed.completedArmRuns, 1);
  assert.equal(completed.trials[0].completedArmRuns, 1);
  assert.throws(() => completeV4Arm(completed, completed.arms[0]), /immutable/i);
  assert.doesNotThrow(() => validateV4ResumeManifest(completed, { binding, plan }));
  assert.throws(
    () => validateV4ResumeManifest(completed, { binding: { ...binding, frozenAt: "changed" }, plan }),
    /binding/i
  );
});

test("control and Adaptive prompts preserve the same task while isolating the treatment", () => {
  const fixture = runnerContext().fixture;
  const control = buildV4ArmPrompt({ fixture, treatment: "control" });
  const adaptive = buildV4ArmPrompt({ fixture, treatment: "adaptive-palace" });
  assert.equal(control.includes(fixture.prompt), true);
  assert.equal(adaptive.includes(fixture.prompt), true);
  assert.equal(control.includes("Do not invoke Vertex Palace"), true);
  assert.equal(adaptive.includes(`palace context ${JSON.stringify(fixture.prompt)} --auto`), true);
  assert.equal(adaptive.includes("Current code and tests outrank memory"), true);
  assert.equal(control.includes("exactChangedFiles"), false);
  assert.equal(adaptive.includes("exactChangedFiles"), false);
});

test("prompt exposes frozen baseline and invalid-command adaptations symmetrically", () => {
  const fixture = runnerContext().fixture;
  fixture.verification.commands = ["npm run check", "python -m pytest -q backend/tests"];
  const verificationProfile = [
    {
      command: "npm run check",
      policy: { kind: "baseline-delta", baseline: { errors: 9702, warnings: 274, files: 386 } }
    },
    {
      command: "python -m pytest -q backend/tests",
      policy: { kind: "preflight-invalid", reason: "backend/tests does not exist" }
    }
  ];
  const control = buildV4ArmPrompt({ fixture, treatment: "control", verificationProfile });
  const adaptive = buildV4ArmPrompt({ fixture, treatment: "adaptive-palace", verificationProfile });
  for (const prompt of [control, adaptive]) {
    assert.match(prompt, /9702 errors, 274 warnings/);
    assert.match(prompt, /preflight-invalid/);
    assert.match(prompt, /do not run this absent path/);
  }
});

test("process environment removes Palace from control and prepends the reviewed binary for Adaptive", () => {
  const separator = path.delimiter;
  const inherited = ["C:/Windows/System32", "C:/global-palace", "C:/Node"].join(separator);
  const control = buildV4ProcessEnvironment({
    treatment: "control",
    inheritedPath: inherited,
    palaceBinDirectory: "C:/reviewed-palace",
    forbiddenPalaceDirectories: ["C:/global-palace"]
  });
  const adaptive = buildV4ProcessEnvironment({
    treatment: "adaptive-palace",
    inheritedPath: inherited,
    palaceBinDirectory: "C:/reviewed-palace",
    forbiddenPalaceDirectories: ["C:/global-palace"]
  });
  assert.equal(control.env.PATH.includes("global-palace"), false);
  assert.equal(control.env.PATH.includes("reviewed-palace"), false);
  assert.equal(adaptive.env.PATH.split(separator)[0].replaceAll("\\", "/"), "C:/reviewed-palace");
  assert.equal(adaptive.env.PATH.includes("global-palace"), false);
  assert.equal(control.env.VERTEX_PALACE_BENCHMARK_ARM, "control");
  assert.equal(adaptive.env.VERTEX_PALACE_BENCHMARK_ARM, "adaptive-palace");
});

test("public evidence removes session ids, private paths, treatment labels, and oracle details", () => {
  const evidence = sanitizeV4Evidence({
    armId: "fixture-v4-01-arm-a",
    trialId: "fixture-v4-01",
    blindedLabel: "arm-a",
    treatment: "adaptive-palace",
    sessionId: "019f4280-40ee-7172-b94d-f5aa7aa46814",
    workspace: "C:/Users/HIN/private/runs/arm-a/workspace",
    privateOracle: { exactChangedFiles: ["secret.ts"] },
    transcript: "C:/Users/HIN/private transcript 019f4280-40ee-7172-b94d-f5aa7aa46814",
    metrics: { success: true, reportedTokens: 1234, toolCalls: 9 },
    changedFiles: ["src/a.ts"],
    verification: [
      { command: "npm test", policy: "exit-zero", valid: true, passed: true },
      {
        command: "python -m pytest -q missing",
        policy: "preflight-invalid",
        valid: false,
        passed: null,
        reason: "missing directory"
      }
    ]
  }, {
    privateRoots: ["C:/Users/HIN/private"]
  });
  const serialized = JSON.stringify(evidence);
  assert.equal(evidence.blindedLabel, "arm-a");
  assert.equal(evidence.metrics.reportedTokens, 1234);
  assert.equal(serialized.includes("adaptive-palace"), false);
  assert.equal(serialized.includes("019f4280"), false);
  assert.equal(serialized.includes("private"), false);
  assert.equal(serialized.includes("secret.ts"), false);
  assert.equal(Object.hasOwn(evidence, "transcript"), false);
  assert.equal(evidence.verification[1].valid, false);
  assert.equal(evidence.verification[1].passed, null);
});

function runnerContext() {
  const trials = Array.from({ length: 16 }, (_, index) => ({
    trialId: `fixture-v4-${String(index + 1).padStart(2, "0")}`,
    fixtureId: "fixture",
    taskType: "simple-local",
    replicate: index + 1,
    cacheState: index < 8 ? "cold" : "warm",
    blindedOrder: index % 2 === 0 ? ["arm-a", "arm-b"] : ["arm-b", "arm-a"],
    status: "planned"
  }));
  const plan = {
    protocolVersion: "4.0.0-candidate.1",
    frozen: true,
    humanReviewApproved: true,
    executionAllowed: true,
    execution: { plannedTrials: 16, plannedArmRuns: 32, formalAgentTrialsRun: 0 },
    trials
  };
  const binding = {
    schemaVersion: 1,
    protocolVersion: plan.protocolVersion,
    frozen: true,
    humanReviewApproved: true,
    executionAllowed: true,
    formalAgentArmsRun: 0,
    frozenAt: "2026-07-21T10:01:00.000Z",
    freezeAudit: { passed: true }
  };
  const fixture = {
    id: "fixture",
    prompt: "Fix the focused regression and add a test.",
    issue: { url: "https://github.com/example/repository/issues/1", title: "Focused regression" },
    verification: { commands: ["npm test"] }
  };
  return { binding, plan, fixture };
}
