import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

const rootUrl = new URL("../", import.meta.url);

test("V5 execution binding pins distinct packages and zero observations", async () => {
  const binding = JSON.parse(await readFile(new URL("protocol/v5/execution.binding.json", rootUrl), "utf8"));
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

  const hash = createHash("sha256");
  for (const file of binding.runner.sourceFiles) {
    const bytes = await readFile(new URL(file, rootUrl));
    hash.update(Buffer.from(`${file}\0${bytes.length}\0`, "utf8"));
    hash.update(bytes);
    hash.update(Buffer.from("\0", "utf8"));
  }
  assert.equal(hash.digest("hex"), binding.runner.sourceSha256);
});
