import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { classifyOracleObservability } from "../src/lib/oracle-observability.mjs";

test("separates base-observable truth from files introduced by the hidden diff", () => {
  const result = classifyOracleObservability({
    basePaths: ["src/handler.py", "CHANGELOG.md", "tests/existing_test.py"],
    implementationFiles: ["src/handler.py"],
    testFiles: ["tests/new_regression_test.py"],
    auxiliaryFiles: ["CHANGELOG.md"]
  });

  assert.deepEqual(result.baseObservable, {
    implementationFiles: ["src/handler.py"],
    testFiles: [],
    auxiliaryFiles: ["CHANGELOG.md"],
    coreFiles: ["src/handler.py"]
  });
  assert.deepEqual(result.futureOnly, {
    implementationFiles: [],
    testFiles: ["tests/new_regression_test.py"],
    auxiliaryFiles: [],
    coreFiles: ["tests/new_regression_test.py"]
  });
  assert.deepEqual(result.creationSurfaceRequired, {
    implementation: false,
    tests: true,
    auxiliary: false
  });
});

test("normalizes separators and removes duplicate oracle paths", () => {
  const result = classifyOracleObservability({
    basePaths: ["./src/value.ts", "src\\value.ts"],
    implementationFiles: ["src\\value.ts", "./src/value.ts"]
  });

  assert.deepEqual(result.baseObservable.coreFiles, ["src/value.ts"]);
  assert.equal(result.counts.basePaths, 1);
});

test("rejects malformed path collections instead of silently changing the oracle", () => {
  assert.throws(
    () => classifyOracleObservability({ basePaths: "src/value.ts" }),
    /must be arrays/
  );
  assert.throws(
    () => classifyOracleObservability({ basePaths: [42] }),
    /must be strings/
  );
});

test("keeps the frozen V6 metric unchanged while publishing a separate observability correction", () => {
  const formal = readJson("results/fresh-repository-v6/static-result.json");
  const audit = readJson("results/fresh-repository-v6/oracle-observability-audit.json");

  assert.equal(formal.analysis.candidate.coreCoverage, 0);
  assert.equal(audit.originalResultPreserved, true);
  assert.deepEqual(audit.formalObservationInterpretation.originalFrozenCoreCoverage, {
    matched: 0,
    expected: 2,
    coverage: 0,
    status: "preserved-original-metric"
  });
  assert.deepEqual(audit.formalObservationInterpretation.baseObservableCoreCoverage, {
    matched: 0,
    expected: 1,
    coverage: 0,
    status: "descriptive-observability-correction"
  });
  assert.equal(audit.formalObservationInterpretation.futureOnlyCore.coverage, null);
});

function readJson(relativePath) {
  return JSON.parse(readFileSync(new URL(`../${relativePath}`, import.meta.url), "utf8"));
}
