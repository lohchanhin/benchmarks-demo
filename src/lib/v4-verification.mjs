import path from "node:path";

const NODE_ARCHIVE_SHA256 = "7df0bc9375723f4a86b3aa1b7cc73342423d9677a8df4538aca31a049e309c29";
const REQUESTS_WINDOWS_EXCLUSION =
  "not test_different_connection_pool_for_tls_settings_verify_bundle_unexpired_cert";

export function parseSvelteCheckSummary(output) {
  const match = /svelte-check found (\d+) errors and (\d+) warnings in (\d+) files/i.exec(String(output));
  if (!match) return null;
  return {
    errors: Number(match[1]),
    warnings: Number(match[2]),
    files: Number(match[3])
  };
}

export function evaluateV4Verification({ command, exitCode, output, policy, durationMs }) {
  requireString(command, "V4 verification command");
  requireObject(policy, "V4 verification policy");
  if (!Number.isInteger(exitCode)) throw new Error("V4 verification exit code must be an integer");

  if (policy.kind === "exit-zero") {
    return {
      command,
      policy: policy.kind,
      valid: true,
      passed: exitCode === 0,
      exitCode,
      ...(Number.isFinite(durationMs) ? { durationMs: Math.round(durationMs) } : {})
    };
  }

  if (policy.kind === "preflight-invalid") {
    return {
      command,
      policy: policy.kind,
      valid: false,
      passed: null,
      exitCode,
      reason: requireString(policy.reason, "Invalid verification reason"),
      ...(Number.isFinite(durationMs) ? { durationMs: Math.round(durationMs) } : {})
    };
  }

  if (policy.kind === "baseline-delta") {
    const baseline = validateSvelteSummary(policy.baseline, "V4 verification baseline");
    const observed = parseSvelteCheckSummary(output);
    if (!observed) {
      return {
        command,
        policy: policy.kind,
        valid: true,
        passed: false,
        exitCode,
        baselineCompared: false,
        reason: "svelte-check summary was not found",
        ...(Number.isFinite(durationMs) ? { durationMs: Math.round(durationMs) } : {})
      };
    }
    const delta = {
      errors: observed.errors - baseline.errors,
      warnings: observed.warnings - baseline.warnings,
      files: observed.files - baseline.files
    };
    return {
      command,
      policy: policy.kind,
      valid: true,
      passed: delta.errors <= 0 && delta.warnings <= 0,
      exitCode,
      baselineCompared: true,
      baseline,
      observed,
      delta,
      ...(Number.isFinite(durationMs) ? { durationMs: Math.round(durationMs) } : {})
    };
  }

  throw new Error(`Unknown V4 verification policy: ${policy.kind}`);
}

