import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const workspace = path.resolve(requiredWorkspace());
const source = pathToFileURL(path.join(workspace, "src", "format-currency.mjs")).href;
const { formatCents } = await import(`${source}?oracle=${Date.now()}`);

assert.equal(formatCents(-0), "$0.00");
assert.equal(formatCents(0), "$0.00");
assert.equal(formatCents(-1), "-$0.01");
assert.equal(formatCents(1), "$0.01");
assert.equal(formatCents(9007199254740991), "$90071992547409.91");
assert.throws(() => formatCents(1.5), /safe integer/);

function requiredWorkspace() {
  if (!process.argv[2]) throw new Error("workspace argument is required");
  return process.argv[2];
}
