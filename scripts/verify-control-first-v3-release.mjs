import path from "node:path";
import { readJson, writeJson } from "../src/lib/files.mjs";
import { runProcess } from "../src/lib/process.mjs";
import { repositoryRoot } from "../src/lib/root.mjs";
import { evaluateControlFirstReleaseGate } from "../src/lib/release-gate.mjs";
import { scenarioVariantKeyEnvironment } from "../src/lib/scenario.mjs";

const plan = await readJson(path.join(repositoryRoot, "results", "control-first-v3", "plan.json"));
const manifest = await readJson(path.join(repositoryRoot, "results", "control-first-v3", "manifest.json"));
const packageJson = await readJson(path.join(repositoryRoot, "package.json"));
const packageLock = await readJson(path.join(repositoryRoot, "package-lock.json"));
const installedPackage = await readJson(path.join(repositoryRoot, "node_modules", "vertex-palace", "package.json"));
const expectedVersion = plan.execution?.palaceVersion;
const registryResult = await runProcess(
  "npm",
  [
    "view",
    `vertex-palace@${expectedVersion}`,
    "version",
    "dist.shasum",
    "dist.integrity",
    "--json",
    "--registry=https://registry.npmjs.org"
  ],
  {
    cwd: repositoryRoot,
    windowsShim: true,
    timeoutMs: 30000,
    unsetEnv: [scenarioVariantKeyEnvironment]
  }
);
let registry = {};
if (registryResult.exitCode === 0) {
  try {
    registry = JSON.parse(registryResult.stdout);
  } catch {
    registry = {};
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  registryLookup: registryResult.exitCode === 0 ? "passed" : "failed",
  ...evaluateControlFirstReleaseGate({
    plan,
    manifest,
    packageJson,
    packageLock,
    installedPackage,
    registry
  })
};
const outputPath = outputArgument(process.argv.slice(2));
if (outputPath) await writeJson(outputPath, report);
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (!report.passed) process.exitCode = 1;

function outputArgument(args) {
  const index = args.indexOf("--out");
  if (index < 0) return undefined;
  if (!args[index + 1]) throw new Error("--out requires a repository-relative path");
  const target = path.resolve(repositoryRoot, args[index + 1]);
  if (!target.startsWith(`${repositoryRoot}${path.sep}`)) {
    throw new Error("--out must stay inside the repository");
  }
  return target;
}
