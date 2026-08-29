import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";

const rootUrl = new URL("../", import.meta.url);

test("V5 execution binding pins distinct packages and zero observations", async () => {
  const binding = JSON.parse(await readFile(new URL("protocol/v5/execution.binding.json", rootUrl), "utf8"));
  const amendment = JSON.parse(await readFile(new URL("protocol/v5/execution.amendment-1.json", rootUrl), "utf8"));
  const freeze = JSON.parse(await readFile(new URL("protocol/v5/freeze.json", rootUrl), "utf8"));

  assert.equal(binding.status, "prepared-before-static-observation");
  assert.equal(binding.observationsAtPreparation, 0);
  assert.equal(binding.targetFreeze.productSourceCommit, freeze.productSourceCommit);
  assert.equal(binding.targetFreeze.privateOracleCommitment, freeze.artifacts.privateOracleCommitment);
  assert.equal(binding.conditions.candidate.packageVersion, "0.4.0");
  assert.equal(binding.conditions["baseline-0.4.0"].packageVersion, "0.4.0");
  assert.notEqual(
    binding.conditions.candidate.tarballSha256,
    binding.conditions["baseline-0.4.0"].tarballSha256
  );
  assert.match(JSON.stringify(binding), /"observationsAtPreparation":0/);
  assert.doesNotMatch(JSON.stringify(binding), /[A-Z]:[\\/]|Users[\\/]|工作资料/i);
  assert.equal(amendment.status, "frozen-after-interrupted-attempt");
  assert.equal(amendment.observedBeforeAmendment.selectedTargetCallsStarted, 1);
  assert.equal(amendment.repair.productChanged, false);
  assert.equal(amendment.repair.targetsChanged, false);
  assert.equal(amendment.repair.thresholdsChanged, false);

  const hash = createHash("sha256");
  for (const file of amendment.runner.sourceFiles) {
    const bytes = execFileSync("git", ["show", `${amendment.runner.sourceCommit}:${file}`], {
      cwd: fileURLToPath(rootUrl)
    });
    hash.update(Buffer.from(`${file}\0${bytes.length}\0`, "utf8"));
    hash.update(bytes);
    hash.update(Buffer.from("\0", "utf8"));
  }
  assert.equal(hash.digest("hex"), amendment.runner.sourceSha256);
  assert.equal(
    createHash("sha256")
      .update(await readFile(new URL("results/real-repository-v5/attempt-1-harness-failure.json", rootUrl)))
      .digest("hex"),
    amendment.observedBeforeAmendment.attemptArtifactSha256
  );
});
