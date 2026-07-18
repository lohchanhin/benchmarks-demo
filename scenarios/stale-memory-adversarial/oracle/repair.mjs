import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const target = path.join(path.resolve(requiredWorkspace()), "src", "scheduler", "load-batch-limit.mjs");
const source = await readFile(target, "utf8");
const fixed = source
  .replace(
    'import { legacyLimits } from "../../config/legacy-limits.mjs";',
    'import { runtimeLimits } from "../../config/runtime-limits.mjs";'
  )
  .replace("return legacyLimits.maxBatch;", "return runtimeLimits.maxBatch;");
if (fixed === source) throw new Error("canonical repair pattern was not found");
await writeFile(target, fixed, "utf8");

function requiredWorkspace() {
  if (!process.argv[2]) throw new Error("workspace argument is required");
  return process.argv[2];
}
