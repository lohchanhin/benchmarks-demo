import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { prepareCommand } from "../src/commands/prepare.mjs";
import { writeComparisonReport } from "../src/commands/report.mjs";
import { verifyArm } from "../src/commands/verify.mjs";
import { writeJson } from "../src/lib/files.mjs";
import { collectGitEvidence } from "../src/lib/git.mjs";
import { loadRun } from "../src/lib/run-state.mjs";

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

  const run = await loadRun(runDirectory);
  const artifacts = path.join(runDirectory, "artifacts");
  await mkdir(artifacts, { recursive: true });
  for (const arm of ["control", "route-only", "full-palace"]) {
    await applyCanonicalRepair(run.workspace(arm));
    const palaceCommand = arm === "control" ? "rg Aurora src clients" : "palace context task";
    const transcript = [
      JSON.stringify({ type: "thread.started", thread_id: `${arm}-thread` }),
      JSON.stringify({
        type: "item.completed",
        item: { type: "command_execution", command: palaceCommand, status: "completed", exit_code: 0, aggregated_output: "ok" }
      }),
      JSON.stringify({
        type: "turn.completed",
        usage: {
          input_tokens: arm === "control" ? 3000 : arm === "route-only" ? 2200 : 1800,
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
  assert.equal(control.score.total, 100);
  assert.equal(routeOnly.score.total, 100);
  assert.equal(palace.score.total, 100);
  assert.equal(control.validity.passed, true);
  assert.equal(palace.validity.passed, true);

  const report = await writeComparisonReport(run);
  const markdown = await readFile(report.markdownPath, "utf8");
  assert.match(markdown, /Vertex Palace Three-Arm Benchmark/);
  assert.match(markdown, /\+4\.0s/);
});

test("Palace preparation stays outside tracked fixture changes", async (context) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "benchmark-palace-scope-"));
  context.after(() => rm(root, { recursive: true, force: true }));
  const { runDirectory } = await prepareCommand(new Map([
    ["scenario", "small-local-bug"],
    ["run-id", "palace-scope"],
    ["seed", "palace-scope-seed"],
    ["runs-root", root]
  ]));
  const run = await loadRun(runDirectory);
  for (const arm of ["control", "route-only", "full-palace"]) {
    const git = await collectGitEvidence(run.workspace(arm));
    assert.deepEqual(git.changedFiles, []);
    assert.equal(git.headTree, run.manifest.repositoryTree);
  }
});

async function applyCanonicalRepair(workspace) {
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
