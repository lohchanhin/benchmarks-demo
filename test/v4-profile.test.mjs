import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { readJson } from "../src/lib/files.mjs";
import { repositoryRoot } from "../src/lib/root.mjs";
import { sha256File } from "../src/lib/v4-execution.mjs";

test("committed v4 execution profile matches public preflight commitments", async () => {
  const [profile, preflight, evaluatorSelfTest] = await Promise.all([
    readJson(path.join(repositoryRoot, "protocol", "v4", "execution.profile.json")),
    readJson(path.join(repositoryRoot, "docs", "research", "evidence", "real-repository-v4-agent-preflight.json")),
    readJson(path.join(
      repositoryRoot,
      "docs",
      "research",
      "evidence",
      "real-repository-v4-private-evaluator-self-test.json"
    ))
  ]);
  const lockSha256 = await sha256File(
    path.join(repositoryRoot, "protocol", "v4", "dependencies", "requests-win-py311.txt")
  );
  assert.equal(profile.workspace.rootPolicy, "absolute-ascii-only");
  assert.equal(profile.fixtures["requests-stream-regression-7432"].dependencyLock.sha256, lockSha256);
  assert.deepEqual(
    profile.fixtures["open-webui-analytics-25919"].verification[0].policy.baseline,
    { errors: 9702, warnings: 274, files: 386 }
  );
  assert.equal(preflight.formalAgentArmsRun, 0);
  assert.equal(preflight.agentInvoked, false);
  assert.equal(preflight.commitments.privateEvaluatorSha256, profile.externalEvaluator.sha256);
  assert.equal(evaluatorSelfTest.evaluatorSha256, profile.externalEvaluator.sha256);
  assert.equal(evaluatorSelfTest.fixtures.length, 4);
  assert.equal(evaluatorSelfTest.fixtures.every((fixture) => fixture.referenceAccepted), true);

  const publicSource = JSON.stringify({ profile, preflight, evaluatorSelfTest });
  assert.equal(publicSource.includes("referenceResolution"), false);
  assert.equal(publicSource.includes("exactChangedFiles"), false);
  assert.equal(publicSource.includes("blinding-key"), false);
});
