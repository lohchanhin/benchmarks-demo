import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import {
  adaptiveWilliamsOrders,
  buildAdaptivePilotPlan,
  studyCommand,
  validatePalacePackageLock,
  validateScenarioVariantKey,
  validateStudyPlan
} from "../src/commands/study.mjs";
import { repositoryRoot } from "../src/lib/root.mjs";
import {
  scenarioVariantKeyCommitment,
  seededDecisionMemoryStratum
} from "../src/lib/scenario.mjs";

const testVariantKey = "2222222222222222222222222222222222222222222222222222222222222222";
const palacePackageIntegrity =
  "sha512-DXALXKH1k/Gj7PoprNDmz/tHlYum2T7QsU32el76mHy/U3u42zY02cshm5P8lwY6yqzkIoZ6h9/6df0QOlJp4Q==";

test("committed pilot plan has five paired seeds and distinct orders per scenario", async () => {
  const plan = JSON.parse(await readFile(`${repositoryRoot}/results/pilot/plan.json`, "utf8"));
  assert.equal(validateStudyPlan(plan), true);
  assert.equal(plan.frozen, true);
  assert.equal(plan.trials.length, 20);

  for (const scenario of [
    "small-local-bug",
    "cross-stack-regression",
    "tenant-memory-pitfall",
    "stale-memory-adversarial"
  ]) {
    const trials = plan.trials.filter((trial) => trial.scenario === scenario);
    assert.equal(trials.length, 5);
    assert.equal(new Set(trials.map((trial) => trial.seed)).size, 5);
    assert.equal(new Set(trials.map((trial) => trial.order.join(","))).size, 5);
  }
});

test("adaptive pilot balances four arms, positions, and Palace index state", () => {
  const plan = buildAdaptivePilotPlan({ codexVersion: "codex-cli test" });
  plan.frozen = true;
  assert.equal(validateStudyPlan(plan), true);
  assert.equal(plan.protocolVersion, "2.2.0");
  assert.equal(plan.execution.palaceVersion, "0.2.1");
  assert.equal(plan.execution.platform, "win32");
  assert.equal(plan.execution.sandboxProfile, "workspace-write/windows-elevated");
  assert.equal(plan.execution.lastMessageTransport, "workspace-local-then-artifacts-v1");
  assert.equal(plan.trials.length, 16);

  for (const scenario of [
    "small-local-bug",
    "cross-stack-regression",
    "tenant-memory-pitfall",
    "stale-memory-adversarial"
  ]) {
    const trials = plan.trials.filter((trial) => trial.scenario === scenario);
    assert.equal(trials.length, 4);
    assert.equal(new Set(trials.map((trial) => trial.order.join(","))).size, adaptiveWilliamsOrders.length);
    assert.equal(trials.filter((trial) => trial.cacheState === "warm").length, 2);
    assert.equal(trials.filter((trial) => trial.cacheState === "cold").length, 2);
    for (let position = 0; position < 4; position += 1) {
      assert.equal(new Set(trials.map((trial) => trial.order[position])).size, 4);
    }
  }

  for (const order of adaptiveWilliamsOrders) {
    const matching = plan.trials.filter((trial) => trial.order.join(",") === order.join(","));
    assert.equal(matching.filter((trial) => trial.cacheState === "warm").length, 2);
    assert.equal(matching.filter((trial) => trial.cacheState === "cold").length, 2);
  }
});

test("committed adaptive pilot plan validates against protocol v2", async () => {
  const plan = JSON.parse(await readFile(`${repositoryRoot}/results/adaptive-pilot/plan.json`, "utf8"));
  assert.equal(validateStudyPlan(plan), true);
  assert.equal(plan.frozen, true);
  assert.equal(plan.trials.length, 16);
});

