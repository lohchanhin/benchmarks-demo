import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const EXPECTED_ARMS = Object.freeze(["control", "route-only", "full-palace"]);
const PRIVATE_MATERIAL = /"(?:session_?id|thread_?id)"|[A-Za-z]:\\|\/(?:home|Users)\//i;

export async function auditPublishedResults(manifestFile = "results/manifest.json") {
  const manifestPath = path.resolve(manifestFile);
  const resultsRoot = path.dirname(manifestPath);
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const errors = [];
  let armCount = 0;
  let validArmCount = 0;
  let successfulArmCount = 0;
  let verifiedFileCount = 0;

  const plannedTrials = Number.isInteger(manifest.plannedTrials)
    ? manifest.plannedTrials
    : (manifest.plannedScenarios?.length ?? 0) * (manifest.plannedSeedsPerScenario ?? 0);
  if (manifest.trials?.length !== plannedTrials) {
    errors.push(`Manifest contains ${manifest.trials?.length ?? 0} trials; expected ${plannedTrials}.`);
  }

  for (const trial of manifest.trials ?? []) {
    if (!trial.report || !trial.evidenceDirectory) {
      errors.push(`${trial.trialId}: report or evidenceDirectory is missing.`);
      continue;
    }
    if (trial.rawTranscriptsPublished !== false) {
      errors.push(`${trial.trialId}: rawTranscriptsPublished must be false.`);
    }

    const evidenceDirectory = resolveInside(resultsRoot, trial.evidenceDirectory, errors, trial.trialId);
    const reportPath = resolveInside(resultsRoot, trial.report, errors, trial.trialId);
    if (!evidenceDirectory || !reportPath) continue;

    let report;
    try {
      report = JSON.parse(await readFile(reportPath, "utf8"));
    } catch (error) {
      errors.push(`${trial.trialId}: report cannot be read: ${error.message}`);
      continue;
    }
    if (report.runId !== trial.trialId) errors.push(`${trial.trialId}: report runId mismatch.`);
    if (report.scenario !== trial.scenario) errors.push(`${trial.trialId}: report scenario mismatch.`);

    const armNames = Object.keys(report.arms ?? {}).sort();
    if (JSON.stringify(armNames) !== JSON.stringify([...EXPECTED_ARMS].sort())) {
      errors.push(`${trial.trialId}: report arms are ${armNames.join(", ") || "missing"}.`);
    }
    for (const armName of EXPECTED_ARMS) {
      const arm = report.arms?.[armName];
      if (!arm) continue;
      armCount += 1;
      if (arm.valid === true) validArmCount += 1;
      if (arm.success === true) successfulArmCount += 1;
    }

    const audit = await auditEvidenceDirectory(evidenceDirectory, trial.trialId);
    verifiedFileCount += audit.verifiedFileCount;
    errors.push(...audit.errors);
  }

  return {
    manifestPath,
    plannedTrials,
    trialCount: manifest.trials?.length ?? 0,
    armCount,
    validArmCount,
    successfulArmCount,
    verifiedFileCount,
    errors
  };
}

async function auditEvidenceDirectory(directory, trialId) {
  const errors = [];
  let verifiedFileCount = 0;
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    return { errors: [`${trialId}: evidence directory cannot be read: ${error.message}`], verifiedFileCount };
  }

  const files = entries.filter((entry) => entry.isFile()).map((entry) => entry.name).sort();
  const rawTranscripts = files.filter((file) => file.endsWith(".jsonl"));
  if (rawTranscripts.length) errors.push(`${trialId}: raw transcript files are published: ${rawTranscripts.join(", ")}.`);

  let checksumLines;
  try {
    checksumLines = (await readFile(path.join(directory, "SHA256SUMS"), "utf8")).trim().split(/\r?\n/);
  } catch (error) {
    return { errors: [...errors, `${trialId}: SHA256SUMS cannot be read: ${error.message}`], verifiedFileCount };
  }

  const listedFiles = [];
  for (const line of checksumLines) {
    const match = line.match(/^([0-9a-f]{64})  (.+)$/);
    if (!match) {
      errors.push(`${trialId}: malformed checksum line: ${line}`);
      continue;
    }
    const [, expected, file] = match;
    listedFiles.push(file);
    const filePath = resolveInside(directory, file, errors, trialId);
    if (!filePath) continue;
    try {
      const bytes = await readFile(filePath);
      const actual = createHash("sha256").update(bytes).digest("hex");
      if (actual !== expected) errors.push(`${trialId}/${file}: SHA256 mismatch.`);
      if (PRIVATE_MATERIAL.test(bytes.toString("utf8"))) {
        errors.push(`${trialId}/${file}: possible private session metadata or local path.`);
      }
      verifiedFileCount += 1;
    } catch (error) {
      errors.push(`${trialId}/${file}: cannot be read: ${error.message}`);
    }
  }

  const publicFiles = files.filter((file) => file !== "SHA256SUMS").sort();
  if (JSON.stringify([...listedFiles].sort()) !== JSON.stringify(publicFiles)) {
    errors.push(`${trialId}: SHA256SUMS does not cover exactly every public evidence file.`);
  }
  return { errors, verifiedFileCount };
}

function resolveInside(root, relativePath, errors, label) {
  const absoluteRoot = path.resolve(root);
  const resolved = path.resolve(absoluteRoot, relativePath);
  if (resolved !== absoluteRoot && !resolved.startsWith(`${absoluteRoot}${path.sep}`)) {
    errors.push(`${label}: path escapes its declared root: ${relativePath}`);
    return null;
  }
  return resolved;
}

async function main() {
  const summary = await auditPublishedResults(process.argv[2] ?? "results/manifest.json");
  console.log(`Trials: ${summary.trialCount}/${summary.plannedTrials}`);
  console.log(`Arms: ${summary.armCount}; valid: ${summary.validArmCount}; successful: ${summary.successfulArmCount}`);
  console.log(`Checksum-verified public evidence files: ${summary.verifiedFileCount}`);
  if (summary.errors.length) {
    for (const error of summary.errors) console.error(`- ${error}`);
    process.exitCode = 1;
  } else {
    console.log("Result audit passed: complete checksums, no raw transcripts, no detected private paths or session ids.");
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
