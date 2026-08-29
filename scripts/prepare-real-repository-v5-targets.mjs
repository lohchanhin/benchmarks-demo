import assert from "node:assert/strict";
import { createHash, randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { writeJson } from "../src/lib/files.mjs";
import { runProcess } from "../src/lib/process.mjs";
import { repositoryRoot } from "../src/lib/root.mjs";

export const V5_PROTOCOL_VERSION = "5.0.0-candidate.1";
export const V5_REPOSITORIES = Object.freeze([
  { owner: "pallets", name: "click", language: "python" },
  { owner: "spf13", name: "cobra", language: "go" },
  { owner: "sharkdp", name: "fd", language: "rust" },
  { owner: "vitest-dev", name: "vitest", language: "typescript" }
]);

const protocolRoot = path.join(repositoryRoot, "protocol", "v5");
const privateRoot = path.join(repositoryRoot, ".benchmark-private", "v5");
const candidateProductCommit = "8f76d7a36f3430aa7b576c2462f8351936c31ae5";
const mergedSince = "2024-01-01T00:00:00Z";
const pagesPerRepository = 5;
const pageSize = 50;

const pullRequestQuery = `
query($owner: String!, $name: String!, $cursor: String) {
  repository(owner: $owner, name: $name) {
    pullRequests(first: ${pageSize}, after: $cursor, states: MERGED, orderBy: {field: UPDATED_AT, direction: DESC}) {
      pageInfo { hasNextPage endCursor }
      nodes {
        number
        title
        url
        body
        mergedAt
        baseRefOid
        author { login }
        mergeCommit { oid }
        files(first: 20) {
          totalCount
          nodes { path additions deletions changeType }
        }
        closingIssuesReferences(first: 10) {
          nodes { number title url body state }
        }
      }
    }
  }
}`;

export async function prepareV5Targets(options = {}) {
  const seed = options.seed || randomBytes(32).toString("hex");
  assert.match(seed, /^[a-f0-9]{64}$/, "V5 seed must be 32 bytes encoded as lowercase hexadecimal");
  await assertCandidateCommitAvailable(candidateProductCommit);

  const eligible = [];
  const repositoryAudits = [];
  for (const repository of V5_REPOSITORIES) {
    const pulls = await fetchMergedPullRequests(repository);
    const accepted = pulls
      .map((pull) => evaluatePullRequest(repository, pull, seed))
      .filter((entry) => entry.eligible);
    repositoryAudits.push({
      repository: `${repository.owner}/${repository.name}`,
      fetchedPullRequests: pulls.length,
      eligiblePullRequests: accepted.length
    });
    eligible.push(...accepted);
  }

  const selected = selectTargets(eligible, seed);
  const privateTargets = [];
  for (const target of selected) {
    const diff = await fetchPullRequestDiff(target.repository, target.pullRequest.number);
    const diffSha256 = sha256(diff);
    const diffPath = path.join(privateRoot, "diffs", `${target.id}.diff`);
    await mkdir(path.dirname(diffPath), { recursive: true });
    await writeFile(diffPath, diff, "utf8");
    privateTargets.push({
      id: target.id,
      repository: target.repository,
      baseCommit: target.baseCommit,
      mergeCommit: target.mergeCommit,
      issue: target.issue,
      pullRequest: target.pullRequest,
      exactChangedFiles: target.oracle.exactChangedFiles,
      implementationFiles: target.oracle.implementationFiles,
      testFiles: target.oracle.testFiles,
      auxiliaryFiles: target.oracle.auxiliaryFiles,
      diffSha256
    });
  }

  const oracle = {
    schemaVersion: 1,
    protocolVersion: V5_PROTOCOL_VERSION,
    generatedAt: new Date().toISOString(),
    targets: privateTargets
  };
  const publicTargets = {
    schemaVersion: 1,
    protocolVersion: V5_PROTOCOL_VERSION,
    status: "frozen-before-palace-observation",
    generatedAt: new Date().toISOString(),
    seed,
    candidate: {
      repository: "https://github.com/lohchanhin/vertex-palace",
      sourceCommit: candidateProductCommit,
      packageVersion: "0.4.0-development"
    },
    publicBaseline: {
      package: "vertex-palace",
      version: "0.4.0"
    },
    comparison: {
      static: ["candidate", "public-0.4.0"],
      agentGate: ["candidate", "control"],
      executionOrder: "sequential-balanced",
      parallelExecution: false
    },
    gates: {
      macroCoreCoverageMinimum: 0.9,
      macroRouteFocusMinimum: 0.7,
      perTargetCoverageMinimum: 0.5,
      perTargetFocusMinimum: 0.4,
      contextTokenMaximum: 6000,
      deterministicRepetitions: 2,
      agentExecutionRequiresStaticPass: true
    },
    targets: selected.map(toPublicTarget)
  };
  const pool = {
    schemaVersion: 1,
    protocolVersion: V5_PROTOCOL_VERSION,
    generatedAt: new Date().toISOString(),
    seed,
    mergedSince,
    mechanicalCriteria: {
      mergedPullRequest: true,
      linkedClosingIssue: true,
      changedFileCount: { minimum: 2, maximum: 8 },
      changedLineMaximum: 500,
      implementationAndFocusedTestRequired: true,
      dependencyBotsExcluded: true,
      releaseAndDocumentationOnlyChangesExcluded: true
    },
    repositoryAudits,
    eligible: eligible.map((entry) => ({
      repository: entry.repository,
      language: entry.language,
      pullRequest: entry.pullRequest,
      issue: { number: entry.issue.number, url: entry.issue.url, title: entry.issue.title },
      mergedAt: entry.mergedAt,
      changedFileCount: entry.oracle.exactChangedFiles.length,
      implementationFileCount: entry.oracle.implementationFiles.length,
      testFileCount: entry.oracle.testFiles.length,
      changedLines: entry.changedLines,
      rankHash: entry.rankHash
    }))
  };

  await mkdir(protocolRoot, { recursive: true });
  await mkdir(privateRoot, { recursive: true });
  await Promise.all([
    writeJson(path.join(protocolRoot, "target-pool.json"), pool),
    writeJson(path.join(protocolRoot, "targets.frozen.json"), publicTargets),
    writeJson(path.join(privateRoot, "oracle.json"), oracle)
  ]);

  const scriptSource = await readFile(fileURLToPath(import.meta.url), "utf8");
  const poolSource = await readFile(path.join(protocolRoot, "target-pool.json"), "utf8");
  const targetsSource = await readFile(path.join(protocolRoot, "targets.frozen.json"), "utf8");
  const freeze = {
    schemaVersion: 1,
    protocolVersion: V5_PROTOCOL_VERSION,
    status: "frozen-before-palace-observation",
    frozenAt: new Date().toISOString(),
    seed,
    selectedTargetCount: publicTargets.targets.length,
    productSourceCommit: candidateProductCommit,
    artifacts: {
      selectorSha256: sha256(scriptSource),
      targetPoolSha256: sha256(poolSource),
      targetsSha256: sha256(targetsSource),
      privateOracleCommitment: sha256(canonicalJson(oracle))
    },
    declaration: "No selected task has been sent to Vertex Palace and no Agent arm has run before this freeze. Selected targets cannot be replaced after observing outcomes."
  };
  await writeJson(path.join(protocolRoot, "freeze.json"), freeze);
  return { pool, publicTargets, oracle, freeze };
}

async function fetchMergedPullRequests(repository) {
  const nodes = [];
  let cursor;
  for (let page = 0; page < pagesPerRepository; page += 1) {
    const args = [
      "api", "graphql",
      "-f", `query=${pullRequestQuery}`,
      "-F", `owner=${repository.owner}`,
      "-F", `name=${repository.name}`
    ];
    if (cursor) args.push("-F", `cursor=${cursor}`);
    const result = await runProcess("gh", args, {
      cwd: repositoryRoot,
      check: true,
      timeoutMs: 120_000
    });
    const connection = JSON.parse(result.stdout).data.repository.pullRequests;
    nodes.push(...connection.nodes);
    if (!connection.pageInfo.hasNextPage) break;
    cursor = connection.pageInfo.endCursor;
  }
  return nodes;
}

export function evaluatePullRequest(repository, pull, seed) {
  const repositoryName = `${repository.owner}/${repository.name}`;
  const files = pull.files?.nodes || [];
  const issue = pull.closingIssuesReferences?.nodes?.[0];
  const author = pull.author?.login || "";
  const changedLines = files.reduce((sum, file) => sum + file.additions + file.deletions, 0);
  const classified = classifyFiles(repository.language, files.map((file) => file.path));
  const reasons = [];
  if (!pull.mergedAt || pull.mergedAt < mergedSince) reasons.push("outside-date-window");
  if (!pull.baseRefOid || !pull.mergeCommit?.oid) reasons.push("missing-frozen-commit");
  if (!issue?.url || !issue?.title || !issue?.body || issue.body.trim().length < 40) reasons.push("missing-coherent-linked-issue");
  if (files.length < 2 || pull.files?.totalCount !== files.length || files.length > 8) reasons.push("changed-file-count-out-of-range");
  if (changedLines > 500) reasons.push("change-too-large");
  if (classified.implementationFiles.length === 0) reasons.push("no-implementation-file");
  if (classified.testFiles.length === 0) reasons.push("no-focused-test-file");
  if (/\[bot\]$|dependabot|renovate/i.test(author)) reasons.push("automation-author");
  if (/^(?:chore|docs?|release|build|ci|deps?)(?:\(.+\))?[!:]/i.test(pull.title)) reasons.push("non-product-title");
  const rankHash = sha256(`${seed}\n${repositoryName}\n${pull.url}`);
  return {
    eligible: reasons.length === 0,
    reasons,
    repository: repositoryName,
    language: repository.language,
    mergedAt: pull.mergedAt,
    baseCommit: pull.baseRefOid,
    mergeCommit: pull.mergeCommit?.oid,
    pullRequest: { number: pull.number, title: pull.title, url: pull.url },
    issue: issue ? { number: issue.number, title: issue.title, url: issue.url, body: normalizeIssueBody(issue.body) } : null,
    changedLines,
    rankHash,
    oracle: {
      exactChangedFiles: files.map((file) => file.path).sort(),
      ...classified
    }
  };
}

export function selectTargets(eligible, seed) {
  const selected = [];
  for (const repository of V5_REPOSITORIES) {
    const repositoryName = `${repository.owner}/${repository.name}`;
    const pool = eligible
      .filter((entry) => entry.repository === repositoryName)
      .sort((left, right) => left.rankHash.localeCompare(right.rankHash));
    assert.ok(pool.length >= 3, `${repositoryName} has only ${pool.length} mechanically eligible targets`);
    const used = new Set();
    const highConnectivity = pool.find((entry) => entry.oracle.exactChangedFiles.length >= 4);
    assert.ok(highConnectivity, `${repositoryName} has no eligible high-connectivity target`);
    used.add(highConnectivity.pullRequest.number);
    const reference = pool.find((entry) => !used.has(entry.pullRequest.number));
    used.add(reference.pullRequest.number);
    const local = pool.find((entry) => !used.has(entry.pullRequest.number));
    const assignments = [
      ["local-complete", local],
      ["reference-grounded", reference],
      ["high-connectivity", highConnectivity]
    ];
    for (const [stratum, entry] of assignments) {
      selected.push({
        ...entry,
        id: `${repository.name}-${entry.pullRequest.number}-${stratum}`,
        stratum,
        selectionHash: sha256(`${seed}\n${repositoryName}\n${stratum}\n${entry.pullRequest.url}`)
      });
    }
  }
  return selected;
}

export function classifyFiles(language, paths) {
  const testFiles = paths.filter((file) => isTestFile(language, file));
  const implementationFiles = paths.filter((file) => isImplementationFile(language, file) && !testFiles.includes(file));
  const claimed = new Set([...implementationFiles, ...testFiles]);
  return {
    implementationFiles: implementationFiles.sort(),
    testFiles: testFiles.sort(),
    auxiliaryFiles: paths.filter((file) => !claimed.has(file)).sort()
  };
}

function isImplementationFile(language, file) {
  if (isGeneratedOrMetadata(file)) return false;
  if (language === "python") return file.endsWith(".py");
  if (language === "go") return file.endsWith(".go");
  if (language === "rust") return file.endsWith(".rs");
  return /\.[cm]?[jt]sx?$/.test(file) && !file.endsWith(".d.ts");
}

function isTestFile(language, file) {
  if (language === "go") return /_test\.go$/.test(file);
  if (language === "rust") return /(^|\/)(tests?|benches)\//.test(file) || /(?:^|_)tests?\.rs$/.test(file);
  if (language === "python") return /(^|\/)tests?\//.test(file) || /(^|\/)test_.*\.py$/.test(file);
  return /(^|\/)(tests?|__tests__)\//.test(file) || /\.(?:test|spec)\.[cm]?[jt]sx?$/.test(file);
}

function isGeneratedOrMetadata(file) {
  return /(^|\/)(?:dist|vendor|node_modules|target|generated|fixtures?)\//i.test(file)
    || /(?:^|\/)(?:changelog|changes|license|readme)(?:\.|$)/i.test(file)
    || /(?:lock|sum)\.(?:json|yaml|yml|toml)$|(?:^|\/)go\.sum$|(?:^|\/)Cargo\.lock$/i.test(file)
    || /\.(?:md|mdx|rst|txt|json|ya?ml|toml)$/i.test(file);
}

function normalizeIssueBody(value) {
  return value
    .replace(/<details\b[^>]*>[\s\S]*?<\/details>/gi, " ")
    .replace(/\r\n?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, 12_000);
}

function toPublicTarget(target) {
  const task = target.stratum === "reference-grounded"
    ? `Fix ${target.issue.url}. Add focused regression coverage and preserve existing behavior.`
    : `${target.issue.title}\n\n${target.issue.body}`;
  return {
    id: target.id,
    repository: `https://github.com/${target.repository}`,
    language: target.language,
    stratum: target.stratum,
    baseCommit: target.baseCommit,
    mergeCommit: target.mergeCommit,
    issue: { number: target.issue.number, title: target.issue.title, url: target.issue.url },
    pullRequest: target.pullRequest,
    task,
    verification: verificationCommands(target.language, target.oracle.testFiles),
    selectionHash: target.selectionHash
  };
}

function verificationCommands(language, testFiles) {
  if (language === "python") return [`python -m pytest -q ${testFiles.join(" ")}`];
  if (language === "go") return ["go test ./..."];
  if (language === "rust") return ["cargo test"];
  return [`pnpm vitest run ${testFiles.join(" ")}`];
}

async function fetchPullRequestDiff(repository, number) {
  const result = await runProcess("gh", [
    "api",
    "-H", "Accept: application/vnd.github.v3.diff",
    `/repos/${repository}/pulls/${number}`
  ], { cwd: repositoryRoot, check: true, timeoutMs: 120_000 });
  return result.stdout;
}

async function assertCandidateCommitAvailable(commit) {
  const productRoot = path.resolve(repositoryRoot, "..", "codex palace");
  const type = await runProcess("git", ["cat-file", "-t", `${commit}^{commit}`], {
    cwd: productRoot,
    check: true
  });
  assert.equal(type.stdout.trim(), "commit", "Frozen Vertex Palace candidate commit is unavailable");
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const seedIndex = process.argv.indexOf("--seed");
  const seed = seedIndex >= 0 ? process.argv[seedIndex + 1] : undefined;
  const result = await prepareV5Targets({ seed });
  process.stdout.write(`${JSON.stringify({
    protocolVersion: V5_PROTOCOL_VERSION,
    eligibleTargets: result.pool.eligible.length,
    selectedTargets: result.publicTargets.targets.length,
    oracleCommitment: result.freeze.artifacts.privateOracleCommitment
  }, null, 2)}\n`);
}
