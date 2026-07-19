import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { enumFlag } from "../lib/args.mjs";
import { listFiles, pathExists, readJson, writeJson } from "../lib/files.mjs";
import { collectGitEvidence } from "../lib/git.mjs";
import { parseCodexStderr } from "../lib/diagnostics.mjs";
import { runProcess } from "../lib/process.mjs";
import { armsFor, loadRun, resolveRunDirectory } from "../lib/run-state.mjs";
import { runScenarioOracle } from "../lib/scenario.mjs";
import { scoreArm } from "../lib/score.mjs";
import { parseCodexTranscript } from "../lib/transcript.mjs";

export async function verifyCommand(flags) {
  const runDirectory = await resolveRunDirectory(flags);
  const run = await loadRun(runDirectory);
  const availableArms = Object.keys(run.manifest.arms);
  const armValue = enumFlag(
    flags,
    "arm",
    ["control", "route-only", "full-palace", "adaptive-palace", "all", "palace", "adaptive", "both"],
    "all"
  );
  for (const arm of armsFor(armValue, availableArms)) {
    const evidence = await verifyArm(run, arm);
    console.log(
      `${arm}: public=${evidence.tests.publicPassed ? "passed" : "failed"}, `
      + `oracle=${evidence.tests.oraclePassed ? "passed" : "failed"}, score=${evidence.score.total}/100`
    );
  }
}

export async function verifyArm(run, arm) {
  const workspace = run.workspace(arm);
  const artifacts = path.join(run.runDirectory, "artifacts");
  const runPlanPath = path.join(artifacts, "run-plan.json");
  const runPlan = (await pathExists(runPlanPath)) ? await readJson(runPlanPath) : null;
  const executionPath = path.join(artifacts, `${arm}-execution.json`);
  const transcriptPath = path.join(artifacts, `${arm}-transcript.jsonl`);
  const execution = (await pathExists(executionPath)) ? await readJson(executionPath) : null;
  const transcriptSource = (await pathExists(transcriptPath)) ? await readFile(transcriptPath, "utf8") : "";
  const stderrPath = execution?.stderrPath
    ? path.resolve(run.runDirectory, execution.stderrPath)
    : path.join(artifacts, `${arm}-stderr.log`);
  const stderrSource = (await pathExists(stderrPath)) ? await readFile(stderrPath, "utf8") : "";
  const workspaceFiles = await listFiles(workspace);
  const transcript = parseCodexTranscript(transcriptSource, workspaceFiles);
  const git = await collectGitEvidence(workspace);
  const testResult = await runProcess(run.scenario.testCommand[0], run.scenario.testCommand.slice(1), {
    cwd: workspace,
    unsetEnv: ["NODE_TEST_CONTEXT"],
    stdoutPath: path.join(artifacts, `${arm}-tests.stdout.log`),
    stderrPath: path.join(artifacts, `${arm}-tests.stderr.log`)
  });
  const oracleResult = await runScenarioOracle(run.scenario, workspace);
  const publicPassed = testResult.exitCode === 0;
  const oraclePassed = oracleResult ? oracleResult.exitCode === 0 : null;
  const testsPassed = publicPassed && oraclePassed !== false;
  const score = scoreArm({
    testsPassed,
    expectedFiles: run.scenario.expectedChangedFiles,
    changedFiles: git.changedFiles,
    forbiddenFiles: run.scenario.forbiddenChangedFiles,
    diffCheckPassed: git.diffCheckPassed
  });
  const palaceCallPassed = transcript.palaceCalls === 1 && transcript.successfulPalaceCalls === 1;
  const adaptivePayloadPassed = Boolean(
    transcript.adaptivePayload
      && ["bypass", "route-lite", "full-palace", "guarded-memory-palace"].includes(transcript.adaptivePayload.mode)
      && transcript.adaptivePayload.calls === 1
      && transcript.adaptivePayloadMatchesOutput === true
  );
  const modePassed = arm === "control"
    ? transcript.palaceCalls === 0
    : arm === "adaptive-palace"
      ? palaceCallPassed && transcript.adaptiveRequested === true && adaptivePayloadPassed
      : palaceCallPassed && transcript.adaptiveRequested === false;
  const executionPassed = execution ? execution.exitCode === 0 && !execution.timedOut : false;
  const treePassed = git.headTree === run.manifest.repositoryTree;
  const settingsPassed = Boolean(
    execution
    && (!runPlan || (
      execution.model === runPlan.model
      && execution.reasoningEffort === runPlan.reasoningEffort
      && execution.codexVersion === runPlan.codexVersion
    ))
  );
  const validity = transcriptSource
    ? {
        verified: true,
        passed: modePassed && settingsPassed && treePassed,
        reason: [
          arm === "control"
            ? `${transcript.palaceCalls} Palace calls detected; expected 0`
            : `${transcript.successfulPalaceCalls}/${transcript.palaceCalls} successful/total Palace calls; `
              + `adaptiveRequested=${transcript.adaptiveRequested}; expected ${arm === "adaptive-palace"}; `
              + `adaptivePayloadMatchesOutput=${transcript.adaptivePayloadMatchesOutput}`,
          execution ? `Codex exit code ${execution.exitCode}; timedOut=${Boolean(execution.timedOut)}` : "Codex exit code unavailable",
          `fixed execution settings ${settingsPassed ? "match" : "do not match"} the run plan`,
          `fixture tree ${treePassed ? "matches" : "does not match"} ${run.manifest.repositoryTree}`
        ].join("; ")
      }
    : { verified: false, passed: null, reason: "No Codex JSONL transcript was available" };

  const evidence = {
    schemaVersion: 3,
    runId: run.manifest.id,
    arm,
    createdAt: new Date().toISOString(),
    model: execution?.model ?? null,
    reasoningEffort: execution?.reasoningEffort ?? null,
    codexVersion: execution?.codexVersion ?? null,
    palaceVersion: execution?.palaceVersion ?? null,
    execution: execution
      ? {
          durationMs: execution.durationMs,
          exitCode: execution.exitCode,
          startedAt: execution.startedAt,
          endedAt: execution.endedAt,
          timedOut: Boolean(execution.timedOut),
          sequence: execution.sequence,
          order: execution.order,
          cacheState: run.manifest.cacheState ?? "unrecorded"
        }
      : null,
    transcript,
    runtimeDiagnostics: parseCodexStderr(stderrSource),
    validity,
    tests: {
      command: run.scenario.testCommand.join(" "),
      passed: testsPassed,
      publicPassed,
      oraclePassed,
      exitCode: testResult.exitCode,
      durationMs: testResult.durationMs,
      oracleCommand: run.scenario.oracleCommand?.join(" ") ?? null,
      oracleExitCode: oracleResult?.exitCode ?? null,
      oracleDurationMs: oracleResult?.durationMs ?? null
    },
    git,
    score,
    success: Boolean(
      validity.passed
      && testsPassed
      && !score.forbiddenViolation
      && executionPassed
    ),
    route: arm === "control" ? null : await readRouteMetrics(workspace, run.scenario),
    memory: memorySignals(run.scenario, git.changedFiles),
    palaceEvaluation: arm === "control" ? null : await readLatestPalaceEvaluation(workspace)
  };
  await writeJson(path.join(artifacts, `${arm}-evidence.json`), evidence);
  return evidence;
}

