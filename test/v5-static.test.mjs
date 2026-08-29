import assert from "node:assert/strict";
import test from "node:test";
import {
  analyzeV5Static,
  balancedV5Order,
  measureV5Observation,
  routeFilesFromContext
} from "../src/lib/v5-static.mjs";

const target = {
  id: "sample",
  repository: "https://github.com/example/sample",
  language: "typescript",
  stratum: "reference-grounded"
};
const oracle = {
  implementationFiles: ["src/feature.ts"],
  testFiles: ["test/feature.test.ts"],
  auxiliaryFiles: ["CHANGELOG.md"]
};

test("balances candidate and baseline positions within every target", () => {
  assert.deepEqual(balancedV5Order(0, 1), ["candidate", "baseline-0.4.0"]);
  assert.deepEqual(balancedV5Order(0, 2), ["baseline-0.4.0", "candidate"]);
  assert.deepEqual(balancedV5Order(1, 1), ["baseline-0.4.0", "candidate"]);
  assert.deepEqual(balancedV5Order(1, 2), ["candidate", "baseline-0.4.0"]);
});

test("extracts unique normalized files from every context layer", () => {
  const files = routeFilesFromContext({
    primaryCandidate: "src/feature.ts:1-20",
    route: { primary: [{ sourcePath: "test/feature.test.ts" }] },
    context: [{ sourcePath: "src/feature.ts" }],
    deferredReferences: ["CHANGELOG.md#L2-L4"]
  });
  assert.deepEqual(files, ["CHANGELOG.md", "src/feature.ts", "test/feature.test.ts"]);
});

test("measures role closure, focus, confidence, metrics, and tracked pollution", () => {
  const output = {
    decision: "route",
    taskGrounding: { status: "resolved", resolutionStatus: "cache-hit" },
    mode: "route-lite",
    route: {
      confidence: 0.82,
      primary: [{ sourcePath: "src/feature.ts" }, { sourcePath: "test/feature.test.ts" }],
      support: [{ sourcePath: "CHANGELOG.md" }, { sourcePath: "src/noise.ts" }]
    },
    executionBoundaries: { stopEnforced: false },
    payload: { contextEstimatedTokens: 900, contextBytes: 100 }
  };
  const measured = measureV5Observation({
    target,
    oracle,
    output,
    rawBytes: 100,
    status: "?? .palace/index/nodes.json\n M src/user-file.ts\n"
  });
  assert.equal(measured.roleClosure, true);
  assert.equal(measured.core.coverage, 1);
  assert.equal(measured.routeFocus, 0.75);
  assert.deepEqual(measured.trackedFilePollution, ["M src/user-file.ts"]);
  assert.equal(measured.payloadMetricAgreement, true);
  assert.equal(measured.overconfident, false);
});

test("static analysis fails closed when one target lacks focused tests", () => {
  const targets = [target];
  const good = {
    condition: "candidate",
    targetId: target.id,
    stratum: target.stratum,
    decision: "route",
    grounding: { status: "resolved", resolutionStatus: "cache-hit" },
    mode: "route-lite",
    routeFiles: ["src/feature.ts", "test/feature.test.ts", "CHANGELOG.md"],
    routeFileCount: 3,
    core: { coverage: 1 },
    auxiliary: { coverage: 1 },
    roleClosure: true,
    routeFocus: 1,
    contextTokens: 1000,
    overconfident: false,
    wrongForcedStop: false,
    trackedFilePollution: [],
    payloadMetricAgreement: true
  };
  const bad = { ...good, roleClosure: false, core: { coverage: 0.5 }, routeFocus: 0.5 };
  const baseline = { ...good, condition: "baseline-0.4.0" };
  const analysis = analyzeV5Static(targets, [good, bad, baseline, baseline]);
  assert.equal(analysis.pass, false);
  assert.equal(analysis.agentStageAllowed, false);
  assert.equal(analysis.gates.implementationAndTestRoleClosure100, false);
});
