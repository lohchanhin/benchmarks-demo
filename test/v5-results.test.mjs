import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { analyzeV5Static, canonicalJson } from "../src/lib/v5-static.mjs";

const rootUrl = new URL("../", import.meta.url);

async function readJson(path) {
  return JSON.parse(await readFile(new URL(path, rootUrl), "utf8"));
}

test("published V5 static results reproduce the failed Agent gate", async () => {
  const [targets, results, gate, audit] = await Promise.all([
    readJson("protocol/v5/targets.frozen.json"),
    readJson("results/real-repository-v5/static-results.json"),
    readJson("results/real-repository-v5/agent-gate.json"),
    readJson("results/real-repository-v5/method-audit.json")
  ]);
  assert.equal(results.observations.length, 48);
  assert.equal(new Set(results.observations.map((item) => item.observationId)).size, 48);
  assert.equal(results.observations.filter((item) => item.condition === "candidate").length, 24);
  assert.equal(results.observations.filter((item) => item.condition === "baseline-0.4.0").length, 24);

  const recomputed = analyzeV5Static(targets.targets, results.observations, { repetitions: 2 });
  assert.equal(canonicalJson(recomputed), canonicalJson(results.analysis));
  assert.equal(recomputed.pass, false);
  assert.equal(recomputed.agentStageAllowed, false);
  assert.equal(gate.allowed, false);
  assert.deepEqual(gate.gates, recomputed.gates);
  assert.equal(audit.overallStaticVerdictAfterAudit, "fail");
  assert.equal(audit.agentStageAllowed, false);

  const publication = JSON.stringify({ results, gate, audit });
  assert.doesNotMatch(publication, /[A-Z]:\\|工作资料|sessionId|cliPath|tarballPath|installRoot/);
});
