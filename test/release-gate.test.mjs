import assert from "node:assert/strict";
import test from "node:test";
import { evaluateControlFirstReleaseGate } from "../src/lib/release-gate.mjs";

const version = "0.3.0";
const shasum = "4f4f7843cbfebaec0a9f3aade31fac24d96d1133";
const integrity = "sha512-wfxQUxLKk1kQxQm8X1eGKbRaXX/yxIla8KO6PAxj83Fx+7ofwQSzla6tTVvLIlBOxchGy0OmopFdS684GDz9RA==";

test("passes only when registry, lockfile, install, and empty v3 study agree", () => {
  const report = evaluateControlFirstReleaseGate(validFixture());
  assert.equal(report.passed, true);
  assert.deepEqual(report.summary, { checks: 19, passed: 19, failed: 0 });
  assert.equal(report.checks.every((entry) => entry.status === "passed"), true);
});

test("reports every release mismatch without running an Agent arm", () => {
  const fixture = validFixture();
  fixture.registry["dist.shasum"] = "0000000000000000000000000000000000000000";
  fixture.packageLock.packages["node_modules/vertex-palace"].integrity = "sha512-wrong";
  fixture.installedPackage.version = "0.2.3";
  fixture.manifest.trials.push({ trialId: "must-not-exist" });

  const report = evaluateControlFirstReleaseGate(fixture);
  assert.equal(report.passed, false);
  assert.deepEqual(
    report.checks.filter((entry) => entry.status === "failed").map((entry) => entry.id),
    ["manifest-empty", "registry-shasum", "lock-integrity", "installed-version"]
  );
  assert.equal(JSON.stringify(report).includes("session"), false);
});

function validFixture() {
  return {
    plan: {
      schemaVersion: 6,
      protocolVersion: "3.0.0",
      frozen: false,
      execution: {
        palaceVersion: version,
        palaceSourceCommit: "97d1736f971438f7f2913f0b731633b0bab8441d",
        palaceReleaseCommit: "8328ea29d55260e34e2e6170bd420e4c659af39e",
        palacePackageShasum: shasum,
        palacePackageIntegrity: integrity
      },
      trials: Array.from({ length: 16 }, (_, index) => ({ trialId: `trial-${index + 1}` }))
    },
    manifest: {
      protocolVersion: "3.0.0",
      plannedTrials: 16,
      trials: []
    },
    packageJson: {
      dependencies: { "vertex-palace": version }
    },
    packageLock: {
      packages: {
        "": { dependencies: { "vertex-palace": version } },
        "node_modules/vertex-palace": {
          version,
          resolved: `https://registry.npmjs.org/vertex-palace/-/vertex-palace-${version}.tgz`,
          integrity
        }
      }
    },
    installedPackage: { version },
    registry: {
      version,
      "dist.shasum": shasum,
      "dist.integrity": integrity
    }
  };
}
