import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  classifyFiles,
  evaluatePullRequest,
  selectTargets,
  V5_REPOSITORIES
} from "../scripts/prepare-real-repository-v5-targets.mjs";

const rootUrl = new URL("../", import.meta.url);

async function readJson(path) {
  return JSON.parse(await readFile(new URL(path, rootUrl), "utf8"));
}

async function sha256(path) {
  return createHash("sha256")
    .update(await readFile(new URL(path, rootUrl)))
    .digest("hex");
}

test("classifies implementation and focused tests across all V5 languages", () => {
  assert.deepEqual(classifyFiles("python", ["src/click/core.py", "tests/test_core.py", "CHANGES.md"]), {
    implementationFiles: ["src/click/core.py"],
    testFiles: ["tests/test_core.py"],
    auxiliaryFiles: ["CHANGES.md"]
  });
  assert.deepEqual(classifyFiles("go", ["command.go", "command_test.go"]), {
    implementationFiles: ["command.go"],
    testFiles: ["command_test.go"],
    auxiliaryFiles: []
  });
  assert.deepEqual(classifyFiles("rust", ["src/lib.rs", "tests/integration.rs"]), {
    implementationFiles: ["src/lib.rs"],
    testFiles: ["tests/integration.rs"],
    auxiliaryFiles: []
  });
  assert.deepEqual(classifyFiles("typescript", ["src/run.ts", "test/run.test.ts"]), {
    implementationFiles: ["src/run.ts"],
    testFiles: ["test/run.test.ts"],
    auxiliaryFiles: []
  });
});

test("rejects history without a coherent issue and implementation-test pair", () => {
  const result = evaluatePullRequest(
    V5_REPOSITORIES[0],
    {
      number: 1,
      title: "Fix behavior",
      url: "https://github.com/pallets/click/pull/1",
      mergedAt: "2026-01-01T00:00:00Z",
      baseRefOid: "a".repeat(40),
      mergeCommit: { oid: "b".repeat(40) },
      author: { login: "person" },
      files: { totalCount: 2, nodes: [
        { path: "src/click/core.py", additions: 1, deletions: 1 },
        { path: "README.md", additions: 1, deletions: 0 }
      ] },
      closingIssuesReferences: { nodes: [] }
    },
    "1".repeat(64)
  );
  assert.equal(result.eligible, false);
  assert.ok(result.reasons.includes("missing-coherent-linked-issue"));
  assert.ok(result.reasons.includes("no-focused-test-file"));
});

test("selects exactly three deterministic non-overlapping targets per repository", () => {
  const seed = "2".repeat(64);
  const eligible = V5_REPOSITORIES.flatMap((repository) => {
    const name = `${repository.owner}/${repository.name}`;
    return [0, 1, 2, 3].map((index) => ({
      repository: name,
      language: repository.language,
      baseCommit: `${index}`.repeat(40),
      mergeCommit: `${index + 4}`.repeat(40),
      mergedAt: "2026-01-01T00:00:00Z",
      pullRequest: { number: index + 1, title: `Fix ${index}`, url: `https://github.com/${name}/pull/${index + 1}` },
      issue: { number: index + 10, title: `Issue ${index}`, url: `https://github.com/${name}/issues/${index + 10}`, body: "A coherent issue body with enough task evidence." },
      changedLines: 20,
      rankHash: `${index}`.repeat(64),
      oracle: {
        exactChangedFiles: index === 0 ? ["a", "b", "c", "d"] : ["a", "b"],
        implementationFiles: ["a"],
        testFiles: ["b"],
        auxiliaryFiles: index === 0 ? ["c", "d"] : []
      }
    }));
  });
  const first = selectTargets(eligible, seed);
  const second = selectTargets(eligible, seed);
  assert.deepEqual(first, second);
  assert.equal(first.length, 12);
  for (const repository of V5_REPOSITORIES) {
    const matches = first.filter((target) => target.repository === `${repository.owner}/${repository.name}`);
    assert.equal(matches.length, 3);
    assert.equal(new Set(matches.map((target) => target.pullRequest.number)).size, 3);
  }
});

test("frozen V5 artifacts and semantic review remain immutable", async () => {
  const freeze = await readJson("protocol/v5/freeze.json");
  const targets = await readJson("protocol/v5/targets.frozen.json");
  const review = await readJson("protocol/v5/semantic-review.json");

  assert.equal(freeze.status, "frozen-before-palace-observation");
  assert.equal(targets.targets.length, 12);
  assert.equal(review.reviewedBeforeTargetRouting, true);
  assert.equal(review.replacementAfterReview, false);
  assert.equal(review.summary.coherent, 12);
  assert.equal(review.summary.unrelated, 0);
  assert.equal(review.summary.uncertain, 0);

  assert.equal(
    await sha256("scripts/prepare-real-repository-v5-targets.mjs"),
    freeze.artifacts.selectorSha256
  );
  assert.equal(await sha256("protocol/v5/target-pool.json"), freeze.artifacts.targetPoolSha256);
  assert.equal(await sha256("protocol/v5/targets.frozen.json"), freeze.artifacts.targetsSha256);

  const strata = new Map();
  for (const target of targets.targets) {
    const key = `${target.language}:${target.stratum}`;
    strata.set(key, (strata.get(key) ?? 0) + 1);
  }
  for (const language of ["python", "go", "rust", "typescript"]) {
    for (const stratum of ["local-complete", "reference-grounded", "high-connectivity"]) {
      assert.equal(strata.get(`${language}:${stratum}`), 1);
    }
  }

  assert.deepEqual(
    review.targets.map((target) => target.id).sort(),
    targets.targets.map((target) => target.id).sort()
  );
  for (const target of review.targets) {
    assert.equal(target.verdict, "coherent");
    assert.match(target.diffSha256, /^[a-f0-9]{64}$/);
  }
});
