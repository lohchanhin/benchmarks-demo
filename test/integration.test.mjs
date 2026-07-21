import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { prepareCommand } from "../src/commands/prepare.mjs";
import { buildComparison, writeComparisonReport } from "../src/commands/report.mjs";
import { verifyArm } from "../src/commands/verify.mjs";
import { pathExists, writeJson } from "../src/lib/files.mjs";
import { collectGitEvidence } from "../src/lib/git.mjs";
import { loadRun } from "../src/lib/run-state.mjs";
import { applyCanonicalRepair as applyScenarioRepair } from "../src/lib/scenario.mjs";

const testVariantKey = "3333333333333333333333333333333333333333333333333333333333333333";

test("control-first seeded scenarios reject preparation without a blinding key", async (context) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "benchmark-missing-variant-key-"));
  context.after(() => rm(root, { recursive: true, force: true }));
  await assert.rejects(
    prepareCommand(new Map([
      ["scenario", "decision-memory-dependent"],
      ["run-id", "missing-variant-key"],
      ["seed", "missing-variant-key-seed"],
      ["runs-root", root],
      ["protocol-version", "3.0.0"],
      ["skip-palace-seed", true]
    ])),
    /must contain a 32-byte hexadecimal key/
  );
});

test("prepares identical arms, verifies repairs, and writes comparison reports", async (context) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "benchmark-integration-"));
  context.after(() => rm(root, { recursive: true, force: true }));
  const flags = new Map([
    ["run-id", "integration"],
    ["runs-root", root],
    ["skip-palace-seed", true]
  ]);
  const { runDirectory, manifest } = await prepareCommand(flags);
  assert.equal(manifest.arms.control.tree, manifest.arms["route-only"].tree);
  assert.equal(manifest.arms.control.tree, manifest.arms["full-palace"].tree);
  assert.equal(manifest.arms.control.tree, manifest.arms["adaptive-palace"].tree);

  const run = await loadRun(runDirectory);
  const artifacts = path.join(runDirectory, "artifacts");
  await mkdir(artifacts, { recursive: true });
  for (const arm of ["control", "route-only", "full-palace", "adaptive-palace"]) {
    await applyTenantThemeRepair(run.workspace(arm));
    const palaceCommand = arm === "control"
      ? "rg Aurora src clients"
      : arm === "adaptive-palace"
        ? "palace context task --auto"
        : "palace context task";
    const palaceOutput = arm === "adaptive-palace"
      ? measuredAdaptiveOutput(`# Vertex Palace Adaptive Context\n\nMode: route-lite\n\n## Task\n\n${manifest.task}\n\n## Payload\n\nCalls: 1 | Bytes: 0 | Estimated tokens: 100\nRoute: 4 (2 primary, 2 support, 0 deferred)\nMemory: 0 items / ~0 tokens | Guardrails: 0`)
      : arm === "control"
        ? "ok"
        : `# Vertex Palace Pack\n\n## Task\n${manifest.task}\n\n## Palace Route\nTask type: bugfix`;
    const transcript = [
      JSON.stringify({ type: "thread.started", thread_id: `${arm}-thread` }),
      JSON.stringify({
        type: "item.completed",
        item: { type: "command_execution", command: palaceCommand, status: "completed", exit_code: 0, aggregated_output: palaceOutput }
      }),
      JSON.stringify({
        type: "turn.completed",
        usage: {
          input_tokens: arm === "control" ? 3000 : arm === "route-only" ? 2200 : arm === "full-palace" ? 1800 : 1500,
          cached_input_tokens: 600,
          output_tokens: 500
        }
      })
    ].join("\n");
    await writeFile(path.join(artifacts, `${arm}-transcript.jsonl`), `${transcript}\n`, "utf8");
    await writeJson(path.join(artifacts, `${arm}-execution.json`), {
      model: "gpt-5.6-sol",
      durationMs: arm === "control" ? 12000 : arm === "route-only" ? 9000 : 8000,
      exitCode: 0,
      timedOut: false,
      reasoningEffort: "xhigh",
      startedAt: "2026-01-01T00:00:00.000Z",
      endedAt: "2026-01-01T00:00:12.000Z"
    });
  }

  const control = await verifyArm(run, "control");
  const routeOnly = await verifyArm(run, "route-only");
  const palace = await verifyArm(run, "full-palace");
  const adaptive = await verifyArm(run, "adaptive-palace");
  assert.equal(control.score.total, 100);
  assert.equal(routeOnly.score.total, 100);
  assert.equal(palace.score.total, 100);
  assert.equal(adaptive.score.total, 100);
  assert.equal(control.validity.passed, true);
  assert.equal(palace.validity.passed, true);
  assert.equal(adaptive.validity.passed, true);

  const report = await writeComparisonReport(run);
  const markdown = await readFile(report.markdownPath, "utf8");
  assert.match(markdown, /Vertex Palace Four-Arm Adaptive Benchmark/);
  assert.match(markdown, /Full Palace minus Adaptive/);
  assert.match(markdown, /Instrumentation Excluded From Scope/);
  assert.match(markdown, /Delivered full paths reopened/);
  assert.match(markdown, /Calls after stop condition/);
  assert.match(markdown, /Batched verification used/);
  assert.match(markdown, /\| Elapsed time \| 12\.0s \| 9\.0s \| 8\.0s \| 8\.0s \| 0\.0s \|/);
  assert.equal(report.comparison.delta.durationMsSaved, 0);
  assert.equal(report.comparison.pairwise.controlVsAdaptivePalace.delta.durationMsSaved, 4000);

  const routeTranscriptPath = path.join(artifacts, "route-only-transcript.jsonl");
  const mismatchedTranscript = (await readFile(routeTranscriptPath, "utf8")).replace(manifest.task, "mutated task");
  await writeFile(routeTranscriptPath, mismatchedTranscript, "utf8");
  const taskMismatch = await verifyArm(run, "route-only");
  assert.equal(taskMismatch.taskFidelityPassed, false);
  assert.equal(taskMismatch.validity.passed, false);

  await writeFile(
    path.join(artifacts, "adaptive-palace-stderr.log"),
    "ERROR codex_core::tools::router: failed to prepare fs sandbox: split writable root sets\n",
    "utf8"
  );
  const sandboxMismatch = await verifyArm(run, "adaptive-palace");
  assert.equal(sandboxMismatch.runtimeDiagnostics.sandboxPreparationErrors, 1);
  assert.equal(sandboxMismatch.validity.passed, false);
});

