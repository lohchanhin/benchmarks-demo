import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const target = path.join(path.resolve(requiredWorkspace()), "src", "format-currency.mjs");
const source = await readFile(target, "utf8");
const fixed = source.replace(
  'const sign = amount < 0 || Object.is(amount, -0) ? "-" : "";',
  'const sign = amount < 0 ? "-" : "";'
);
if (fixed === source) throw new Error("canonical repair pattern was not found");
await writeFile(target, fixed, "utf8");

function requiredWorkspace() {
  if (!process.argv[2]) throw new Error("workspace argument is required");
  return process.argv[2];
}
