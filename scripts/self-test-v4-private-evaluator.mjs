import assert from "node:assert/strict";
import { mkdir, rm, symlink } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { pathExists, readJson, writeJson } from "../src/lib/files.mjs";
import { repositoryRoot } from "../src/lib/root.mjs";
import { materializeV4Workspace, sha256File } from "../src/lib/v4-execution.mjs";

const privateRoot = path.join(repositoryRoot, ".benchmark-private", "v4");
const evaluatorPath = path.join(privateRoot, "evaluator.mjs");
const root = path.join(
  process.env.LOCALAPPDATA,
  "VertexPalaceBenchmark",
  "v4",
  "evaluator-self-test"
);

export async function selfTestV4PrivateEvaluator() {
  const [fixtureManifest, oracle] = await Promise.all([
    readJson(path.join(repositoryRoot, "protocol", "v4", "fixtures.candidates.json")),
    readJson(path.join(privateRoot, "oracle.json"))
  ]);
  const evaluator = await import(`${pathToFileURL(evaluatorPath).href}?sha=${await sha256File(evaluatorPath)}`);
  await rm(root, { recursive: true, force: true });
  await mkdir(root, { recursive: true });
  const fixtures = [];
  for (const publicFixture of fixtureManifest.fixtures) {
    const privateFixture = oracle.fixtures.find((entry) => entry.fixtureId === publicFixture.id);
    assert.ok(privateFixture, `Missing private fixture ${publicFixture.id}`);
    const fixture = {
      ...publicFixture,
      repository: {
        ...publicFixture.repository,
        frozenCommit: privateFixture.referenceResolution.commit
      }
    };
    const materialized = await materializeV4Workspace({
      fixture,
      armId: fixture.id,
      cacheRoot: path.join(privateRoot, "cache"),
      runsRoot: root
    });
    if (fixture.id === "open-webui-analytics-25919") {
      const sourceVenv = path.join(
        process.env.LOCALAPPDATA,
        "VertexPalaceBenchmark",
        "v4",
        "preflight",
        "open-webui-ascii-preflight",
        "workspace",
        ".venv"
      );
      assert.equal(await pathExists(sourceVenv), true, "Open WebUI preflight venv is missing");
      await symlink(sourceVenv, path.join(materialized.workspace, ".venv"), "junction");
    }
    const result = await evaluator.evaluateV4PrivateArm({
      fixtureId: fixture.id,
      workspace: materialized.workspace,
      lastMessage: fixture.id === "zod-report-input-decision-5509"
        ? "The existing reportInput option explicitly opts in to including sensitive input; privacy remains the default, so no source change is needed."
        : "Reference resolution self-test",
      verification: fixture.verification.commands.map((command) => ({ command, valid: true, passed: true }))
    });
    assert.equal(result.correctnessPassed, true, `${fixture.id} private evaluator rejected its reference resolution`);
    fixtures.push({ fixtureId: fixture.id, referenceAccepted: true });
  }
  const report = {
    schemaVersion: 1,
    protocolVersion: fixtureManifest.protocolVersion,
    status: "passed",
    generatedAt: new Date().toISOString(),
    formalAgentArmsRun: 0,
    evaluatorSha256: await sha256File(evaluatorPath),
    fixtures,
    agentInvoked: false
  };
  await writeJson(
    path.join(repositoryRoot, "docs", "research", "evidence", "real-repository-v4-private-evaluator-self-test.json"),
    report
  );
  return report;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const report = await selfTestV4PrivateEvaluator();
  process.stdout.write(`PASS V4 private evaluator: ${report.fixtures.length}/4 reference resolutions accepted; 0 Agent arms.\n`);
}
