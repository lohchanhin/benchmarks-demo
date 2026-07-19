import { createHash } from "node:crypto";
import { mkdir, readFile, rename } from "node:fs/promises";
import { delimiter } from "node:path";
import path from "node:path";
import { booleanFlag, enumFlag, stringFlag } from "../lib/args.mjs";
import { pathExists, readJson, writeJson } from "../lib/files.mjs";
import { runProcess } from "../lib/process.mjs";
import { armsFor, loadRun, resolveRunDirectory } from "../lib/run-state.mjs";
import { repositoryRoot } from "../lib/root.mjs";
import { resolveCodexBin } from "../lib/tooling.mjs";
import { verifyArm } from "./verify.mjs";
import { writeComparisonReport } from "./report.mjs";

export const LAST_MESSAGE_TRANSPORT = "workspace-local-then-artifacts-v1";
export const WINDOWS_SANDBOX_MODE = "elevated";

export async function runCommand(flags) {
  const runDirectory = await resolveRunDirectory(flags);
  const run = await loadRun(runDirectory);
  const availableArms = Object.keys(run.manifest.arms);
  const armValue = enumFlag(
    flags,
    "arm",
    ["control", "route-only", "full-palace", "adaptive-palace", "all", "palace", "adaptive", "both"],
    "all"
  );
  const order = stringFlag(flags, "order", "seeded");
  const cooldownMs = nonNegativeInteger(stringFlag(flags, "cooldown-ms", "15000"), "--cooldown-ms");
  const timeoutMs = nonNegativeInteger(stringFlag(flags, "timeout-ms", "600000"), "--timeout-ms");
  const model = stringFlag(flags, "model", "gpt-5.6-sol");
  const reasoningEffort = enumFlag(flags, "reasoning-effort", ["low", "medium", "high", "xhigh"], "xhigh");
  const resume = booleanFlag(flags, "resume");
  const codexBin = await resolveCodexBin(stringFlag(flags, "codex-bin", undefined));
  const artifacts = path.join(runDirectory, "artifacts");
  await mkdir(artifacts, { recursive: true });
  const runArms = orderedArms(armValue, order, run.manifest.seed, availableArms);
  const codexVersion = await commandVersion(codexBin, ["--version"]);
  const palaceVersion = await installedPalaceVersion();
  assertExpectedVersion("Codex CLI", codexVersion, stringFlag(flags, "expected-codex-version", undefined));
  assertExpectedVersion("Vertex Palace", palaceVersion, stringFlag(flags, "expected-palace-version", undefined));
  const executionEnvironment = benchmarkExecutionEnvironment();
  const runPlanPath = path.join(artifacts, "run-plan.json");
  const proposedPlan = {
    schemaVersion: 3,
    mode: "sequential",
    order,
    arms: runArms,
    cooldownMs,
    timeoutMs,
    model,
    reasoningEffort,
    codexVersion,
    palaceVersion,
    ...executionEnvironment,
    cacheState: run.manifest.cacheState ?? "unrecorded",
    seed: run.manifest.seed,
    createdAt: new Date().toISOString()
  };
  if (resume && await pathExists(runPlanPath)) {
    const existingPlan = await readJson(runPlanPath);
    assertSameRunPlan(existingPlan, proposedPlan);
  } else {
    await writeJson(runPlanPath, proposedPlan);
  }

  const failedArms = [];
  for (const [armIndex, arm] of runArms.entries()) {
    const executionPath = path.join(artifacts, `${arm}-execution.json`);
    if (await pathExists(executionPath)) {
      if (!resume) throw new Error(`${arm} already has execution evidence. Pass --resume or prepare a new run.`);
      const existing = await readJson(executionPath);
      await verifyArm(run, arm);
      if (existing.exitCode !== 0) failedArms.push(arm);
      console.log(`Resuming past completed ${arm} arm (exit code ${existing.exitCode})`);
      continue;
    }

    const workspace = run.workspace(arm);
    const prompt = await readFile(run.prompt(arm), "utf8");
    const transcriptPath = path.join(artifacts, `${arm}-transcript.jsonl`);
    const stderrPath = path.join(artifacts, `${arm}-stderr.log`);
    const lastMessagePath = path.join(artifacts, `${arm}-last-message.md`);
    const workspaceLastMessagePath = path.join(workspace, ".benchmark-last-message.md");
    const args = codexArguments({ workspace, model, reasoningEffort, lastMessagePath: workspaceLastMessagePath });

    console.log(`Running ${arm} arm with ${model}...`);
    const result = await runProcess(codexBin, args, {
      cwd: workspace,
      input: prompt,
      env: arm === "control" ? undefined : palaceEnvironment(),
      stdoutPath: transcriptPath,
      stderrPath,
      timeoutMs
    });
    await relocateLastMessage(workspaceLastMessagePath, lastMessagePath);
    const execution = {
      schemaVersion: 3,
      arm,
      model,
      reasoningEffort,
      codexVersion,
      palaceVersion: arm === "control" ? null : palaceVersion,
      ...executionEnvironment,
      startedAt: result.startedAt,
      endedAt: result.endedAt,
      durationMs: result.durationMs,
      exitCode: result.exitCode,
      timedOut: result.timedOut,
      sequence: armIndex + 1,
      order,
      transcriptPath: path.relative(runDirectory, transcriptPath).replaceAll("\\", "/"),
      stderrPath: path.relative(runDirectory, stderrPath).replaceAll("\\", "/"),
      lastMessagePath: path.relative(runDirectory, lastMessagePath).replaceAll("\\", "/")
    };
    await writeJson(executionPath, execution);
    await verifyArm(run, arm);
    if (result.exitCode !== 0) failedArms.push(arm);
    console.log(`${arm} finished with Codex exit code ${result.exitCode}`);
    if (armIndex < runArms.length - 1 && cooldownMs > 0) {
      console.log(`Cooling down for ${cooldownMs}ms before the next arm...`);
      await new Promise((resolve) => setTimeout(resolve, cooldownMs));
    }
  }

  const reportArms = Object.keys(run.manifest.arms);
  const evidenceReady = await Promise.all(
    reportArms.map((arm) => pathExists(path.join(artifacts, `${arm}-evidence.json`)))
  );
  if (evidenceReady.every(Boolean)) await writeComparisonReport(run);
  if (failedArms.length) throw new Error(`Codex execution failed for: ${failedArms.join(", ")}`);
}

