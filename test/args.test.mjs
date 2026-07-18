import assert from "node:assert/strict";
import test from "node:test";
import { booleanFlag, enumFlag, parseArgs, stringFlag } from "../src/lib/args.mjs";

test("parses commands, values, equals syntax, and boolean flags", () => {
  const parsed = parseArgs(["run", "--arm", "both", "--model=gpt-5.6", "--quiet"]);
  assert.equal(parsed.command, "run");
  assert.equal(enumFlag(parsed.flags, "arm", ["control", "palace", "both"]), "both");
  assert.equal(stringFlag(parsed.flags, "model"), "gpt-5.6");
  assert.equal(booleanFlag(parsed.flags, "quiet"), true);
});
test("rejects invalid enum values", () => {
  const parsed = parseArgs(["run", "--arm", "maybe"]);
  assert.throws(() => enumFlag(parsed.flags, "arm", ["control", "palace"]), /must be one of/);
});
