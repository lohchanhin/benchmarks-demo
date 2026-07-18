import { readdir } from "node:fs/promises";
import path from "node:path";
import { pathExists } from "./files.mjs";
import { repositoryRoot } from "./root.mjs";

export async function resolvePalaceInvocation(explicit) {
  if (explicit) return invocationFromValue(explicit);
  const localCli = path.join(repositoryRoot, "node_modules", "vertex-palace", "dist", "palace.cjs");
  if (await pathExists(localCli)) {
    return { command: process.execPath, prefix: [localCli], windowsShim: false, display: localCli };
  }
  return invocationFromValue(process.env.PALACE_BIN || "palace");
}

export async function resolveCodexBin(explicit) {
  if (explicit) return explicit;
  if (process.env.CODEX_CLI_PATH) return process.env.CODEX_CLI_PATH;
  if (process.platform === "win32" && process.env.LOCALAPPDATA) {
    const binRoot = path.join(process.env.LOCALAPPDATA, "OpenAI", "Codex", "bin");
    try {
      const entries = (await readdir(binRoot, { withFileTypes: true }))
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort()
        .reverse();
      for (const entry of entries) {
        const candidate = path.join(binRoot, entry, "codex.exe");
        if (await pathExists(candidate)) return candidate;
      }
    } catch (error) {
      if (!error || error.code !== "ENOENT") throw error;
    }
  }
  return "codex";
}

function invocationFromValue(value) {
  if (/\.(?:c?js|mjs)$/i.test(value)) {
    return { command: process.execPath, prefix: [path.resolve(value)], windowsShim: false, display: value };
  }
  return {
    command: value,
    prefix: [],
    windowsShim: process.platform === "win32",
    display: value
  };
}