test("committed successor plan uses fresh v2.1 ids and seeds", async () => {
  const [v2, successor] = await Promise.all([
    readFile(`${repositoryRoot}/results/adaptive-pilot/plan.json`, "utf8").then(JSON.parse),
    readFile(`${repositoryRoot}/results/adaptive-pilot-v2.1/plan.json`, "utf8").then(JSON.parse)
  ]);

  assert.equal(validateStudyPlan(successor), true);
  assert.equal(successor.protocolVersion, "2.1.0");
  assert.equal(successor.execution.palaceVersion, "0.2.1");
  assert.equal(successor.trials.length, 16);
  assert.equal(
    successor.trials.every((trial) => trial.trialId.includes("-adaptive-v2-1-pilot-")),
    true
  );
  const oldSeeds = new Set(v2.trials.map((trial) => trial.seed));
  assert.equal(successor.trials.some((trial) => oldSeeds.has(trial.seed)), false);
});

test("refuses to execute a retired adaptive protocol", async () => {
  await assert.rejects(
    studyCommand(new Map([
      ["plan", `${repositoryRoot}/results/adaptive-pilot-v2.1/plan.json`],
      ["execute", true]
    ])),
    /Protocol 2\.1\.0 is retired/
  );
});

test("committed v2.2 plan freezes the corrected harness with fresh ids and seeds", async () => {
  const [v2, v21, successor] = await Promise.all([
    readFile(`${repositoryRoot}/results/adaptive-pilot/plan.json`, "utf8").then(JSON.parse),
    readFile(`${repositoryRoot}/results/adaptive-pilot-v2.1/plan.json`, "utf8").then(JSON.parse),
    readFile(`${repositoryRoot}/results/adaptive-pilot-v2.2/plan.json`, "utf8").then(JSON.parse)
  ]);

  assert.equal(validateStudyPlan(successor), true);
  assert.equal(successor.protocolVersion, "2.2.0");
  assert.equal(successor.execution.platform, "win32");
  assert.equal(successor.execution.sandboxProfile, "workspace-write/windows-elevated");
  assert.equal(successor.execution.lastMessageTransport, "workspace-local-then-artifacts-v1");
  assert.equal(successor.trials.length, 16);
  assert.equal(
    successor.trials.every((trial) => trial.trialId.includes("-adaptive-v2-2-pilot-")),
    true
  );
  const oldSeeds = new Set([...v2.trials, ...v21.trials].map((trial) => trial.seed));
  assert.equal(successor.trials.some((trial) => oldSeeds.has(trial.seed)), false);
});

test("control-first v3 makes Adaptive versus Control primary with a fresh scenario set", async () => {
  const plan = buildAdaptivePilotPlan({
    protocolVersion: "3.0.0",
    codexVersion: "codex-cli 0.145.0-alpha.18",
    variantKey: testVariantKey
  });
  plan.frozen = true;
  assert.equal(validateStudyPlan(plan), true);
  assert.equal(plan.schemaVersion, 6);
  assert.equal(plan.primaryComparison, "adaptive-vs-control");
  assert.equal(plan.primaryEfficiencyMetric, "reportedTokens");
  assert.deepEqual(plan.comparisonOrder, [
    "adaptive-vs-control",
    "adaptive-vs-full",
    "route-only-vs-control",
    "full-vs-route-only"
  ]);
  assert.equal(plan.execution.palaceVersion, "0.3.0");
  assert.equal(plan.execution.palaceSourceCommit, "a29053f5952131887ff057a8fa7e6777ab045e1f");
  assert.equal(plan.execution.palaceReleaseCommit, "1331d9da0aa242549026d70e7c752638c3169044");
  assert.equal(plan.execution.palacePackageShasum, "9a04440d7e95c4d34e68e1b7e2cd3f6ecd62e83e");
  assert.equal(
    plan.execution.palacePackageIntegrity,
    palacePackageIntegrity
  );
  assert.equal(plan.trials.length, 16);
  assert.deepEqual(
    [...new Set(plan.trials.map((trial) => trial.scenario))],
    ["small-local-bug", "cross-stack-regression", "decision-memory-dependent", "stale-memory-adversarial"]
  );
  assert.equal(plan.trials.some((trial) => trial.scenario === "tenant-memory-pitfall"), false);
  const ownerTrials = plan.trials.filter((trial) => trial.scenario === "decision-memory-dependent");
  assert.deepEqual(
    [...new Set(ownerTrials.map((trial) => seededDecisionMemoryStratum(trial.seed)))].sort(),
    [0, 1, 2]
  );
  assert.equal(plan.scenarioVariantPolicy["decision-memory-dependent"].id, "seeded-tenant-owner-v1");
  assert.equal(
    plan.scenarioVariantPolicy["decision-memory-dependent"].blindingKeyCommitment,
    scenarioVariantKeyCommitment(testVariantKey)
  );
  assert.equal(validateScenarioVariantKey(plan, testVariantKey), true);
  assert.throws(
    () => validateScenarioVariantKey(
      plan,
      "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
    ),
    /does not match/
  );
});

