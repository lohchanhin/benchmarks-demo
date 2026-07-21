import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const documentationFiles = [
  "README.md",
  "README.zh-CN.md",
  "docs/zh-CN/README.md",
  "docs/zh-CN/QUICKSTART.md",
  "docs/zh-CN/RESULTS_GUIDE.md",
  "docs/zh-CN/PROTOCOL_V3.md",
  "docs/zh-CN/PROTOCOL_V4_CANDIDATE.md",
  "docs/zh-CN/VALIDATION_COVERAGE_MATRIX.md",
  "docs/research/VALIDATION_COVERAGE_MATRIX.md",
  "docs/research/PROTOCOL_V4_CANDIDATE.md",
  "protocol/v4/README.md"
];

test("publishes discoverable Simplified Chinese judge guidance", async () => {
  const english = await read("README.md");
  const chinese = await read("README.zh-CN.md");
  const index = await read("docs/zh-CN/README.md");
  const quickstart = await read("docs/zh-CN/QUICKSTART.md");
  const results = await read("docs/zh-CN/RESULTS_GUIDE.md");
  const protocolV3 = await read("docs/zh-CN/PROTOCOL_V3.md");
  const protocolV4 = await read("docs/zh-CN/PROTOCOL_V4_CANDIDATE.md");
  const protocolV4English = await read("docs/research/PROTOCOL_V4_CANDIDATE.md");
  const coverageMatrix = await read("docs/zh-CN/VALIDATION_COVERAGE_MATRIX.md");

  for (const content of [english, chinese]) {
    assert.match(content, /docs\/zh-CN\/README\.md/);
    assert.match(content, /docs\/zh-CN\/QUICKSTART\.md/);
    assert.match(content, /docs\/zh-CN\/RESULTS_GUIDE\.md/);
  }

  assert.match(index, /30 秒结论/);
  assert.match(quickstart, /不会启动 Codex Agent/);
  assert.match(quickstart, /vertex-palace@0\.2\.1/);
  assert.match(quickstart, /--limit 1/);
  assert.match(quickstart, /npm run verify:analysis:adaptive/);
  assert.match(quickstart, /只忽略.*generatedAt/);
  assert.match(results, /Adaptive - Full/);
  assert.match(results, /Adaptive - Control/);
  assert.match(results, /不能说 Vertex Palace.*普遍省 Token/);
  assert.match(results, /不能改写冻结结果/);
  assert.match(protocolV3, /Adaptive Palace 对 Control/);
  assert.match(protocolV3, /frozen:true/);
  assert.match(protocolV3, /公开测试通过/);
  assert.match(protocolV3, /hidden oracle 失败/);
  assert.match(protocolV3, /npm 0\.3\.0 已/);
  assert.match(protocolV3, /19\/19/);
  assert.match(protocolV3, /CONTROL_FIRST_V3_PREFLIGHT\.md/);
  assert.match(protocolV4, /已人工批准并冻结，未执行/);
  assert.match(protocolV4, /16 个 trial、32 个 Agent arm run/);
  assert.match(protocolV4, /代码中刻意没有 `v4-run` 命令/);
  assert.match(protocolV4English, /human-reviewed and frozen, not executed/);
  assert.match(protocolV4English, /cost_per_successful_solution/);
  assert.match(coverageMatrix, /独立 small-OSS 分层/);
  assert.match(coverageMatrix, /尚未单独测试/);
  assert.match(coverageMatrix, /Vertex Palace 普遍节省 Agent Token、时间或工具调用/);
});

test("keeps local links in the Chinese documentation surface resolvable", async () => {
  for (const relativeFile of documentationFiles) {
    const markdown = await read(relativeFile);
    for (const target of localMarkdownTargets(markdown)) {
      const resolved = path.resolve(repositoryRoot, path.dirname(relativeFile), target);
      await assert.doesNotReject(
        stat(resolved),
        `${relativeFile} links to missing local target ${target}`
      );
    }
  }
});

test("pins real-repository evidence to the preregistered Palace package", async () => {
  const plan = JSON.parse(await read("results/control-first-v3/plan.json"));
  const evidence = JSON.parse(
    await read("docs/research/evidence/control-first-v3-public-binding-2026-07-21.json")
  );
  const validation = evidence.realRepositoryValidation;

  assert.equal(validation.sourceCommit, plan.execution.palaceSourceCommit);
  assert.equal(validation.releaseCommit, plan.execution.palaceReleaseCommit);
  assert.equal(validation.candidate.package, `vertex-palace@${plan.execution.palaceVersion}`);
  assert.equal(validation.candidate.distribution, "npm-registry");
  assert.equal(validation.candidate.shasum, plan.execution.palacePackageShasum);
  assert.equal(validation.candidate.integrity, plan.execution.palacePackageIntegrity);
  assert.equal(validation.protocol.repetitionsPerRepository, 2);
  assert.equal(validation.protocol.trackedWorktreeMutationAllowed, false);

  assert.deepEqual(validation.repositories.map((repository) => repository.name), ["zod", "requests"]);
  for (const repository of validation.repositories) {
    assert.equal(repository.targetRecall, 1);
    assert.equal(repository.strictTargetPrecision, 1);
    assert.equal(repository.deterministicRepetitions, "2/2");
    assert.equal(repository.trackedWorktreeClean, true);
    assert.deepEqual(repository.observedFiles, repository.expectedFiles);
  }
});

