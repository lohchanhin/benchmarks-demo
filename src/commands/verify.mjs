import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { enumFlag } from "../lib/args.mjs";
import { listFiles, pathExists, readJson, writeJson } from "../lib/files.mjs";
import { collectGitEvidence } from "../lib/git.mjs";
import { runProcess } from "../lib/process.mjs";
import { armsFor, loadRun, resolveRunDirectory } from "../lib/run-state.mjs";
import { scoreArm } from "../lib/score.mjs";
import { parseCodexTranscript } from "../lib/transcript.mjs";

export async function verifyCommand(flags) {
  const runDirectory = await resolveRunDirectory(flags);
  const run = await loadRun(runDirectory);
  const armValue = enumFlag(flags, "arm", ["control", "palace", "both"], "both");
  for (const arm of armsFor(armValue)) {
    const evidence = await verifyArm(run, arm);
    console.log(`${arm}: tests=${evidence.tests.passed ? "passed" : "failed"}, score=${evidence.score.total}/100`);
  }
}

export async function verifyArm(run, arm) {
  const workspace = run.workspace(arm);
  const artifacts = path.join(run.runDirectory, "artifacts");
  const executionPath = path.join(artifacts, `${arm}-execution.json`);
  const transcriptPath = path.join(artifacts, `${arm}-transcript.jsonl`);
  const execution = (await pathExists(executionPath)) ? await readJson(executionPath) : null;
  const transcriptSource = (await pathExists(transcriptPath)) ? await readFile(transcriptPath, "utf8") : "";
  const workspaceFiles = await listFiles(workspace);
  const transcript = parseCodexTranscript(transcriptSource, workspaceFiles);
  const git = await collectGitEvidence(workspace);
  const testResult = await runProcess(run.scenario.testCommand[0], run.scenario.testCommand.slice(1), {
    cwd: workspace,
    unsetEnv: ["NODE_TEST_CONTEXT"],
    stdoutPath: path.join(artifacts, `${arm}-tests.stdout.log`),
    stderrPath: path.join(artifacts, `${arm}-tests.stderr.log`)
  });
  const score = scoreArm({
    testsPassed: testResult.exitCode === 0,
    expectedFiles: run.scenario.expectedChangedFiles,
    changedFiles: git.changedFiles,
    forbiddenFiles: run.scenario.forbiddenChangedFiles,
    diffCheckPassed: git.diffCheckPassed
  });
  const modePassed = arm === "control" ? transcript.palaceCalls === 0 : transcript.successfulPalaceCalls > 0;
  const executionPassed = execution ? execution.exitCode === 0 : true;
  const validity = transcriptSource
    ? {
        verified: true,
        passed: modePassed && executionPassed,
        reason: [
          arm === "control"
            ? `${transcript.palaceCalls} Palace calls detected; expected 0`
            : `${transcript.successfulPalaceCalls} successful Palace calls detected; expected at least 1`,
          execution ? `Codex exit code ${execution.exitCode}` : "Codex exit code unavailable"
        ].join("; ")
      }
    : { verified: false, passed: null, reason: "No Codex JSONL transcript was available" };

  const evidence = {
    schemaVersion: 1,
    runId: run.manifest.id,
    arm,
    createdAt: new Date().toISOString(),
    model: execution?.model ?? null,
    execution: execution
      ? { durationMs: execution.durationMs, exitCode: execution.exitCode, startedAt: execution.startedAt, endedAt: execution.endedAt }
      : null,
    transcript,
    validity,
    tests: {
      command: run.scenario.testCommand.join(" "),
      passed: testResult.exitCode === 0,
      exitCode: testResult.exitCode,
      durationMs: testResult.durationMs
    },
    git,
    score,
    palaceEvaluation: arm === "palace" ? await readLatestPalaceEvaluation(workspace) : null
  };
  await writeJson(path.join(artifacts, `${arm}-evidence.json`), evidence);
  return evidence;
}

async function readLatestPalaceEvaluation(workspace) {
  const directory = path.join(workspace, ".palace", "evaluations");
  if (!(await pathExists(directory))) return null;
  const files = (await readdir(directory)).filter((file) => file.endsWith(".json")).sort().reverse();
  for (const file of files) {
    try {
      return await readJson(path.join(directory, file));
    } catch {
      // Ignore partial artifacts left by an interrupted agent run.
    }
  }
  return null;
}
