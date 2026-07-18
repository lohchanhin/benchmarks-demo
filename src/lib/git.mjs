import { runProcess } from "./process.mjs";

export async function initializeFixtureGit(workspace) {
  await runProcess("git", ["init", "--initial-branch=main"], { cwd: workspace, check: true });
  await runProcess("git", ["add", "--all"], { cwd: workspace, check: true });
  await runProcess(
    "git",
    [
      "-c",
      "user.name=Vertex Palace Benchmark",
      "-c",
      "user.email=benchmark@example.invalid",
      "commit",
      "-m",
      "benchmark baseline"
    ],
    { cwd: workspace, check: true }
  );
  const commit = await runProcess("git", ["rev-parse", "HEAD"], { cwd: workspace, check: true });
  const tree = await runProcess("git", ["rev-parse", "HEAD^{tree}"], { cwd: workspace, check: true });
  return { commit: commit.stdout.trim(), tree: tree.stdout.trim() };
}

export async function collectGitEvidence(workspace) {
  const [status, changed, numstat, check, tree] = await Promise.all([
    runProcess("git", ["status", "--short"], { cwd: workspace, check: true }),
    runProcess("git", ["diff", "--name-only", "HEAD"], { cwd: workspace, check: true }),
    runProcess("git", ["diff", "--numstat", "HEAD"], { cwd: workspace, check: true }),
    runProcess("git", ["diff", "--check", "HEAD"], { cwd: workspace }),
    runProcess("git", ["rev-parse", "HEAD^{tree}"], { cwd: workspace, check: true })
  ]);
  const statusLines = lines(status.stdout);
  const diffFiles = lines(changed.stdout).map(normalize);
  const untrackedFiles = statusLines
    .filter((line) => line.startsWith("?? "))
    .map((line) => normalize(line.slice(3)));
  return {
    status: statusLines,
    changedFiles: mergeChangedFiles(diffFiles, untrackedFiles),
    untrackedFiles,
    numstat: parseNumstat(numstat.stdout),
    diffCheckPassed: check.exitCode === 0,
    diffCheckOutput: `${check.stdout}${check.stderr}`.trim(),
    headTree: tree.stdout.trim()
  };
}

export function mergeChangedFiles(diffFiles, untrackedFiles) {
  return [...new Set([...diffFiles, ...untrackedFiles])].sort();
}

function parseNumstat(value) {
  return lines(value).map((line) => {
    const [added, deleted, ...file] = line.split("\t");
    return {
      file: normalize(file.join("\t")),
      added: added === "-" ? null : Number(added),
      deleted: deleted === "-" ? null : Number(deleted)
    };
  });
}

function lines(value) {
  return value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

function normalize(value) {
  return value.replaceAll("\\", "/");
}
