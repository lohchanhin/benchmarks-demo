import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { listFiles, readJson, writeJson } from "../src/lib/files.mjs";
import { repositoryRoot } from "../src/lib/root.mjs";
import { sha256File } from "../src/lib/v4-execution.mjs";
import { verifyRealRepositoryV4Reveal } from "./reveal-real-repository-v4.mjs";

const defaultResultsRoot = path.join(repositoryRoot, "results", "real-repository-v4");
const defaultManifestPath = path.join(defaultResultsRoot, "manifest.json");
const defaultRevealPath = path.join(defaultResultsRoot, "blinding-reveal.json");
const defaultOutputPath = path.join(defaultResultsRoot, "mechanism-audit.post-hoc.json");
const defaultPrivateRawRoot = path.join(repositoryRoot, ".benchmark-private", "v4", "raw");

export async function buildRealRepositoryV4MechanismAudit(options = {}) {
  const manifestPath = path.resolve(options.manifestPath ?? defaultManifestPath);
  const revealPath = path.resolve(options.revealPath ?? defaultRevealPath);
  const privateRawRoot = path.resolve(options.privateRawRoot ?? defaultPrivateRawRoot);
  const [manifest, reveal] = await Promise.all([
    readJson(manifestPath),
    verifyRealRepositoryV4Reveal(revealPath)
  ]);
  assert.equal(manifest.completedArmRuns, 32);
  assert.equal(reveal.study.outcomesLockedAtCommit, requireSha1(options.outcomesLockedAtCommit));

  const adaptiveIds = new Set(
    reveal.assignments
      .filter((assignment) => assignment.treatment === "adaptive-palace")
      .map((assignment) => assignment.armId)
  );
  assert.equal(adaptiveIds.size, 16);
  const privateEvidenceFiles = (await listFiles(privateRawRoot, { ignored: [] }))
    .filter((file) => file.endsWith("evidence.private.json"));
  const records = [];
  for (const relativeFile of privateEvidenceFiles) {
    const absoluteFile = path.join(privateRawRoot, relativeFile);
    const evidence = await readJson(absoluteFile);
    if (!adaptiveIds.has(evidence.armId)) continue;
    assert.equal(evidence.treatment, "adaptive-palace");
    const payload = evidence.transcriptMetrics?.adaptivePayload;
    assert.ok(payload, `Adaptive payload missing for ${evidence.armId}`);
    records.push({
      armId: evidence.armId,
      fixtureId: manifest.arms.find((arm) => arm.armId === evidence.armId)?.fixtureId,
      success: evidence.metrics?.success === true,
      correctnessPassed: evidence.metrics?.correctnessPassed === true,
      exactScopePassed: evidence.metrics?.exactScopePassed === true,
      mode: payload.mode,
      context: {
        calls: payload.calls,
        bytes: payload.contextBytes,
        estimatedTokens: payload.contextEstimatedTokens,
        routeSteps: payload.routeStepCount,
        primary: payload.primaryCount,
        support: payload.supportCount,
        deferred: payload.deferredCount,
        memoryItems: payload.memoryItemCount,
        memoryCandidates: payload.memoryCandidateCount,
        guardrails: payload.guardrailCount
      },
      adherence: {
        palaceCalls: evidence.transcriptMetrics?.palaceCalls,
        taskMatched: evidence.transcriptMetrics?.palaceCommandMatchesExpectedTask,
        deliveredFullPathsReopened: evidence.transcriptMetrics?.deliveredFullPathReopenedCount,
        deferredOpenedWithoutConflict: evidence.transcriptMetrics?.deferredOpenedWithoutConflictCount,
        excludedPathsOpened: evidence.transcriptMetrics?.excludedPathOpenedCount,
        toolCallsAfterTestsPassed: evidence.transcriptMetrics?.toolCallsAfterTestsPassed
      },
      sourceCommitment: {
        evaluatorPrivateEvidenceSha256: await sha256File(absoluteFile)
      }
    });
  }
  records.sort((first, second) => first.armId.localeCompare(second.armId));
  assert.equal(records.length, adaptiveIds.size);
  assert.deepEqual(new Set(records.map((record) => record.armId)), adaptiveIds);

  const modeCounts = countBy(records, (record) => record.mode);
  const byFixture = Object.fromEntries(
    [...groupBy(records, (record) => record.fixtureId)].map(([fixtureId, fixtureRecords]) => [
      fixtureId,
      summarize(fixtureRecords)
    ])
  );
  return {
    schemaVersion: 1,
    artifact: "real-repository-v4-mechanism-audit",
    analysisClass: "post-hoc-exploratory",
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    outcomesLockedAtCommit: reveal.study.outcomesLockedAtCommit,
    scope: "Adaptive Palace arms only; sanitized telemetry extracted after outcome lock",
    summary: {
      adaptiveArms: records.length,
      successes: records.filter((record) => record.success).length,
      modeCounts,
      bypassOrRouteLiteSelections: (modeCounts.bypass ?? 0) + (modeCounts["route-lite"] ?? 0),
      fullOrGuardedSelections: (modeCounts["full-palace"] ?? 0) + (modeCounts["guarded-memory-palace"] ?? 0),
      exactTaskMatches: records.filter((record) => record.adherence.taskMatched === true).length,
      medianPalaceCalls: median(records.map((record) => record.adherence.palaceCalls)),
      medianContextEstimatedTokens: median(records.map((record) => record.context.estimatedTokens))
    },
    byFixture,
    privacy: {
      rawAgentEventsPublished: false,
      agentIdentifiersPublished: false,
      localPathsPublished: false,
      oracleDetailsPublished: false,
      sourceHashesPermitEvaluatorSideAudit: true
    },
    interpretationBoundary: "This artifact may explain mechanisms and guide development. It was not preregistered and cannot replace the primary V4 outcomes.",
    records
  };
}

