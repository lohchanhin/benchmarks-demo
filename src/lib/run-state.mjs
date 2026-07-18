import { readdir } from "node:fs/promises";
import path from "node:path";
import { stringFlag } from "./args.mjs";
import { readJson } from "./files.mjs";
import { repositoryRoot } from "./root.mjs";
import { loadScenario } from "./scenario.mjs";

export async function resolveRunDirectory(flags) {
  const explicit = stringFlag(flags, "run-dir", undefined);
  if (explicit) return path.resolve(explicit);

  const runsRoot = path.resolve(stringFlag(flags, "runs-root", path.join(repositoryRoot, ".benchmark-runs")));
  let entries;
  try {
    entries = await readdir(runsRoot, { withFileTypes: true });
  } catch (error) {
    if (error && error.code === "ENOENT") throw new Error("No benchmark runs found. Run prepare first.");
    throw error;
  }
  const latest = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort().at(-1);
  if (!latest) throw new Error("No benchmark runs found. Run prepare first.");
  return path.join(runsRoot, latest);
}
export async function loadRun(runDirectory) {
  const manifest = await readJson(path.join(runDirectory, "manifest.json"));
  const scenario = await loadScenario(manifest.scenario);
  return {
    runDirectory,
    manifest,
    scenario,
    workspace(arm) {
      return path.resolve(runDirectory, manifest.paths[pathKey(arm, "Workspace")]);
    },
    prompt(arm) {
      return path.resolve(runDirectory, manifest.paths[pathKey(arm, "Prompt")]);
    }
  };
}

export function armsFor(value) {
  if (value === "all") return ["control", "route-only", "full-palace"];
  if (value === "both") return ["control", "full-palace"];
  if (value === "palace") return ["full-palace"];
  if (["control", "route-only", "full-palace"].includes(value)) return [value];
  throw new Error("--arm must be control, route-only, full-palace, all, palace, or both");
}

function pathKey(arm, suffix) {
  if (arm === "route-only") return `routeOnly${suffix}`;
  if (arm === "full-palace") return `fullPalace${suffix}`;
  return `${arm}${suffix}`;
}