test("control-first v3 rejects correct output with an over-broad changed-file scope", async (context) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "benchmark-control-first-scope-"));
  context.after(() => rm(root, { recursive: true, force: true }));
  const { runDirectory } = await prepareCommand(new Map([
    ["scenario", "decision-memory-dependent"],
    ["run-id", "control-first-scope"],
    ["seed", "control-first-scope-seed"],
    ["runs-root", root],
    ["protocol-version", "3.0.0"],
    ["variant-key", testVariantKey],
    ["skip-palace-seed", true]
  ]));
  const run = await loadRun(runDirectory, { variantKey: testVariantKey });
  assert.equal(run.manifest.schemaVersion, 5);
  assert.equal(run.manifest.scenarioVariant.ownerDisclosedToPrompt, false);
  assert.equal("owner" in run.manifest.scenarioVariant, false);
  assert.equal(run.scenario.expectedChangedFiles[0], `clients/${run.scenario.resolvedVariant.owner}/article-tokens.mjs`);
  const workspace = run.workspace("control");
  const repair = await applyScenarioRepair(run.scenario, workspace);
  assert.equal(repair.exitCode, 0);
  await writeFile(path.join(workspace, "README.md"), "# Unrelated rewrite\n", "utf8");

  const artifacts = path.join(runDirectory, "artifacts");
  await mkdir(artifacts, { recursive: true });
  await writeFile(path.join(artifacts, "control-transcript.jsonl"), [
    JSON.stringify({ type: "thread.started", thread_id: "control-first-scope" }),
    JSON.stringify({
      type: "item.completed",
      item: {
        type: "command_execution",
        command: "node --test",
        status: "completed",
        exit_code: 0,
        aggregated_output: "tests passed"
      }
    }),
    JSON.stringify({
      type: "turn.completed",
      usage: { input_tokens: 1000, cached_input_tokens: 100, output_tokens: 100 }
    })
  ].join("\n") + "\n", "utf8");
  await writeJson(path.join(artifacts, "control-execution.json"), {
    model: "gpt-5.6-sol",
    reasoningEffort: "xhigh",
    durationMs: 1000,
    exitCode: 0,
    timedOut: false,
    startedAt: "2026-01-01T00:00:00.000Z",
    endedAt: "2026-01-01T00:00:01.000Z"
  });

  const evidence = await verifyArm(run, "control");
  assert.equal(evidence.validity.passed, true);
  assert.equal(evidence.tests.passed, true);
  assert.equal(evidence.score.forbiddenViolation, false);
  assert.equal(evidence.score.changedFilePrecision, 0.5);
  assert.equal(evidence.score.changedFileRecall, 1);
  assert.equal(evidence.scopeRequirement.strict, true);
  assert.equal(evidence.scopeRequirement.passed, false);
  assert.equal(evidence.success, false);

  const armEvidence = {
    control: evidence,
    "route-only": evidence,
    "full-palace": evidence,
    "adaptive-palace": {
      ...evidence,
      success: true,
      score: { ...evidence.score, total: 100, changedFilePrecision: 1 },
      execution: { ...evidence.execution, durationMs: 800 },
      transcript: {
        ...evidence.transcript,
        usage: { ...evidence.transcript.usage, totalTokens: 900 }
      }
    }
  };
  const comparison = buildComparison(run, armEvidence);
  assert.equal(comparison.schemaVersion, 5);
  assert.equal(comparison.primaryComparison, "adaptive-vs-control");
  assert.equal(comparison.comparable, false);
  assert.equal(comparison.delta.reportedTokensSaved, null);
});