async function readRouteMetrics(workspace, scenario) {
  const source = path.join(workspace, ".palace", "routes", "latest-route.json");
  if (!(await pathExists(source))) return null;
  try {
    const route = await readJson(source);
    const retrievedFiles = [...new Set((route.route ?? []).map((entry) => normalizeRoutePath(entry.sourcePath)).filter(Boolean))];
    const groundTruth = scenario.routeGroundTruthFiles ?? scenario.expectedChangedFiles;
    const retrieved = new Set(retrievedFiles);
    const matched = groundTruth.filter((file) => retrieved.has(file));
    return {
      routeId: route.id ?? null,
      confidence: Number.isFinite(route.confidence) ? route.confidence : null,
      k: retrievedFiles.length,
      recallAtK: groundTruth.length ? matched.length / groundTruth.length : 1,
      precisionAtK: retrievedFiles.length ? matched.length / retrievedFiles.length : null,
      groundTruthFiles: groundTruth,
      matchedFiles: matched,
      retrievedFiles
    };
  } catch {
    return null;
  }
}

function memorySignals(scenario, changedFiles) {
  const signals = scenario.memorySignals;
  if (!signals) return { pitfallViolation: null, wrongMemoryAdopted: null };
  const changed = new Set(changedFiles);
  const anyChanged = (files = []) => files.some((file) => changed.has(file));
  return {
    pitfallViolation: signals.pitfallViolationFiles ? anyChanged(signals.pitfallViolationFiles) : null,
    wrongMemoryAdopted: signals.wrongMemoryFiles ? anyChanged(signals.wrongMemoryFiles) : null
  };
}

function normalizeRoutePath(value) {
  return typeof value === "string" ? value.replace(/:\d+(?:-\d+)?$/, "").replaceAll("\\", "/") : null;
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
