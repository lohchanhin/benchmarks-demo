import assert from "node:assert/strict";
import test from "node:test";
import { evaluateControlFirstReleaseGate } from "../src/lib/release-gate.mjs";

const version = "0.3.0";
const shasum = "9a04440d7e95c4d34e68e1b7e2cd3f6ecd62e83e";
const integrity = "sha512-DXALXKH1k/Gj7PoprNDmz/tHlYum2T7QsU32el76mHy/U3u42zY02cshm5P8lwY6yqzkIoZ6h9/6df0QOlJp4Q==";

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
        palaceSourceCommit: "a29053f5952131887ff057a8fa7e6777ab045e1f",
        palaceReleaseCommit: "1331d9da0aa242549026d70e7c752638c3169044",
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