export function orderedArms(armValue, order, seed = "fixture-default", availableArms) {
  const arms = armsFor(armValue, availableArms);
  if (arms.length === 1) return arms;
  if (order === "control-first") return preferredOrder(arms, ["control", "route-only", "full-palace", "adaptive-palace"]);
  if (order === "palace-first" || order === "full-palace-first") {
    return preferredOrder(arms, ["full-palace", "adaptive-palace", "route-only", "control"]);
  }
  if (order === "adaptive-first") return preferredOrder(arms, ["adaptive-palace", "full-palace", "route-only", "control"]);
  if (order === "seeded") return seededOrder(arms, seed);
  const explicit = order.split(",").map((value) => value.trim()).filter(Boolean);
  if (explicit.length === arms.length && new Set(explicit).size === arms.length
      && explicit.every((arm) => arms.includes(arm))) return explicit;
  throw new Error(`Invalid --order for ${arms.join(", ")}: ${order}`);
}

function nonNegativeInteger(value, name) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) throw new Error(`${name} must be a non-negative integer`);
  return parsed;
}

function palaceEnvironment() {
  const localBins = path.join(repositoryRoot, "node_modules", ".bin");
  const inherited = process.env.PATH || process.env.Path || "";
  return { PATH: `${localBins}${delimiter}${inherited}` };
}

export function codexArguments({ workspace, model, reasoningEffort, lastMessagePath }) {
  const args = ["-a", "never", "-s", "workspace-write", "-C", workspace];
  if (process.platform === "win32") args.push("-c", `windows.sandbox="${WINDOWS_SANDBOX_MODE}"`);
  args.push("-c", `model_reasoning_effort="${reasoningEffort}"`);
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

async function relocateLastMessage(source, target) {
  try {
    await mkdir(path.dirname(target), { recursive: true });
    await rename(source, target);
  } catch (error) {
    if (!error || error.code !== "ENOENT") throw error;
  }
}

export function benchmarkExecutionEnvironment() {
  return {
    platform: process.platform,
    sandboxProfile: process.platform === "win32"
      ? `workspace-write/windows-${WINDOWS_SANDBOX_MODE}`
      : "workspace-write",
    lastMessageTransport: LAST_MESSAGE_TRANSPORT
  };
}

function seededOrder(arms, seed) {
  return [...arms].sort((first, second) => seededRank(seed, first) - seededRank(seed, second));
}

function preferredOrder(arms, preference) {
  return [...arms].sort((first, second) => preference.indexOf(first) - preference.indexOf(second));
}

function seededRank(seed, arm) {
  return createHash("sha256").update(`${seed}\0${arm}`).digest().readUInt32BE(0);
}

async function commandVersion(command, args) {
  const result = await runProcess(command, args);
  return result.exitCode === 0 ? (result.stdout.trim() || result.stderr.trim()) : null;
}

async function installedPalaceVersion() {
  try {
    const manifest = await readJson(path.join(repositoryRoot, "node_modules", "vertex-palace", "package.json"));
    return manifest.version ?? null;
  } catch {
    return null;
  }
}

function assertSameRunPlan(existing, proposed) {
  for (const field of [
    "mode",
    "order",
    "cooldownMs",
    "timeoutMs",
    "model",
    "reasoningEffort",
    "codexVersion",
    "palaceVersion",
    "platform",
    "sandboxProfile",
    "lastMessageTransport",
    "cacheState",
    "seed"
  ]) {
    if (JSON.stringify(existing[field]) !== JSON.stringify(proposed[field])) {
      throw new Error(`Cannot resume: run plan field ${field} changed`);
    }
  }
  if (JSON.stringify(existing.arms) !== JSON.stringify(proposed.arms)) {
    throw new Error("Cannot resume: run plan arm order changed");
  }
}

function assertExpectedVersion(label, actual, expected) {
  if (expected !== undefined && actual !== expected) {
    throw new Error(`${label} version mismatch: expected ${expected}, received ${actual ?? "unavailable"}`);
  }
}