test("keeps the validation coverage matrix synchronized with published evidence", async () => {
  const matrix = JSON.parse(
    await read("docs/research/evidence/validation-coverage-matrix-2026-07-20.json")
  );
  const planText = await read("results/control-first-v3/plan.json");
  const plan = JSON.parse(planText);
  const manifest = JSON.parse(await read("results/control-first-v3/manifest.json"));
  const firstAnalysis = JSON.parse(await read("results/pilot/analysis.json"));
  const analysis = JSON.parse(await read("results/adaptive-pilot-v2.2/analysis.json"));
  const publicRelease = JSON.parse(
    await read("docs/research/evidence/vertex-palace-0.3.0-public-release-2026-07-20.json")
  );
  const publicBinding = JSON.parse(
    await read("docs/research/evidence/control-first-v3-public-binding-2026-07-21.json")
  );
  const freezeEvidence = JSON.parse(
    await read("docs/research/evidence/control-first-v3-freeze-2026-07-21.json")
  );
  const reveal = JSON.parse(await read("results/control-first-v3/blinding-reveal.json"));
  const rows = new Map(matrix.coverage.map((row) => [row.id, row]));

  const v3 = rows.get("control-first-v3-formal");
  assert.equal(v3.observed.frozen, plan.frozen);
  assert.equal(v3.observed.plannedTrials, plan.trials.length);
  assert.equal(v3.observed.attemptedTrials, manifest.trials.length);
  assert.equal(v3.observed.attemptedArms, manifest.trials.length * 4);
  assert.equal(v3.observed.validArms, 64);
  assert.equal(v3.observed.successfulArms, 58);
  assert.equal(v3.status, "formal-exploratory");
  assert.equal(publicBinding.studyState.frozen, false);
  assert.equal(publicBinding.studyState.attemptedTrials, 0);
  assert.equal(freezeEvidence.studyState.frozen, plan.frozen);
  assert.equal(freezeEvidence.studyState.attemptedTrials, 0);
  assert.equal(
    freezeEvidence.blinding.commitment,
    plan.scenarioVariantPolicy["decision-memory-dependent"].blindingKeyCommitment
  );
  assert.equal(
    freezeEvidence.protocol.planSha256,
    createHash("sha256").update(planText).digest("hex")
  );
  assert.equal(freezeEvidence.independentCommitmentAudit.correctedCheckPassed, true);
  assert.equal(reveal.verification.resultsComplete, true);
  assert.equal(reveal.verification.allAssignmentCommitmentsMatch, true);
  assert.equal(reveal.blinding.keyCommitment, freezeEvidence.blinding.commitment);
  assert.equal(publicBinding.artifact.npmShasum, plan.execution.palacePackageShasum);
  assert.equal(publicBinding.artifact.npmIntegrity, plan.execution.palacePackageIntegrity);
  assert.equal(publicBinding.releaseGate.after.checksPassed, 19);
  assert.equal(publicBinding.releaseGate.after.checksFailed, 0);

  const comparison = analysis.overall.comparisons.adaptiveMinusControl;
  const retained = rows.get("adaptive-versus-control-v2-2").observed;
  assert.equal(retained.validPairs, comparison.validPairs);
  assert.deepEqual(
    retained.adaptiveMinusControl.reportedTokens.confidenceInterval,
    comparison.metrics.reportedTokens.treatmentMinusBaseline.confidenceInterval
  );
  assert.deepEqual(
    retained.adaptiveMinusControl.toolCalls.confidenceInterval,
    comparison.metrics.toolCalls.treatmentMinusBaseline.confidenceInterval
  );

  assert.equal(rows.get("independent-small-oss-stratum").status, "not-tested");
  assert.equal(rows.get("real-repository-history-dependent-agent").status, "not-tested");
  const publication = rows.get("npm-publication-0-3-0");
  assert.equal(publication.status, "validated-release-gate");
  assert.equal(publication.observed.registryLatest, publicRelease.npm.latest);
  assert.equal(publication.observed.shasum, publicRelease.npm.shasum);
  assert.equal(publication.observed.cleanInstallPassed, true);
  assert.equal(publication.observed.githubReleasePublished, true);
  assert.equal(publication.observed.codexPluginInstallPassed, true);
  assert.equal(publicRelease.codexPlugin.mcpPackagePin, "vertex-palace@0.3.0");

  const studies = new Map(matrix.studyEvolution.map((study) => [study.id, study]));
  const first = studies.get("fixed-treatments-v1");
  assert.equal(first.design.trials, firstAnalysis.loadedTrials);
  assert.deepEqual(
    first.fullPalaceMinusControl.reportedTokens.confidenceInterval,
    firstAnalysis.overall.metrics.reportedTokens.fullPalaceMinusControl.confidenceInterval
  );
  assert.deepEqual(
    first.fullPalaceMinusControl.durationMs.confidenceInterval,
    firstAnalysis.overall.metrics.durationMs.fullPalaceMinusControl.confidenceInterval
  );
  assert.equal(studies.get("control-first-v3").status.attemptedTrials, manifest.trials.length);
});

async function read(relativeFile) {
  return readFile(path.join(repositoryRoot, relativeFile), "utf8");
}

function localMarkdownTargets(markdown) {
  const targets = [];
  for (const match of markdown.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    let target = match[1].trim().replace(/^<|>$/g, "");
    if (!target || target.startsWith("#") || /^[a-z][a-z\d+.-]*:/i.test(target)) continue;
    target = target.split("#", 1)[0].split("?", 1)[0];
    if (target) targets.push(decodeURIComponent(target));
  }
  return targets;
}