test("control-first v3 accepts the compact true-bypass contract", async (context) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "benchmark-control-first-bypass-"));
  context.after(() => rm(root, { recursive: true, force: true }));
  const { runDirectory } = await prepareCommand(new Map([
    ["scenario", "small-local-bug"],
    ["run-id", "control-first-bypass"],
    ["seed", "control-first-bypass-seed"],
    ["runs-root", root],
    ["protocol-version", "3.0.0"],
    ["skip-palace-seed", true]
  ]));
  const run = await loadRun(runDirectory);
  const workspace = run.workspace("adaptive-palace");
  const repair = await applyScenarioRepair(run.scenario, workspace);
  assert.equal(repair.exitCode, 0);

  const artifacts = path.join(runDirectory, "artifacts");
  await mkdir(artifacts, { recursive: true });
  const bypassOutput = [
    "Mode: bypass",
    "Primary candidate: src/format-currency.mjs",
    "Reason: High-confidence single-file route with no memory or scope risk.",
    ""
  ].join("\n");
  await writeFile(path.join(artifacts, "adaptive-palace-transcript.jsonl"), [
    JSON.stringify({ type: "thread.started", thread_id: "control-first-bypass" }),
    JSON.stringify({
      type: "item.completed",
      item: {
        type: "command_execution",
        command: `palace context '${run.manifest.task}' --auto --budget 6000`,
        status: "completed",
        exit_code: 0,
        aggregated_output: bypassOutput
      }
    }),
    JSON.stringify({
      type: "turn.completed",
      usage: { input_tokens: 1000, cached_input_tokens: 100, output_tokens: 100 }
    })
  ].join("\n") + "\n", "utf8");
  await writeJson(path.join(artifacts, "adaptive-palace-execution.json"), {
    model: "gpt-5.6-sol",
    reasoningEffort: "xhigh",
    durationMs: 1000,
    exitCode: 0,
    timedOut: false,
    startedAt: "2026-01-01T00:00:00.000Z",
    endedAt: "2026-01-01T00:00:01.000Z"
  });

  const evidence = await verifyArm(run, "adaptive-palace");
  assert.equal(evidence.transcript.adaptivePayload.mode, "bypass");
  assert.equal(evidence.transcript.adaptivePayloadMatchesOutput, true);
  assert.equal(evidence.taskFidelityPassed, true);
  assert.equal(evidence.validity.passed, true);
  assert.equal(evidence.success, true);
});

test("Palace preparation records history truthfully and stays outside tracked fixture changes", async (context) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "benchmark-palace-scope-"));
  context.after(() => rm(root, { recursive: true, force: true }));
  const { runDirectory, manifest } = await prepareCommand(new Map([
    ["scenario", "small-local-bug"],
    ["run-id", "palace-scope"],
    ["seed", "palace-scope-seed"],
    ["runs-root", root],
    ["cache-state", "cold"]
  ]));
  assert.equal(manifest.cacheState, "cold");
  assert.equal(manifest.palaceSeed.routeOnly.memorySeeded, false);
  assert.equal(manifest.palaceSeed.fullPalace.memorySeeded, false);
  assert.equal(manifest.palaceSeed.adaptivePalace.memorySeeded, false);
  const run = await loadRun(runDirectory);
  for (const arm of ["control", "route-only", "full-palace", "adaptive-palace"]) {
    const git = await collectGitEvidence(run.workspace(arm));
    assert.deepEqual(git.changedFiles, []);
    assert.equal(git.headTree, run.manifest.repositoryTree);
    if (arm !== "control") {
      assert.equal(await pathExists(path.join(run.workspace(arm), ".palace", "indexes", "nodes.json")), false);
    }
  }
});

async function applyTenantThemeRepair(workspace) {
  const rendererPath = path.join(workspace, "src", "rendering", "article-page.mjs");
  const auroraPath = path.join(workspace, "clients", "aurora", "theme.mjs");
  const renderer = (await readFile(rendererPath, "utf8")).replace(
    "text: sharedTheme.articleHero.text",
    "text: articleHero.text ?? sharedTheme.articleHero.text"
  );
  const aurora = (await readFile(auroraPath, "utf8")).replace('text: "#f8fafc"', 'text: "#172033"');
  await Promise.all([
    writeFile(rendererPath, renderer, "utf8"),
    writeFile(auroraPath, aurora, "utf8")
  ]);
}

function measuredAdaptiveOutput(source) {
  let output = source;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const next = output.replace(/Bytes: \d+/, `Bytes: ${Buffer.byteLength(output, "utf8")}`);
    if (next === output) return output;
    output = next;
  }
  return output;
}
