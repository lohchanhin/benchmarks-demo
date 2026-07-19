import { randomBytes } from "node:crypto";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { booleanFlag, enumFlag, stringFlag } from "../lib/args.mjs";
import { pathExists, writeJson, writeText } from "../lib/files.mjs";
import { initializeFixtureGit } from "../lib/git.mjs";
import { invalidatePalaceIndex, seedPalace } from "../lib/palace.mjs";
import { buildPrompts } from "../lib/prompts.mjs";
import { runProcess } from "../lib/process.mjs";
import { defaultRunId, repositoryRoot, safeRunId, toPosix } from "../lib/root.mjs";
import { defaultScenarioId, loadScenario, materializeScenario, runScenarioOracle } from "../lib/scenario.mjs";
import { resolvePalaceInvocation } from "../lib/tooling.mjs";

export async function prepareCommand(flags) {
  const scenarioId = stringFlag(flags, "scenario", defaultScenarioId);
  const scenario = await loadScenario(scenarioId);
  const runId = safeRunId(stringFlag(flags, "run-id", defaultRunId(scenario.id)));
  const seed = stringFlag(flags, "seed", randomBytes(8).toString("hex"));
  const runsRoot = path.resolve(stringFlag(flags, "runs-root", path.join(repositoryRoot, ".benchmark-runs")));
  const runDirectory = path.join(runsRoot, runId);
  const skipPalaceSeed = booleanFlag(flags, "skip-palace-seed");
  const protocolVersion = enumFlag(
    flags,
    "protocol-version",
    ["1.0.0", "2.0.0", "2.1.0", "2.2.0"],
    "2.2.0"
  );
  const adaptiveProtocol = protocolVersion !== "1.0.0";
  const cacheState = enumFlag(flags, "cache-state", ["warm", "cold"], "warm");
  const palaceInvocation = await resolvePalaceInvocation(stringFlag(flags, "palace-bin", undefined));

  if (await pathExists(runDirectory)) {
    throw new Error(`Run already exists: ${runDirectory}`);
  }

  const arms = {
    control: path.join(runDirectory, "arms", "control"),
    "route-only": path.join(runDirectory, "arms", "route-only"),
    "full-palace": path.join(runDirectory, "arms", "full-palace"),
    ...(adaptiveProtocol
      ? { "adaptive-palace": path.join(runDirectory, "arms", "adaptive-palace") }
      : {})
  };
  await mkdir(path.join(runDirectory, "prompts"), { recursive: true });

  const fileSets = await Promise.all(
    Object.values(arms).map((workspace) => materializeScenario(scenario, workspace, { seed }))
  );
  if (fileSets.some((files) => JSON.stringify(files) !== JSON.stringify(fileSets[0]))) {
    throw new Error("Benchmark arms do not contain the same files");
  }

  const gitStates = Object.fromEntries(
    await Promise.all(Object.entries(arms).map(async ([arm, workspace]) => [arm, await initializeFixtureGit(workspace)]))
  );
  const trees = new Set(Object.values(gitStates).map((state) => state.tree));
  if (trees.size !== 1) {
    throw new Error("Benchmark arms do not have the same Git tree");
  }

  const baseline = await runProcess(scenario.testCommand[0], scenario.testCommand.slice(1), {
    cwd: arms.control,
    unsetEnv: ["NODE_TEST_CONTEXT"]
  });
  if (scenario.baselineExpectedToFail && baseline.exitCode === 0) {
    throw new Error("Scenario baseline unexpectedly passes; the benchmark task is no longer reproducible");
  }
  const oracleBaseline = await runScenarioOracle(scenario, arms.control);
  if (scenario.baselineExpectedToFail && oracleBaseline && oracleBaseline.exitCode === 0) {
    throw new Error("Scenario hidden oracle unexpectedly passes on the baseline");
  }

  const palaceSeed = skipPalaceSeed
    ? { skipped: true }
    : {
        cli: palaceInvocation.display,
        routeOnly: await seedPalace(arms["route-only"], scenario, palaceInvocation, { withMemory: false }),
        fullPalace: await seedPalace(arms["full-palace"], scenario, palaceInvocation, { withMemory: true }),
        ...(arms["adaptive-palace"]
          ? { adaptivePalace: await seedPalace(arms["adaptive-palace"], scenario, palaceInvocation, { withMemory: true }) }
          : {})
      };
  if (!skipPalaceSeed && cacheState === "cold") {
    await Promise.all(
      Object.entries(arms)
        .filter(([arm]) => arm !== "control")
        .map(([, workspace]) => invalidatePalaceIndex(workspace))
    );
  }
  const prompts = buildPrompts(scenario);
  const promptWrites = [
    writeText(path.join(runDirectory, "prompts", "task.txt"), prompts.task),
    writeText(path.join(runDirectory, "prompts", "control.txt"), prompts.control),
    writeText(path.join(runDirectory, "prompts", "route-only.txt"), prompts.routeOnly),
    writeText(path.join(runDirectory, "prompts", "full-palace.txt"), prompts.fullPalace)
  ];
  if (arms["adaptive-palace"]) {
    promptWrites.push(writeText(path.join(runDirectory, "prompts", "adaptive-palace.txt"), prompts.adaptivePalace));
  }
  await Promise.all(promptWrites);

  const manifest = {
    schemaVersion: adaptiveProtocol ? 3 : 2,
    protocolVersion,
    id: runId,
    createdAt: new Date().toISOString(),
    seed,
    scenario: scenario.id,
    scenarioTitle: scenario.title,
    task: scenario.task,
    cacheState,
    repositoryTree: gitStates.control.tree,
    baseline: {
      expectedToFail: Boolean(scenario.baselineExpectedToFail),
      testExitCode: baseline.exitCode,
      testDurationMs: baseline.durationMs,
      oracleExitCode: oracleBaseline?.exitCode ?? null,
      oracleDurationMs: oracleBaseline?.durationMs ?? null
    },
    palaceSeed,
    paths: {
      run: ".",
      controlWorkspace: "arms/control",
      routeOnlyWorkspace: "arms/route-only",
      fullPalaceWorkspace: "arms/full-palace",
      controlPrompt: "prompts/control.txt",
      routeOnlyPrompt: "prompts/route-only.txt",
      fullPalacePrompt: "prompts/full-palace.txt",
      ...(arms["adaptive-palace"]
        ? {
            adaptivePalaceWorkspace: "arms/adaptive-palace",
            adaptivePalacePrompt: "prompts/adaptive-palace.txt"
          }
        : {})
    },
    arms: Object.fromEntries(
      Object.entries(gitStates).map(([arm, state]) => [arm, { commit: state.commit, tree: state.tree }])
    ),
    generatedFileCount: fileSets[0].length
  };
  await writeJson(path.join(runDirectory, "manifest.json"), manifest);
  await writeText(path.join(runDirectory, "INSTRUCTIONS.md"), renderInstructions(manifest, runDirectory));

  console.log(`Prepared ${runId}`);
  console.log(`Run directory: ${runDirectory}`);
  console.log(`Fixture files: ${fileSets[0].length}`);
  console.log(`Fixture seed: ${seed}`);
  console.log(`Git tree: ${gitStates.control.tree}`);
  console.log(`Palace preparation skipped: ${skipPalaceSeed ? "yes" : "no"}`);
  console.log(`Palace index state at timed start: ${cacheState}`);
  console.log(`Full Palace history seeded: ${palaceSeed.fullPalace?.memorySeeded === true ? "yes" : "no"}`);
  if (arms["adaptive-palace"]) {
    console.log(`Adaptive Palace history seeded: ${palaceSeed.adaptivePalace?.memorySeeded === true ? "yes" : "no"}`);
  }
  console.log(`Next: npm run benchmark -- run --run-dir "${runDirectory}" --arm all --order seeded`);
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
    `Palace index state: \`${manifest.cacheState}\``,
    "",
    "## Automated run",
    "",
    "```sh",
    `npm run benchmark -- run --run-dir "${toPosix(runDirectory)}" --arm all --order seeded`,
    "```",
    "",
    "## Manual run",
    "",
    `- Control workspace: \`${relative(manifest.paths.controlWorkspace)}\``,
    `- Control prompt: \`${relative(manifest.paths.controlPrompt)}\``,
    `- Route-only workspace: \`${relative(manifest.paths.routeOnlyWorkspace)}\``,
    `- Route-only prompt: \`${relative(manifest.paths.routeOnlyPrompt)}\``,
    `- Full Palace workspace: \`${relative(manifest.paths.fullPalaceWorkspace)}\``,
    `- Full Palace prompt: \`${relative(manifest.paths.fullPalacePrompt)}\``,
    ...(manifest.paths.adaptivePalaceWorkspace
      ? [
          `- Adaptive Palace workspace: \`${relative(manifest.paths.adaptivePalaceWorkspace)}\``,
          `- Adaptive Palace prompt: \`${relative(manifest.paths.adaptivePalacePrompt)}\``
        ]
      : []),
    "",
    "Use fresh Codex sessions with the same model and reasoning settings. After all sessions finish:",
    "",
    "```sh",
    `npm run benchmark -- verify --run-dir "${toPosix(runDirectory)}" --arm all`,
    `npm run benchmark -- report --run-dir "${toPosix(runDirectory)}"`,
    "```",
    ""
  ].join("\n");
}