export async function verifyRealRepositoryV4MechanismAudit(auditPath = defaultOutputPath) {
  const audit = await readJson(path.resolve(auditPath));
  const reveal = await verifyRealRepositoryV4Reveal(defaultRevealPath);
  assert.equal(audit.artifact, "real-repository-v4-mechanism-audit");
  assert.equal(audit.analysisClass, "post-hoc-exploratory");
  assert.equal(audit.outcomesLockedAtCommit, reveal.study.outcomesLockedAtCommit);
  assert.equal(audit.records.length, 16);
  assert.equal(new Set(audit.records.map((record) => record.armId)).size, 16);
  assert.equal(audit.summary.adaptiveArms, 16);
  const serialized = JSON.stringify(audit);
  for (const forbidden of [
    /[A-Za-z]:\\/,
    /\.benchmark-private/i,
    /"sessionId"\s*:/i,
    /"privateOracle"\s*:/i,
    /"transcript"\s*:/i
  ]) {
    assert.equal(forbidden.test(serialized), false, `Mechanism audit contains forbidden material: ${forbidden}`);
  }
  return audit;
}

function summarize(records) {
  return {
    arms: records.length,
    successes: records.filter((record) => record.success).length,
    correctnessPasses: records.filter((record) => record.correctnessPassed).length,
    exactScopePasses: records.filter((record) => record.exactScopePassed).length,
    modeCounts: countBy(records, (record) => record.mode),
    medianPalaceCalls: median(records.map((record) => record.adherence.palaceCalls)),
    medianContextEstimatedTokens: median(records.map((record) => record.context.estimatedTokens)),
    memoryItems: records.map((record) => record.context.memoryItems),
    guardrails: records.map((record) => record.context.guardrails)
  };
}

function groupBy(values, key) {
  const result = new Map();
  for (const value of values) {
    const group = key(value);
    if (!result.has(group)) result.set(group, []);
    result.get(group).push(value);
  }
  return result;
}

function countBy(values, key) {
  return Object.fromEntries(
    [...groupBy(values, key)].map(([name, entries]) => [name, entries.length])
  );
}

function median(values) {
  const finite = values.filter(Number.isFinite).sort((first, second) => first - second);
  if (!finite.length) return null;
  const middle = Math.floor(finite.length / 2);
  return finite.length % 2 ? finite[middle] : (finite[middle - 1] + finite[middle]) / 2;
}

function requireSha1(value) {
  const result = String(value ?? "").trim().toLowerCase();
  assert.match(result, /^[a-f0-9]{40}$/, "A full result-lock commit is required");
  return result;
}

function argumentValue(args, flag) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
}

async function main() {
  const args = process.argv.slice(2);
  const outputPath = path.resolve(argumentValue(args, "--out") ?? defaultOutputPath);
  if (args.includes("--verify")) {
    const audit = await verifyRealRepositoryV4MechanismAudit(outputPath);
    process.stdout.write(`${JSON.stringify({
      mode: "verify",
      outputPath,
      adaptiveArmsVerified: audit.records.length,
      rawDataPrinted: false
    }, null, 2)}\n`);
    return;
  }
  const audit = await buildRealRepositoryV4MechanismAudit({
    privateRawRoot: argumentValue(args, "--private-raw-root"),
    outcomesLockedAtCommit: argumentValue(args, "--locked-commit")
  });
  const write = args.includes("--write");
  if (write) await writeJson(outputPath, audit);
  process.stdout.write(`${JSON.stringify({
    mode: write ? "write" : "preview",
    outputPath,
    adaptiveArmsPublished: audit.records.length,
    analysisClass: audit.analysisClass,
    rawDataPrinted: false
  }, null, 2)}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
