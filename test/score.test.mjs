import assert from "node:assert/strict";
import test from "node:test";
import { scoreArm } from "../src/lib/score.mjs";

const expected = ["clients/aurora/theme.mjs", "src/rendering/article-page.mjs"];
const forbidden = ["src/themes/shared-theme.mjs", "test/article-page.test.mjs"];

test("awards full points only to a passing scoped repair", () => {
  const score = scoreArm({
    testsPassed: true,
    expectedFiles: expected,
    changedFiles: expected,
    forbiddenFiles: forbidden,
    diffCheckPassed: true
  });
  assert.equal(score.total, 100);
  assert.equal(score.expectedCoverage, 1);
  assert.deepEqual(score.forbiddenChanged, []);
});
test("does not reward a shared-theme shortcut", () => {
  const score = scoreArm({
    testsPassed: false,
    expectedFiles: expected,
    changedFiles: ["src/themes/shared-theme.mjs"],
    forbiddenFiles: forbidden,
    diffCheckPassed: true
  });
  assert.equal(score.total, 0);
  assert.deepEqual(score.forbiddenChanged, ["src/themes/shared-theme.mjs"]);
});
