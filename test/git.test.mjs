import assert from "node:assert/strict";
import test from "node:test";
import { mergeChangedFiles } from "../src/lib/git.mjs";

test("includes untracked paths in changed-file evidence", () => {
  assert.deepEqual(
    mergeChangedFiles(["src/existing.mjs"], ["notes/new.md", "src/existing.mjs"]),
    ["notes/new.md", "src/existing.mjs"]
  );
});
