import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { runProcess } from "../src/lib/process.mjs";
import { loadScenario, materializeScenario } from "../src/lib/scenario.mjs";

const root = await mkdtemp(path.join(os.tmpdir(), "vertex-palace-benchmark-fixture-"));

try {
  const scenario = await loadScenario();
  const files = await materializeScenario(scenario, root);
  const baseline = await runProcess(scenario.testCommand[0], scenario.testCommand.slice(1), { cwd: root });
  if (baseline.exitCode === 0) throw new Error("Fixture baseline should fail before the task is completed");

  const rendererPath = path.join(root, "src", "rendering", "article-page.mjs");
  const auroraPath = path.join(root, "clients", "aurora", "theme.mjs");
  const renderer = (await readFile(rendererPath, "utf8")).replace(
    "text: sharedTheme.articleHero.text",
    "text: articleHero.text ?? sharedTheme.articleHero.text"
  );
  const aurora = (await readFile(auroraPath, "utf8")).replace('text: "#f8fafc"', 'text: "#172033"');
  await Promise.all([
    writeFile(rendererPath, renderer, "utf8"),
    writeFile(auroraPath, aurora, "utf8")
  ]);

  const fixed = await runProcess(scenario.testCommand[0], scenario.testCommand.slice(1), { cwd: root });
  if (fixed.exitCode !== 0) {
    throw new Error(`Canonical fixture repair should pass:\n${fixed.stdout}\n${fixed.stderr}`);
  }
  console.log(`Fixture verified: ${files.length} files, failing baseline, passing scoped repair.`);
} finally {
  await rm(root, { recursive: true, force: true });
}