test("control-first v3 verifies the exact installed npm tarball before execution", async (context) => {
  const root = await mkdtemp(path.join(tmpdir(), "vertex-palace-package-lock-"));
  context.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, "node_modules", "vertex-palace"), { recursive: true });
  const plan = buildAdaptivePilotPlan({
    protocolVersion: "3.0.0",
    variantKey: testVariantKey
  });
  const packageLock = {
    lockfileVersion: 3,
    packages: {
      "": { dependencies: { "vertex-palace": "0.3.0" } },
      "node_modules/vertex-palace": {
        version: "0.3.0",
        resolved: "https://registry.npmjs.org/vertex-palace/-/vertex-palace-0.3.0.tgz",
        integrity: palacePackageIntegrity
      }
    }
  };
  await Promise.all([
    writeFile(
      path.join(root, "package.json"),
      `${JSON.stringify({ dependencies: { "vertex-palace": "0.3.0" } }, null, 2)}\n`
    ),
    writeFile(path.join(root, "package-lock.json"), `${JSON.stringify(packageLock, null, 2)}\n`),
    writeFile(
      path.join(root, "node_modules", "vertex-palace", "package.json"),
      `${JSON.stringify({ name: "vertex-palace", version: "0.3.0" }, null, 2)}\n`
    )
  ]);

  assert.equal(await validatePalacePackageLock(plan, root), true);
  packageLock.packages["node_modules/vertex-palace"].integrity = "sha512-wrong";
  await writeFile(path.join(root, "package-lock.json"), `${JSON.stringify(packageLock, null, 2)}\n`);
  await assert.rejects(
    validatePalacePackageLock(plan, root),
    /package-lock integrity does not match/
  );
});

test("committed v3 draft is structurally valid, fresh, and intentionally not executable", async () => {
  const draft = JSON.parse(await readFile(`${repositoryRoot}/results/control-first-v3/plan.json`, "utf8"));
  assert.equal(draft.frozen, false);
  assert.equal(draft.trials.length, 16);
  assert.equal(draft.scenarioVariantPolicy["decision-memory-dependent"].blindingKeyCommitment, null);
  const reviewCopy = structuredClone(draft);
  reviewCopy.frozen = true;
  assert.throws(() => validateStudyPlan(reviewCopy), /needs a committed blinding key/);
  reviewCopy.scenarioVariantPolicy["decision-memory-dependent"].blindingKeyCommitment =
    scenarioVariantKeyCommitment(testVariantKey);
  assert.equal(validateStudyPlan(reviewCopy), true);

  const oldPlans = await Promise.all([
    "results/adaptive-pilot/plan.json",
    "results/adaptive-pilot-v2.1/plan.json",
    "results/adaptive-pilot-v2.2/plan.json"
  ].map((relative) => readFile(`${repositoryRoot}/${relative}`, "utf8").then(JSON.parse)));
  const oldSeeds = new Set(oldPlans.flatMap((plan) => plan.trials.map((trial) => trial.seed)));
  assert.equal(draft.trials.some((trial) => oldSeeds.has(trial.seed)), false);
  await assert.rejects(
    studyCommand(new Map([["plan", `${repositoryRoot}/results/control-first-v3/plan.json`]])),
    /must be frozen/
  );
});
