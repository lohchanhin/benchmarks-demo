import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { booleanFlag, stringFlag } from "../lib/args.mjs";
import { pathExists, readJson, writeJson } from "../lib/files.mjs";
import {
  buildV4DraftPlan,
  commitV4BlindingKey,
  commitV4PrivateOracle,
  evaluateV4FreezeGate,
  freezeV4Plan
} from "../lib/v4-protocol.mjs";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

export async function v4PlanCommand(flags) {
  const fixturePath = resolveFlagPath(flags, "fixtures", "protocol/v4/fixtures.candidates.json");
  const outputPath = resolveFlagPath(flags, "out", "protocol/v4/plan.draft.json");
  const oraclePath = resolveFlagPath(flags, "oracle", ".benchmark-private/v4/oracle.json");
  const keyPath = resolveFlagPath(flags, "key-file", ".benchmark-private/v4/blinding-key.txt");
  const fixtureManifest = await readJson(fixturePath);
  const privateOracle = await readOptionalJson(oraclePath);
  const blindingKey = await readOptionalKey(keyPath);
  const plan = buildV4DraftPlan({
    fixtureManifest,
    seed: stringFlag(flags, "seed", "vertex-palace-v4-real-repositories-2026-07-21-01"),
    generatedAt: stringFlag(flags, "generated-at", fixtureManifest.retrievedAt),
    privateOracleCommitment: privateOracle ? commitV4PrivateOracle(privateOracle) : null,
    blindingKeyCommitment: blindingKey ? commitV4BlindingKey(blindingKey) : null
  });

  if (booleanFlag(flags, "write")) {
    await writeJson(outputPath, plan);
    console.log(`Wrote v4 candidate plan: ${outputPath}`);
  } else {
    console.log(JSON.stringify(plan, null, 2));
  }
  console.log(
    `V4 status: ${plan.status}; ${plan.execution.plannedTrials} paired trials planned; `
      + "formal execution remains disabled"
  );
  return plan;
}

export async function v4GateCommand(flags) {
  const planPath = resolveFlagPath(flags, "plan", "protocol/v4/plan.draft.json");
  const fixturePath = resolveFlagPath(flags, "fixtures", "protocol/v4/fixtures.candidates.json");
  const oraclePath = resolveFlagPath(flags, "oracle", ".benchmark-private/v4/oracle.json");
  const keyPath = resolveFlagPath(flags, "key-file", ".benchmark-private/v4/blinding-key.txt");
  const reviewPath = resolveFlagPath(flags, "review", "protocol/v4/review.receipt.json");
  const executionPath = resolveFlagPath(flags, "execution", "protocol/v4/execution.empty.json");
  const [plan, fixtureManifest, privateOracle, blindingKey, reviewReceipt, executionManifest] = await Promise.all([
    readJson(planPath),
    readJson(fixturePath),
    readOptionalJson(oraclePath),
    readOptionalKey(keyPath),
    readOptionalJson(reviewPath),
    readJson(executionPath)
  ]);
  const report = evaluateV4FreezeGate({
    plan,
    fixtureManifest,
    privateOracle,
    blindingKey,
    reviewReceipt,
    executionManifest
  });

  if (booleanFlag(flags, "json")) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    for (const check of report.checks) {
      console.log(`${check.status.toUpperCase()} ${check.id}: ${check.detail}`);
    }
    console.log(
      `V4 freeze gate: ${report.passed ? "READY" : "BLOCKED"} `
        + `(${report.summary.passed}/${report.summary.checks} passed, `
        + `${report.summary.blocked} blocked, ${report.summary.failed} failed)`
    );
  }

  const freezeOutput = stringFlag(flags, "freeze-out", undefined);
  if (freezeOutput) {
    const frozen = freezeV4Plan({
      plan,
      fixtureManifest,
      privateOracle,
      blindingKey,
      reviewReceipt,
      executionManifest,
      frozenAt: stringFlag(flags, "frozen-at", new Date().toISOString())
    });
    const absoluteOutput = path.isAbsolute(freezeOutput)
      ? freezeOutput
      : path.resolve(repositoryRoot, freezeOutput);
    await writeJson(absoluteOutput, frozen);
    console.log(`Wrote human-reviewed frozen v4 plan: ${absoluteOutput}`);
  }

  if (booleanFlag(flags, "require-ready") && !report.passed) {
    throw new Error("V4 freeze gate is blocked; formal Agent trials remain forbidden");
  }
  return report;
}

function resolveFlagPath(flags, name, fallback) {
  const value = stringFlag(flags, name, fallback);
  return path.isAbsolute(value) ? value : path.resolve(repositoryRoot, value);
}

async function readOptionalJson(filePath) {
  return await pathExists(filePath) ? readJson(filePath) : undefined;
}

async function readOptionalKey(filePath) {
  if (!await pathExists(filePath)) return undefined;
  return (await readFile(filePath, "utf8")).trim();
}
