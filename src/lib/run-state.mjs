import { readdir } from "node:fs/promises";
import path from "node:path";
import { stringFlag } from "./args.mjs";
import { readJson } from "./files.mjs";
import { repositoryRoot } from "./root.mjs";
import { loadScenario } from "./scenario.mjs";

export const LEGACY_ARMS = Object.freeze(["control", "route-only", "full-palace"]);
export const ADAPTIVE_ARMS = Object.freeze(["control", "route-only", "full-palace", "adaptive-palace"]);

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

export function armsFor(value, availableArms = LEGACY_ARMS) {
  const available = [...availableArms];
  if (value === "all") return available;
  if (value === "both") return ["control", "full-palace"];
  if (value === "palace") return ["full-palace"];
  if (value === "adaptive") return requireAvailable(["adaptive-palace"], available);
  if (available.includes(value)) return [value];
  throw new Error("--arm must be control, route-only, full-palace, adaptive-palace, all, palace, adaptive, or both");
}

function pathKey(arm, suffix) {
  if (arm === "route-only") return `routeOnly${suffix}`;
  if (arm === "full-palace") return `fullPalace${suffix}`;
  if (arm === "adaptive-palace") return `adaptivePalace${suffix}`;
  return `${arm}${suffix}`;
}

function requireAvailable(arms, available) {
  for (const arm of arms) {
    if (!available.includes(arm)) throw new Error(`Prepared run does not include ${arm}`);
  }
  return arms;
}
