import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pathExists, readJson, writeJson } from "../src/lib/files.mjs";
import { repositoryRoot } from "../src/lib/root.mjs";

export async function publishRun(runDirectory, options = {}) {
  const sourceRoot = path.resolve(runDirectory);
  const manifest = await readJson(path.join(sourceRoot, "manifest.json"));
  const resultDirectory = resultDirectoryForProtocol(manifest.protocolVersion);
  const outputRoot = path.resolve(
    options.outputRoot ?? path.join(repositoryRoot, "results", resultDirectory, manifest.id)
  );
  if (await pathExists(outputRoot)) throw new Error(`Published result already exists: ${outputRoot}`);
  await mkdir(outputRoot, { recursive: true });

  const publishedManifest = sanitizeForPublication(manifest);
  publishedManifest.publishedFrom = ".benchmark-runs/<reviewed-local-run>";
  publishedManifest.publication = {
    rawTranscriptsIncluded: false,
    sessionIdentifiersIncluded: false,
    localPathsIncluded: false
  };
  await writeJson(path.join(outputRoot, "manifest.json"), publishedManifest);

  const artifacts = path.join(sourceRoot, "artifacts");
  await writeJson(path.join(outputRoot, "run-plan.json"), sanitizeForPublication(
    await readJson(path.join(artifacts, "run-plan.json"))
  ));
  const evidenceFiles = [];
  for (const arm of Object.keys(manifest.arms)) {
    const evidence = await readJson(path.join(artifacts, `${arm}-evidence.json`));
    const evidenceFile = `${arm}-evidence.json`;
    evidenceFiles.push(evidenceFile);
    await writeJson(path.join(outputRoot, evidenceFile), sanitizeForPublication(evidence));
  }

  const reports = path.join(sourceRoot, "reports");
  const comparison = sanitizeForPublication(await readJson(path.join(reports, "comparison.json")));
  await writeJson(path.join(outputRoot, "comparison.json"), comparison);
  await writeFile(
    path.join(outputRoot, "comparison.md"),
    sanitizeForPublication(await readFile(path.join(reports, "comparison.md"), "utf8")),
    "utf8"
  );

  const publicFiles = [
    "manifest.json",
    "run-plan.json",
    ...evidenceFiles,
    "comparison.json",
    "comparison.md"
  ];
  await assertNoPrivateMaterial(outputRoot, publicFiles);
  const hashes = await hashPublishedFiles(outputRoot, publicFiles);
  await writeFile(
    path.join(outputRoot, "SHA256SUMS"),
    `${hashes.map(({ hash, file }) => `${hash}  ${file}`).join("\n")}\n`,
    "utf8"
  );
  if (options.updateManifest !== false) {
    await updateResultsManifest(
      manifest.id,
      outputRoot,
      options.resultsManifestPath ?? path.join(repositoryRoot, "results", resultDirectory, "manifest.json"),
      comparison
    );
  }
  return { outputRoot, manifest: publishedManifest, hashes };
}

export function sanitizeForPublication(value, key = "") {
  if (Array.isArray(value)) return value.map((item) => sanitizeForPublication(item));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([childKey]) => !["sessionid", "threadid"].includes(childKey.toLowerCase().replaceAll("_", "")))
        .map(([childKey, childValue]) => [childKey, sanitizeForPublication(childValue, childKey)])
    );
  }
  if (key === "cli" && typeof value === "string") return "vertex-palace (local package)";
  if (typeof value === "string") {
    return value
      .replace(/[A-Za-z]:\\[^\r\n"']+/g, "<local-path>")
      .replace(/\/(?:home|Users)\/[^\s"']+/g, "<local-path>");
  }
  return value;
}

async function assertNoPrivateMaterial(outputRoot, files) {
  for (const file of files) {
    const source = await readFile(path.join(outputRoot, file), "utf8");
    if (/"(?:session_?id|thread_?id)"/i.test(source)) throw new Error(`${file} contains a session identifier`);
    if (/[A-Za-z]:\\|\/(?:home|Users)\//.test(source)) {
      throw new Error(`${file} contains an absolute local path`);
    }
  }
}

async function hashPublishedFiles(outputRoot, files) {
  const hashes = [];
  for (const file of files) {
    const source = await readFile(path.join(outputRoot, file));
    hashes.push({ file, hash: createHash("sha256").update(source).digest("hex") });
  }
  return hashes;
}

async function updateResultsManifest(trialId, outputRoot, manifestPath, comparison) {
  const manifest = await readJson(manifestPath);
  const trial = manifest.trials?.find((entry) => entry.trialId === trialId);
  if (!trial) throw new Error(`Trial ${trialId} is not registered in results/manifest.json`);
  delete trial.runDirectory;
  trial.report = path.relative(path.dirname(manifestPath), path.join(outputRoot, "comparison.json")).replaceAll("\\", "/");
  trial.evidenceDirectory = path.relative(path.dirname(manifestPath), outputRoot).replaceAll("\\", "/");
  trial.rawTranscriptsPublished = false;
  trial.comparisonEligible = comparison.comparable === true;
  trial.armValidity = Object.fromEntries(
    Object.entries(comparison.arms ?? {}).map(([arm, evidence]) => [arm, evidence.valid === true])
  );
  trial.publishedAt = new Date().toISOString();
  await writeJson(manifestPath, manifest);
}

export function resultDirectoryForProtocol(protocolVersion) {
  const adaptiveDirectories = {
    "2.0.0": "adaptive-pilot",
    "2.1.0": "adaptive-pilot-v2.1",
    "2.2.0": "adaptive-pilot-v2.2"
  };
  if (protocolVersion in adaptiveDirectories) return adaptiveDirectories[protocolVersion];
  if (String(protocolVersion).startsWith("2.")) {
    throw new Error(`No publication directory is registered for protocol ${protocolVersion}`);
  }
  return "pilot";
}

async function main() {
  const runDirectory = process.argv[2];
  if (!runDirectory) throw new Error("Usage: node scripts/publish-run.mjs <run-directory>");
  const published = await publishRun(runDirectory);
  console.log(`Published reviewed evidence: ${published.outputRoot}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
