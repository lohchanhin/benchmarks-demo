import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { booleanFlag, stringFlag } from "../lib/args.mjs";
import { pathExists, writeJson, writeText } from "../lib/files.mjs";
import { initializeFixtureGit } from "../lib/git.mjs";
import { seedPalace } from "../lib/palace.mjs";
import { buildPrompts } from "../lib/prompts.mjs";
import { runProcess } from "../lib/process.mjs";
import { defaultRunId, repositoryRoot, safeRunId, toPosix } from "../lib/root.mjs";
import { defaultScenarioId, loadScenario, materializeScenario } from "../lib/scenario.mjs";
import { resolvePalaceInvocation } from "../lib/tooling.mjs";

export async function prepareCommand(flags) {
  const scenarioId = stringFlag(flags, "scenario", defaultScenarioId);
  const scenario = await loadScenario(scenarioId);
  const runId = safeRunId(stringFlag(flags, "run-id", defaultRunId(scenario.id)));
  const runsRoot = path.resolve(stringFlag(flags, "runs-root", path.join(repositoryRoot, ".benchmark-runs")));
  const runDirectory = path.join(runsRoot, runId);
  const skipPalaceSeed = booleanFlag(flags, "skip-palace-seed");
  const palaceInvocation = await resolvePalaceInvocation(stringFlag(flags, "palace-bin", undefined));

  if (await pathExists(runDirectory)) {
    throw new Error(`Run already exists: ${runDirectory}`);
  }

  const arms = {
    control: path.join(runDirectory, "arms", "control"),
    palace: path.join(runDirectory, "arms", "palace")
  };
  await mkdir(path.join(runDirectory, "prompts"), { recursive: true });

  const [controlFiles, palaceFiles] = await Promise.all([
    materializeScenario(scenario, arms.control),
    materializeScenario(scenario, arms.palace)
  ]);
  if (JSON.stringify(controlFiles) !== JSON.stringify(palaceFiles)) {
    throw new Error("Control and Palace fixtures do not contain the same files");
  }

  const controlGit = await initializeFixtureGit(arms.control);
  const palaceGit = await initializeFixtureGit(arms.palace);
  if (controlGit.tree !== palaceGit.tree) {
    throw new Error("Control and Palace fixtures do not have the same Git tree");
  }

  const baseline = await runProcess(scenario.testCommand[0], scenario.testCommand.slice(1), {
    cwd: arms.control,
    unsetEnv: ["NODE_TEST_CONTEXT"]
  });
  if (scenario.baselineExpectedToFail && baseline.exitCode === 0) {
    throw new Error("Scenario baseline unexpectedly passes; the benchmark task is no longer reproducible");
  }

  const palaceSeed = skipPalaceSeed
    ? { skipped: true }
    : { ...(await seedPalace(arms.palace, scenario, palaceInvocation)), cli: palaceInvocation.display };
  const prompts = buildPrompts(scenario);
  await Promise.all([
    writeText(path.join(runDirectory, "prompts", "task.txt"), prompts.task),
    writeText(path.join(runDirectory, "prompts", "control.txt"), prompts.control),
    writeText(path.join(runDirectory, "prompts", "palace.txt"), prompts.palace)
  ]);

  const manifest = {
    schemaVersion: 1,
    id: runId,
    createdAt: new Date().toISOString(),
    scenario: scenario.id,
    scenarioTitle: scenario.title,
    task: scenario.task,
    repositoryTree: controlGit.tree,
    baseline: {
      expectedToFail: Boolean(scenario.baselineExpectedToFail),
      testExitCode: baseline.exitCode,
      testDurationMs: baseline.durationMs
    },
    palaceSeed,
    paths: {
      run: ".",
      controlWorkspace: "arms/control",
      palaceWorkspace: "arms/palace",
      controlPrompt: "prompts/control.txt",
      palacePrompt: "prompts/palace.txt"
    },
    arms: {
      control: { commit: controlGit.commit, tree: controlGit.tree },
      palace: { commit: palaceGit.commit, tree: palaceGit.tree }
    },
    generatedFileCount: controlFiles.length
  };
  await writeJson(path.join(runDirectory, "manifest.json"), manifest);
  await writeText(path.join(runDirectory, "INSTRUCTIONS.md"), renderInstructions(manifest, runDirectory));

  console.log(`Prepared ${runId}`);
  console.log(`Run directory: ${runDirectory}`);
  console.log(`Fixture files: ${controlFiles.length}`);
  console.log(`Git tree: ${controlGit.tree}`);
  console.log(`Palace memory seeded: ${skipPalaceSeed ? "no" : "yes"}`);
  console.log(`Next: npm run benchmark -- run --run-dir "${runDirectory}" --arm both`);
  return { runDirectory, manifest };
}

function renderInstructions(manifest, runDirectory) {
  const relative = (value) => toPosix(path.relative(repositoryRoot, path.join(runDirectory, value)));
  return [
    `# Benchmark Run ${manifest.id}`,
    "",
    `Scenario: ${manifest.scenarioTitle}`,
    `Fixture files: ${manifest.generatedFileCount}`,
    `Shared Git tree: \`${manifest.repositoryTree}\``,
    "",
    "## Automated run",
    "",
    "```sh",
    `npm run benchmark -- run --run-dir "${toPosix(runDirectory)}" --arm both`,
    "```",
    "",
    "## Manual run",
    "",
    `- Control workspace: \`${relative(manifest.paths.controlWorkspace)}\``,
    `- Control prompt: \`${relative(manifest.paths.controlPrompt)}\``,
    `- Palace workspace: \`${relative(manifest.paths.palaceWorkspace)}\``,
    `- Palace prompt: \`${relative(manifest.paths.palacePrompt)}\``,
    "",
    "Use fresh Codex sessions with the same model and reasoning settings. After both sessions finish:",
    "",
    "```sh",
    `npm run benchmark -- verify --run-dir "${toPosix(runDirectory)}" --arm both`,
    `npm run benchmark -- report --run-dir "${toPosix(runDirectory)}"`,
    "```",
    ""
  ].join("\n");
}
