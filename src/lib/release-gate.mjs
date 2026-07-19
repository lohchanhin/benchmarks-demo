const commitPattern = /^[a-f0-9]{40}$/;
const shasumPattern = /^[a-f0-9]{40}$/;
const integrityPattern = /^sha512-[A-Za-z0-9+/]+={0,2}$/;

export function evaluateControlFirstReleaseGate(input) {
  const plan = input.plan ?? {};
  const manifest = input.manifest ?? {};
  const packageJson = input.packageJson ?? {};
  const packageLock = input.packageLock ?? {};
  const installedPackage = input.installedPackage ?? {};
  const registry = normalizeRegistryMetadata(input.registry);
  const execution = plan.execution ?? {};
  const expectedVersion = execution.palaceVersion ?? null;
  const expectedShasum = execution.palacePackageShasum ?? null;
  const expectedIntegrity = execution.palacePackageIntegrity ?? null;
  const rootLock = packageLock.packages?.[""] ?? {};
  const lockedPackage = packageLock.packages?.["node_modules/vertex-palace"] ?? {};
  const expectedTarball = expectedVersion
    ? `https://registry.npmjs.org/vertex-palace/-/vertex-palace-${expectedVersion}.tgz`
    : null;
  const checks = [];

  addCheck(checks, "protocol-version", plan.protocolVersion === "3.0.0", "3.0.0", plan.protocolVersion);
  addCheck(checks, "plan-schema", plan.schemaVersion === 6, 6, plan.schemaVersion);
  addCheck(checks, "plan-unfrozen", plan.frozen === false, false, plan.frozen);
  addCheck(checks, "manifest-protocol", manifest.protocolVersion === plan.protocolVersion, plan.protocolVersion, manifest.protocolVersion);
  addCheck(checks, "manifest-planned-trials", manifest.plannedTrials === plan.trials?.length, plan.trials?.length, manifest.plannedTrials);
  addCheck(checks, "manifest-empty", Array.isArray(manifest.trials) && manifest.trials.length === 0, 0, manifest.trials?.length);
  addCheck(checks, "source-commit", commitPattern.test(execution.palaceSourceCommit ?? ""), "40 lowercase hex characters", execution.palaceSourceCommit);
  addCheck(checks, "release-commit", commitPattern.test(execution.palaceReleaseCommit ?? ""), "40 lowercase hex characters", execution.palaceReleaseCommit);
  addCheck(checks, "package-shasum-format", shasumPattern.test(expectedShasum ?? ""), "40 lowercase hex characters", expectedShasum);
  addCheck(checks, "package-integrity-format", integrityPattern.test(expectedIntegrity ?? ""), "sha512 integrity", expectedIntegrity);
  addCheck(checks, "registry-version", registry.version === expectedVersion, expectedVersion, registry.version);
  addCheck(checks, "registry-shasum", registry.shasum === expectedShasum, expectedShasum, registry.shasum);
  addCheck(checks, "registry-integrity", registry.integrity === expectedIntegrity, expectedIntegrity, registry.integrity);
  addCheck(checks, "package-json-version", packageJson.dependencies?.["vertex-palace"] === expectedVersion, expectedVersion, packageJson.dependencies?.["vertex-palace"]);
  addCheck(checks, "lock-root-version", rootLock.dependencies?.["vertex-palace"] === expectedVersion, expectedVersion, rootLock.dependencies?.["vertex-palace"]);
  addCheck(checks, "lock-package-version", lockedPackage.version === expectedVersion, expectedVersion, lockedPackage.version);
  addCheck(checks, "lock-tarball", lockedPackage.resolved === expectedTarball, expectedTarball, lockedPackage.resolved);
  addCheck(checks, "lock-integrity", lockedPackage.integrity === expectedIntegrity, expectedIntegrity, lockedPackage.integrity);
  addCheck(checks, "installed-version", installedPackage.version === expectedVersion, expectedVersion, installedPackage.version);

  const passedChecks = checks.filter((entry) => entry.status === "passed").length;
  return {
    schemaVersion: 1,
    gate: "control-first-v3-release",
    protocolVersion: plan.protocolVersion ?? null,
    package: expectedVersion ? `vertex-palace@${expectedVersion}` : null,
    passed: passedChecks === checks.length,
    summary: {
      checks: checks.length,
      passed: passedChecks,
      failed: checks.length - passedChecks
    },
    checks
  };
}

function normalizeRegistryMetadata(value = {}) {
  return {
    version: value.version ?? null,
    shasum: value["dist.shasum"] ?? value.dist?.shasum ?? null,
    integrity: value["dist.integrity"] ?? value.dist?.integrity ?? null
  };
}

function addCheck(checks, id, passed, expected, actual) {
  checks.push({
    id,
    status: passed ? "passed" : "failed",
    expected: expected ?? null,
    actual: actual ?? null
  });
}
