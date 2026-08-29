import assert from "node:assert/strict";
import { createHash, randomBytes } from "node:crypto";
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { writeJson } from "../src/lib/files.mjs";
import { runProcess } from "../src/lib/process.mjs";
import { repositoryRoot } from "../src/lib/root.mjs";
import { classifyFiles } from "./prepare-real-repository-v5-targets.mjs";

const protocolVersion = "6.0.0-smoke.1";
const protocolRoot = path.join(repositoryRoot, "protocol", "v6");
const privateRoot = path.join(repositoryRoot, ".benchmark-private", "v6");
const productRoot = path.resolve(repositoryRoot, "..", "codex palace");
const allowedLanguages = new Map([
  ["JavaScript", "typescript"],
  ["TypeScript", "typescript"],
  ["Python", "python"],
  ["Go", "go"],
  ["Rust", "rust"]
]);
const mergedAfter = "2025-01-01";

const pullRequestSearchQuery = `
query($searchQuery: String!) {
  search(first: 100, type: ISSUE, query: $searchQuery) {
    issueCount
    nodes {
      ... on PullRequest {
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
        repository {
          nameWithOwner
          url
          isPrivate
          isFork
          isArchived
          isDisabled
          diskUsage
          stargazerCount
          pushedAt
          primaryLanguage { name }
        }
      }
    }
  }
}`;

export async function prepareFreshRepositoryV6(options = {}) {
  const outputExists = await Promise.all([
    exists(path.join(protocolRoot, "freeze.json")),
    exists(path.join(protocolRoot, "target.frozen.json")),
    exists(path.join(privateRoot, "oracle.json"))
  ]);
  assert.ok(outputExists.every((value) => !value), "V6 freeze artifacts already exist; replacement is forbidden.");

  const seed = options.seed || randomBytes(32).toString("hex");
  assert.match(seed, /^[a-f0-9]{64}$/, "Seed must be 32 bytes encoded as lowercase hexadecimal.");
  await assertCleanTrackedWorktree(repositoryRoot);
  await assertCleanTrackedWorktree(productRoot);

  const observed = await collectObservedRepositories([repositoryRoot, productRoot]);
  const searchQuery = [
    "is:pr",
    "is:merged",
    "linked:issue",
    `merged:>=${mergedAfter}`,
    "sort:updated-desc"
  ].join(" ");
  const response = await githubGraphql(searchQuery);
  const rawNodes = response?.data?.search?.nodes || [];
  const candidates = rawNodes
    .map((pull) => evaluatePullRequest(pull, observed, seed))
    .filter((entry) => entry.eligible)
    .sort((left, right) => left.rankHash.localeCompare(right.rankHash));
  assert.ok(candidates.length > 0, "The mechanically eligible fresh-repository pool is empty.");

  const selected = candidates[0];
  const diff = await fetchPullRequestDiff(selected.repository.nameWithOwner, selected.pullRequest.number);
  const oracle = {
    schemaVersion: 1,
    protocolVersion,
    generatedAt: new Date().toISOString(),
    targetId: selected.id,
    repository: selected.repository.nameWithOwner,
    issue: selected.issue,
    pullRequest: selected.pullRequest,
    baseCommit: selected.baseCommit,
    mergeCommit: selected.mergeCommit,
    exactChangedFiles: selected.oracle.exactChangedFiles,
    implementationFiles: selected.oracle.implementationFiles,
    testFiles: selected.oracle.testFiles,
    auxiliaryFiles: selected.oracle.auxiliaryFiles,
    diffSha256: sha256(diff)
  };

  const candidateCliPath = path.join(productRoot, "dist", "palace.cjs");
  const candidateCli = await readFile(candidateCliPath);
  const productCommit = (await gitOutput(productRoot, ["rev-parse", "HEAD"])).trim();
  const baselineShasum = await fetchNpmShasum("vertex-palace", "0.4.0");
  const task = `${selected.issue.title}\n\n${normalizeIssueBody(selected.issue.body)}`;
  const target = {
    schemaVersion: 1,
    protocolVersion,
    status: "frozen-before-palace-observation",
    generatedAt: new Date().toISOString(),
    id: selected.id,
    repository: selected.repository.url,
    cloneUrl: `${selected.repository.url}.git`,
    language: selected.language,
    baseCommit: selected.baseCommit,
    mergeCommit: selected.mergeCommit,
    issue: withoutBody(selected.issue),
    pullRequest: selected.pullRequest,
    task,
    referencePolicy: "off"
  };
  const pool = {
    schemaVersion: 1,
    protocolVersion,
    generatedAt: new Date().toISOString(),
    searchQuery,
    returnedNodes: rawNodes.length,
    observedRepositoryCount: observed.size,
    observedRepositoriesSha256: sha256(JSON.stringify([...observed].sort())),
    selectionMethod: "Choose the lexicographically smallest SHA-256(seed + newline + pull-request URL).",
    seed,
    eligibility: {
      publicRepository: true,
      fork: false,
      archived: false,
      disabled: false,
      primaryLanguages: [...allowedLanguages.keys()],
      stars: { minimum: 50, maximum: 50_000 },
      diskUsageKiB: { minimum: 100, maximum: 100_000 },
      changedFiles: { minimum: 2, maximum: 8 },
      changedLinesMaximum: 500,
      linkedClosingIssueRequired: true,
      implementationAndFocusedTestRequired: true
    },
    eligibleCount: candidates.length,
    candidates: candidates.map((entry) => ({
      id: entry.id,
      repository: entry.repository.nameWithOwner,
      pullRequest: entry.pullRequest,
      issue: withoutBody(entry.issue),
      language: entry.language,
      changedFileCount: entry.oracle.exactChangedFiles.length,
      changedLines: entry.changedLines,
      rankHash: entry.rankHash
    }))
  };
  const freeze = {
    schemaVersion: 1,
    protocolVersion,
    status: "frozen-before-palace-observation",
    frozenAt: new Date().toISOString(),
    claimBoundary: "One fresh-repository historical-task static smoke. It cannot establish general routing quality, Token savings, speed, or Agent repair accuracy.",
    outcomeDependentReplacementForbidden: true,
    selectedTargetCount: 1,
    product: {
      sourceCommit: productCommit,
      cliPath: candidateCliPath,
      cliSha256: sha256(candidateCli),
      reportedVersion: (await nodeOutput([candidateCliPath, "--version"])).trim()
    },
    baseline: {
      package: "vertex-palace",
      version: "0.4.0",
      npmShasum: baselineShasum
    },
    artifacts: {
      protocolSha256: sha256(await readFile(path.join(repositoryRoot, "docs", "research", "FRESH_REPOSITORY_V6_PROTOCOL.md"))),
      poolSha256: sha256(JSON.stringify(pool)),
      targetSha256: sha256(JSON.stringify(target)),
      privateOracleCommitment: sha256(canonicalJson(oracle))
    }
  };

  await mkdir(protocolRoot, { recursive: true });
  await mkdir(privateRoot, { recursive: true });
  await Promise.all([
    writeJson(path.join(protocolRoot, "pool.frozen.json"), pool),
    writeJson(path.join(protocolRoot, "target.frozen.json"), target),
    writeJson(path.join(protocolRoot, "freeze.json"), freeze),
    writeJson(path.join(privateRoot, "oracle.json"), oracle)
  ]);
  return {
    protocolVersion,
    eligibleCount: candidates.length,
    observedRepositoryCount: observed.size,
    selected: { id: target.id, repository: target.repository, pullRequest: target.pullRequest.url },
    candidate: freeze.product,
    oracleCommitment: freeze.artifacts.privateOracleCommitment
  };
}

