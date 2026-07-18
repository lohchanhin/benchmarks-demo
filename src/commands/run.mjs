import { mkdir, readFile } from "node:fs/promises";
import { delimiter } from "node:path";
import path from "node:path";
import { enumFlag, stringFlag } from "../lib/args.mjs";
import { pathExists, writeJson } from "../lib/files.mjs";
import { runProcess } from "../lib/process.mjs";
import { armsFor, loadRun, resolveRunDirectory } from "../lib/run-state.mjs";
import { repositoryRoot } from "../lib/root.mjs";
import { resolveCodexBin } from "../lib/tooling.mjs";
import { verifyArm } from "./verify.mjs";
import { writeComparisonReport } from "./report.mjs";

export async function runCommand(flags) {
  const runDirectory = await resolveRunDirectory(flags);
  const run = await loadRun(runDirectory);
  const armValue = enumFlag(flags, "arm", ["control", "palace", "both"], "both");
  const model = stringFlag(flags, "model", "gpt-5.6-sol");
  const codexBin = await resolveCodexBin(stringFlag(flags, "codex-bin", undefined));
  const artifacts = path.join(runDirectory, "artifacts");
  await mkdir(artifacts, { recursive: true });

  const failedArms = [];
  for (const arm of armsFor(armValue)) {
    const executionPath = path.join(artifacts, `${arm}-execution.json`);
    if (await pathExists(executionPath)) {
      throw new Error(`${arm} already has execution evidence. Prepare a new run for a clean comparison.`);
    }

    const workspace = run.workspace(arm);
    const prompt = await readFile(run.prompt(arm), "utf8");
    const transcriptPath = path.join(artifacts, `${arm}-transcript.jsonl`);
    const stderrPath = path.join(artifacts, `${arm}-stderr.log`);
    const lastMessagePath = path.join(artifacts, `${arm}-last-message.md`);
    const args = codexArguments({ arm, workspace, model, lastMessagePath });

    console.log(`Running ${arm} arm with ${model}...`);
    const result = await runProcess(codexBin, args, {
      cwd: workspace,
      input: prompt,
      env: arm === "palace" ? palaceEnvironment() : undefined,
      stdoutPath: transcriptPath,
      stderrPath
    });
    const execution = {
      schemaVersion: 1,
      arm,
      model,
      startedAt: result.startedAt,
      endedAt: result.endedAt,
      durationMs: result.durationMs,
      exitCode: result.exitCode,
      transcriptPath: path.relative(runDirectory, transcriptPath).replaceAll("\\", "/"),
      stderrPath: path.relative(runDirectory, stderrPath).replaceAll("\\", "/"),
      lastMessagePath: path.relative(runDirectory, lastMessagePath).replaceAll("\\", "/")
    };
    await writeJson(executionPath, execution);
    await verifyArm(run, arm);
    if (result.exitCode !== 0) failedArms.push(arm);
    console.log(`${arm} finished with Codex exit code ${result.exitCode}`);
  }

  const evidenceReady = await Promise.all(
    ["control", "palace"].map((arm) => pathExists(path.join(artifacts, `${arm}-evidence.json`)))
  );
  if (evidenceReady.every(Boolean)) await writeComparisonReport(run);
  if (failedArms.length) throw new Error(`Codex execution failed for: ${failedArms.join(", ")}`);
}

function palaceEnvironment() {
  const localBins = path.join(repositoryRoot, "node_modules", ".bin");
  const inherited = process.env.PATH || process.env.Path || "";
  return { PATH: `${localBins}${delimiter}${inherited}` };
}

function codexArguments({ arm, workspace, model, lastMessagePath }) {
  const args = ["-a", "never", "-s", "workspace-write", "-C", workspace];
  if (process.platform === "win32") args.push("-c", 'windows.sandbox="unelevated"');
  args.push(
    "exec",
    "--ignore-user-config",
    "--ignore-rules",
    "--json",
    "--ephemeral",
    "--color",
    "never",
    "--model",
    model,
    "--output-last-message",
    lastMessagePath,
    "-"
  );
  return args;
}
