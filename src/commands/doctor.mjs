import { stringFlag } from "../lib/args.mjs";
import { runProcess } from "../lib/process.mjs";
import { resolveCodexBin, resolvePalaceInvocation } from "../lib/tooling.mjs";

export async function doctorCommand(flags) {
  const codexBin = await resolveCodexBin(stringFlag(flags, "codex-bin", undefined));
  const palace = await resolvePalaceInvocation(stringFlag(flags, "palace-bin", undefined));
  const checks = [
    ["Node.js", process.execPath, ["--version"], false],
    ["Git", "git", ["--version"], false],
    ["Codex", codexBin, ["--version"], false],
    ["Vertex Palace", palace.command, [...palace.prefix, "--version"], palace.windowsShim]
  ];
  let failed = false;
  for (const [label, command, args, windowsShim] of checks) {
    try {
      const result = await runProcess(command, args, { windowsShim });
      const detail = (result.stdout || result.stderr).trim();
      const passed = result.exitCode === 0;
      failed ||= !passed;
      console.log(`${passed ? "PASS" : "FAIL"} ${label}: ${detail || `exit ${result.exitCode}`}`);
    } catch (error) {
      failed = true;
      console.log(`FAIL ${label}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  if (failed) throw new Error("Environment check failed");
}
