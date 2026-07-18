import { parseArgs } from "./lib/args.mjs";
import { doctorCommand } from "./commands/doctor.mjs";
import { prepareCommand } from "./commands/prepare.mjs";
import { reportCommand } from "./commands/report.mjs";
import { runCommand } from "./commands/run.mjs";
import { verifyCommand } from "./commands/verify.mjs";

const help = `Vertex Palace A/B Benchmark

Usage:
  vertex-palace-benchmark <command> [options]

Commands:
  doctor   Check Node.js, Git, Codex, and Vertex Palace availability
  prepare  Create identical Control and Palace fixture workspaces
  run      Run Codex in one or both arms and capture JSONL evidence
  verify   Run tests, inspect Git changes, and score correctness/scope
  report   Produce Markdown and JSON comparison reports

Common options:
  --run-dir <path>      Use a prepared run (defaults to the newest run)
  --arm <value>         control, palace, or both
  --model <model>       Codex CLI model id (default: gpt-5.6-sol)
  --codex-bin <path>    Codex CLI executable or command
  --palace-bin <path>   Vertex Palace CLI executable or command

Examples:
  npm run benchmark -- doctor
  npm run benchmark -- prepare --run-id build-week-demo
  npm run benchmark -- run --run-dir .benchmark-runs/build-week-demo --arm both
  npm run benchmark -- report --run-dir .benchmark-runs/build-week-demo
`;

export async function main(argv) {
  const parsed = parseArgs(argv);
  switch (parsed.command) {
    case "doctor":
      return doctorCommand(parsed.flags);
    case "prepare":
      return prepareCommand(parsed.flags);
    case "run":
      return runCommand(parsed.flags);
    case "verify":
      return verifyCommand(parsed.flags);
    case "report":
      return reportCommand(parsed.flags);
    case "help":
    case "--help":
    case "-h":
      console.log(help);
      return;
    default:
      console.log(help);
      throw new Error(`Unknown command: ${parsed.command}`);
  }
}
