import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  collectGitEvidence,
  initializeFixtureGit,
  isPalaceInstrumentationPath,
  mergeChangedFiles
} from "../src/lib/git.mjs";

test("includes untracked paths in changed-file evidence", () => {
  assert.deepEqual(
    mergeChangedFiles(["src/existing.mjs"], ["notes/new.md", "src/existing.mjs"]),
    ["notes/new.md", "src/existing.mjs"]
  );
});

test("recognizes only the root Vertex Palace state as instrumentation", () => {
  assert.equal(isPalaceInstrumentationPath(".palace/"), true);
  assert.equal(isPalaceInstrumentationPath(".palace/indexes/nodes.json"), true);
  assert.equal(isPalaceInstrumentationPath("./.palace/routes/latest-route.json"), true);
  assert.equal(isPalaceInstrumentationPath("fixtures/project/.palace/config.json"), false);
  assert.equal(isPalaceInstrumentationPath(".palace-notes.md"), false);
});

test("keeps Palace state auditable while excluding it from changed-file scope", async (context) => {
  const workspace = await mkdtemp(path.join(os.tmpdir(), "benchmark-git-evidence-"));
  context.after(() => rm(workspace, { recursive: true, force: true }));
  await writeFile(path.join(workspace, "tracked.txt"), "baseline\n", "utf8");
  await initializeFixtureGit(workspace);

  await writeFile(path.join(workspace, "tracked.txt"), "changed\n", "utf8");
  await writeFile(path.join(workspace, "notes.md"), "untracked\n", "utf8");
  await mkdir(path.join(workspace, ".palace", "indexes"), { recursive: true });
  await writeFile(path.join(workspace, ".palace", "indexes", "nodes.json"), "{}\n", "utf8");

  const evidence = await collectGitEvidence(workspace);
  assert.deepEqual(evidence.changedFiles, ["notes.md", "tracked.txt"]);
  assert.deepEqual(evidence.untrackedFiles, ["notes.md"]);
  assert.deepEqual(evidence.instrumentationFiles, [".palace/"]);
  assert.deepEqual(evidence.instrumentationUntrackedFiles, [".palace/"]);
  assert.ok(evidence.status.includes("?? .palace/"));
});
