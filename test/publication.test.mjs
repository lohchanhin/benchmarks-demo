import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { auditPublishedResults } from "../scripts/audit-results.mjs";
import {
  publishRun,
  resultDirectoryForProtocol,
  sanitizeForPublication
} from "../scripts/publish-run.mjs";
import { writeJson } from "../src/lib/files.mjs";

test("publication sanitizer removes session identifiers and local paths", () => {
  const sanitized = sanitizeForPublication({
    sessionId: "secret-session",
    nested: {
      threadId: "secret-thread",
      cli: "D:\\work\\vertex-palace\\palace.cjs",
      message: "opened C:\\Users\\builder\\repo\\file.mjs"
    }
  });
  assert.equal("sessionId" in sanitized, false);
  assert.equal("threadId" in sanitized.nested, false);
  assert.equal(sanitized.nested.cli, "vertex-palace (local package)");
  assert.equal(sanitized.nested.message, "opened <local-path>");
});

test("maps every frozen adaptive protocol to an explicit publication directory", () => {
  assert.equal(resultDirectoryForProtocol("2.0.0"), "adaptive-pilot");
  assert.equal(resultDirectoryForProtocol("2.1.0"), "adaptive-pilot-v2.1");
  assert.equal(resultDirectoryForProtocol("2.2.0"), "adaptive-pilot-v2.2");
  assert.throws(() => resultDirectoryForProtocol("2.3.0"), /No publication directory/);
});

test("publishes a complete sanitized evidence bundle and updates the public manifest", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "benchmark-publication-"));
  const runRoot = path.join(root, "run");
  const outputRoot = path.join(root, "results", "pilot", "trial-01");
  const resultsManifestPath = path.join(root, "results", "manifest.json");
  const arms = { control: {}, "route-only": {}, "full-palace": {}, "adaptive-palace": {} };

  await writeJson(path.join(runRoot, "manifest.json"), {
    id: "trial-01",
    palaceSeed: { cli: "D:\\private\\palace.cjs" },
    arms
  });
  await writeJson(path.join(runRoot, "artifacts", "run-plan.json"), {
    workspace: "C:\\Users\\builder\\fixture",
    thread_id: "secret-thread"
  });
  for (const arm of Object.keys(arms)) {
    await writeJson(path.join(runRoot, "artifacts", `${arm}-evidence.json`), {
      arm,
      sessionId: `secret-${arm}`,
      command: "opened C:\\Users\\builder\\fixture\\README.md"
    });
  }
  await writeJson(path.join(runRoot, "reports", "comparison.json"), {
    runId: "trial-01",
    comparable: false,
    arms: {
      control: { valid: true },
      "route-only": { valid: false },
      "full-palace": { valid: false },
      "adaptive-palace": { valid: false }
    },
    localPath: "D:\\private\\comparison.json"
  });
  await writeFile(
    path.join(runRoot, "reports", "comparison.md"),
    "Session report from C:\\Users\\builder\\fixture\\README.md\n",
    "utf8"
  );
  await writeJson(resultsManifestPath, {
    trials: [{ trialId: "trial-01", runDirectory: "../.benchmark-runs/trial-01" }]
  });

  const published = await publishRun(runRoot, { outputRoot, resultsManifestPath });
  assert.equal(published.hashes.length, 8);
  const markdown = await readFile(path.join(outputRoot, "comparison.md"), "utf8");
  assert.equal(markdown, "Session report from <local-path>\n");
  const evidence = JSON.parse(await readFile(path.join(outputRoot, "control-evidence.json"), "utf8"));
  assert.equal("sessionId" in evidence, false);
  assert.equal(evidence.command, "opened <local-path>");
  const publicManifest = JSON.parse(await readFile(resultsManifestPath, "utf8"));
  assert.equal("runDirectory" in publicManifest.trials[0], false);
  assert.equal(publicManifest.trials[0].report, "pilot/trial-01/comparison.json");
  assert.equal(publicManifest.trials[0].evidenceDirectory, "pilot/trial-01");
  assert.equal(publicManifest.trials[0].rawTranscriptsPublished, false);
  assert.equal(publicManifest.trials[0].comparisonEligible, false);
  assert.deepEqual(publicManifest.trials[0].armValidity, {
    control: true,
    "route-only": false,
    "full-palace": false,
    "adaptive-palace": false
  });
  assert.match(await readFile(path.join(outputRoot, "SHA256SUMS"), "utf8"), /adaptive-palace-evidence\.json/);
  assert.match(await readFile(path.join(outputRoot, "SHA256SUMS"), "utf8"), /comparison\.md/);
});

test("audits the retained four-arm v2 invalid attempt without requiring pilot completion", async () => {
  const summary = await auditPublishedResults("results/adaptive-pilot/manifest.json", {
    requireComplete: false
  });

  assert.deepEqual(summary.errors, []);
  assert.equal(summary.trialCount, 1);
  assert.equal(summary.armCount, 4);
  assert.equal(summary.validArmCount, 1);
  assert.equal(summary.verifiedFileCount, 8);
});