export async function collectObservedRepositories(roots) {
  const observed = new Set();
  for (const root of roots) {
    const files = (await gitOutput(root, ["ls-files", "-z"]))
      .split("\0")
      .filter(Boolean);
    for (const file of files) {
      const absolutePath = path.join(root, file);
      let bytes;
      try {
        bytes = await readFile(absolutePath);
      } catch {
        continue;
      }
      if (bytes.length > 5 * 1024 * 1024 || bytes.includes(0)) continue;
      const text = bytes.toString("utf8");
      const pattern = /(?:https?:\/\/|git\+https?:\/\/|git@)github\.com[\/:]([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)/gi;
      for (const match of text.matchAll(pattern)) {
        observed.add(`${match[1]}/${match[2].replace(/\.git$/i, "")}`.toLowerCase());
      }
    }
  }
  return observed;
}

export function evaluatePullRequest(pull, observed, seed) {
  const repository = pull?.repository;
  const languageName = repository?.primaryLanguage?.name;
  const language = allowedLanguages.get(languageName);
  const files = pull?.files?.nodes || [];
  const issue = pull?.closingIssuesReferences?.nodes?.find((item) => item?.body?.trim().length >= 40);
  const classified = language ? classifyFiles(language, files.map((file) => file.path)) : {
    implementationFiles: [], testFiles: [], auxiliaryFiles: []
  };
  const changedLines = files.reduce((sum, file) => sum + file.additions + file.deletions, 0);
  const reasons = [];
  const identity = repository?.nameWithOwner?.toLowerCase();
  if (!repository || repository.isPrivate || repository.isFork || repository.isArchived || repository.isDisabled) reasons.push("repository-ineligible");
  if (!identity || observed.has(identity)) reasons.push("previously-observed-repository");
  if (!language) reasons.push("unsupported-primary-language");
  if (repository?.stargazerCount < 50 || repository?.stargazerCount > 50_000) reasons.push("stars-out-of-range");
  if (repository?.diskUsage < 100 || repository?.diskUsage > 100_000) reasons.push("size-out-of-range");
  if (!pull?.mergedAt || !pull?.baseRefOid || !pull?.mergeCommit?.oid) reasons.push("missing-frozen-commit");
  if (!issue?.url || !issue?.title) reasons.push("missing-coherent-linked-issue");
  if (files.length < 2 || files.length > 8 || pull?.files?.totalCount !== files.length) reasons.push("changed-file-count-out-of-range");
  if (changedLines > 500) reasons.push("change-too-large");
  if (classified.implementationFiles.length === 0) reasons.push("no-implementation-file");
  if (classified.testFiles.length === 0) reasons.push("no-focused-test-file");
  if (/\[bot\]$|dependabot|renovate/i.test(pull?.author?.login || "")) reasons.push("automation-author");
  if (/^(?:chore|docs?|release|build|ci|deps?)(?:\(.+\))?[!:]/i.test(pull?.title || "")) reasons.push("non-product-title");
  const rankHash = pull?.url ? sha256(`${seed}\n${pull.url}`) : "";
  return {
    eligible: reasons.length === 0,
    reasons,
    id: repository && pull ? `${repository.nameWithOwner.replace("/", "-").toLowerCase()}-${pull.number}` : "invalid",
    repository,
    language,
    baseCommit: pull?.baseRefOid,
    mergeCommit: pull?.mergeCommit?.oid,
    pullRequest: pull ? { number: pull.number, title: pull.title, url: pull.url } : null,
    issue: issue ? { number: issue.number, title: issue.title, url: issue.url, body: normalizeIssueBody(issue.body) } : null,
    changedLines,
    rankHash,
    oracle: { exactChangedFiles: files.map((file) => file.path).sort(), ...classified }
  };
}

async function githubGraphql(searchQuery) {
  const result = await runProcess("gh", [
    "api", "graphql",
    "-f", `query=${pullRequestSearchQuery}`,
    "-F", `searchQuery=${searchQuery}`
  ], { cwd: repositoryRoot, check: true, timeoutMs: 120_000 });
  return JSON.parse(result.stdout);
}

async function fetchPullRequestDiff(repository, number) {
  const result = await runProcess("gh", [
    "api",
    "-H", "Accept: application/vnd.github.v3.diff",
    `/repos/${repository}/pulls/${number}`
  ], { cwd: repositoryRoot, check: true, timeoutMs: 120_000 });
  return result.stdout;
}

async function assertCleanTrackedWorktree(root) {
  assert.equal((await gitOutput(root, ["status", "--short", "--untracked-files=no"])).trim(), "", `Tracked worktree is dirty: ${root}`);
}

async function gitOutput(root, args) {
  return (await runProcess("git", args, { cwd: root, check: true, timeoutMs: 120_000 })).stdout;
}

async function fetchNpmShasum(packageName, version) {
  const response = await fetch(`https://registry.npmjs.org/${encodeURIComponent(packageName)}/${encodeURIComponent(version)}`, {
    signal: AbortSignal.timeout(30_000)
  });
  assert.equal(response.ok, true, `npm registry metadata request failed with HTTP ${response.status}.`);
  const metadata = await response.json();
  assert.match(metadata?.dist?.shasum || "", /^[a-f0-9]{40}$/, "npm registry metadata did not contain a valid dist.shasum.");
  return metadata.dist.shasum;
}

async function nodeOutput(args) {
  return (await runProcess(process.execPath, args, { cwd: repositoryRoot, check: true, timeoutMs: 120_000 })).stdout;
}

function normalizeIssueBody(value) {
  return String(value || "")
    .replace(/<details\b[^>]*>[\s\S]*?<\/details>/gi, " ")
    .replace(/\r\n?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, 12_000);
}

function withoutBody(issue) {
  return { number: issue.number, title: issue.title, url: issue.url };
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

async function exists(file) {
  try {
    await readFile(file);
    return true;
  } catch {
    return false;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const seedIndex = process.argv.indexOf("--seed");
  const result = await prepareFreshRepositoryV6({
    seed: seedIndex >= 0 ? process.argv[seedIndex + 1] : undefined
  });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}