export function buildV4FixtureProfiles({
  requestsLockSha256,
  openWebuiBaselineSha256,
  evaluatorSha256,
  pythonExecutableSha256,
  uvExecutableSha256,
  codexPackageLockSha256
}) {
  requireSha256(requestsLockSha256, "Requests dependency lock hash");
  requireSha256(openWebuiBaselineSha256, "Open WebUI baseline output hash");
  requireSha256(evaluatorSha256, "V4 private evaluator hash");
  requireSha256(pythonExecutableSha256, "Python executable hash");
  requireSha256(uvExecutableSha256, "uv executable hash");
  requireSha256(codexPackageLockSha256, "Codex package lock hash");
  return {
    schemaVersion: 1,
    workspace: {
      platform: "win32-x64",
      rootPolicy: "absolute-ascii-only",
      lineEndings: "git-core-autocrlf-false",
      dependencyIsolation: "reviewed-shared-bundle-per-fixture"
    },
    runtimes: {
      node: {
        version: "22.23.1",
        distribution: "node-v22.23.1-win-x64.zip",
        sha256: NODE_ARCHIVE_SHA256
      },
      npm: { version: "10.9.8" },
      pnpm: { version: "10.12.1", provisioner: "corepack" },
      python: {
        version: "3.11.9",
        implementation: "CPython",
        architecture: "64bit",
        executableSha256: pythonExecutableSha256
      },
      uv: { version: "0.11.30", executableSha256: uvExecutableSha256 },
      codex: {
        package: "@openai/codex",
        version: "0.145.0-alpha.28",
        registrySha1: "fe894d1ab8a248ef1f226a1d81efc333b748167d",
        registryIntegrity: "sha512-DNNiIMllsHaY9jRNzE3pYdgPDi2EfQV2itvyxEpteQfFqR7CvIyogWgTGMJ5+WWZsQe9/ni5HoCE9O/DDbxmnw==",
        packageLockSha256: codexPackageLockSha256
      }
    },
    fixtures: {
      "zod-transform-refine-4926": zodProfile("small-local"),
      "zod-report-input-decision-5509": zodProfile("decision-memory"),
      "requests-stream-regression-7432": {
        setup: [
          "uv venv --python 3.11.9 .venv",
          "uv pip sync protocol/v4/dependencies/requests-win-py311.txt --require-hashes --link-mode=copy",
          "uv pip install --no-deps -e ."
        ],
        dependencyLock: {
          path: "protocol/v4/dependencies/requests-win-py311.txt",
          sha256: requestsLockSha256
        },
        environment: {
          PYTEST_ADDOPTS: `-k \"${REQUESTS_WINDOWS_EXCLUSION}\"`
        },
        verification: [{
          command: "python -m pytest -q tests/test_requests.py",
          policy: { kind: "exit-zero" }
        }],
        preflight: {
          status: "passed-with-platform-exclusion",
          baseline: "335 passed, 1 skipped, 1 deselected, 1 xfailed",
          exclusionReason:
            "The frozen repository stores tests/certs/valid/ca as a symlink; this Windows account cannot create it. "
            + "The deselected TLS bundle test is unrelated to the stream regression."
        }
      },
      "open-webui-analytics-25919": {
        setup: [
          "uv sync --frozen --group dev --no-install-project --link-mode=copy",
          "npm ci --ignore-scripts --no-audit --no-fund"
        ],
        environment: { CI: "1", PYTHONPATH: "backend" },
        verification: [
          {
            command: "npm run check",
            policy: {
              kind: "baseline-delta",
              baseline: { errors: 9702, warnings: 274, files: 386 },
              baselineOutputSha256: openWebuiBaselineSha256
            }
          },
          {
            command: "python -m pytest -q backend/tests",
            policy: {
              kind: "preflight-invalid",
              reason: "backend/tests does not exist at the frozen commit"
            }
          }
        ],
        preflight: {
          status: "baseline-fails",
          publicCommandPreserved: true,
          hiddenCorrectnessRequired: true
        }
      }
    },
    externalEvaluator: {
      visibility: "private-until-reveal",
      algorithm: "sha256-exact-file-bytes",
      sha256: evaluatorSha256
    }
  };
}

export function buildV4ExecutionEnvironment({
  inheritedPath,
  nodeBin,
  pythonBin,
  dependencyBin,
  corepackHome,
  extra = {}
}) {
  requireString(inheritedPath, "Inherited PATH");
  const reviewed = [dependencyBin, pythonBin, nodeBin].map((entry) => requireString(entry, "Reviewed tool directory"));
  const reviewedNormalized = new Set(reviewed.map(normalizedDirectory));
  const inherited = inheritedPath
    .split(path.delimiter)
    .filter(Boolean)
    .filter((entry) => !reviewedNormalized.has(normalizedDirectory(entry)));
  const selected = [...reviewed, ...inherited].join(path.delimiter);
  return {
    PATH: selected,
    Path: selected,
    COREPACK_HOME: requireString(corepackHome, "Reviewed Corepack home"),
    ...extra
  };
}

export function validateAsciiWorkspaceRoot(root) {
  const resolved = path.resolve(requireString(root, "V4 workspace root"));
  if (!/^[\x20-\x7E]+$/.test(resolved)) {
    throw new Error("V4 formal workspace root must be an ASCII-only absolute path on Windows");
  }
  return true;
}

function zodProfile(routingProfile) {
  return {
    setup: ["pnpm install --frozen-lockfile --ignore-scripts"],
    environment: { CI: "1" },
    verification: [{
      command: routingProfile === "small-local"
        ? "pnpm vitest packages/zod/src/v4/classic/tests/transform.test.ts"
        : "pnpm vitest packages/zod/src/v4/classic/tests/error.test.ts",
      policy: { kind: "exit-zero" }
    }],
    preflight: { status: "passed", routingProfile }
  };
}

function validateSvelteSummary(value, label) {
  requireObject(value, label);
  for (const key of ["errors", "warnings", "files"]) {
    if (!Number.isInteger(value[key]) || value[key] < 0) {
      throw new Error(`${label} ${key} must be a non-negative integer`);
    }
  }
  return { errors: value.errors, warnings: value.warnings, files: value.files };
}

function normalizedDirectory(value) {
  return path.resolve(String(value)).replaceAll("\\", "/").replace(/\/$/, "").toLowerCase();
}

function requireSha256(value, label) {
  if (typeof value !== "string" || !/^[a-f0-9]{64}$/.test(value)) {
    throw new Error(`${label} must be a lowercase SHA-256 digest`);
  }
  return value;
}

function requireObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value;
}

function requireString(value, label) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${label} must be a non-empty string`);
  }
  return value;
}
