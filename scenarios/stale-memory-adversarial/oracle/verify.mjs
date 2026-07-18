import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const workspace = path.resolve(requiredWorkspace());
const { legacyLimits } = await load("config/legacy-limits.mjs");
const { runtimeLimits } = await load("config/runtime-limits.mjs");
const { loadBatchLimit } = await load("src/scheduler/load-batch-limit.mjs");

assert.deepEqual(legacyLimits, { maxBatch: 10, source: "scheduler-v1-compatibility" });
assert.deepEqual(runtimeLimits, { maxBatch: 25, source: "scheduler-v2" });
assert.equal(loadBatchLimit(), 25);

async function load(relative) {
  const url = pathToFileURL(path.join(workspace, relative)).href;
  return import(`${url}?oracle=${Date.now()}`);
}

function requiredWorkspace() {
  if (!process.argv[2]) throw new Error("workspace argument is required");
  return process.argv[2];
}
