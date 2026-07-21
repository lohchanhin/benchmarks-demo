import { parseArgs } from "./lib/args.mjs";
import { doctorCommand } from "./commands/doctor.mjs";
import { prepareCommand } from "./commands/prepare.mjs";
import { reportCommand } from "./commands/report.mjs";
import { runCommand } from "./commands/run.mjs";
import { studyCommand } from "./commands/study.mjs";
import { v4GateCommand, v4PlanCommand } from "./commands/v4-protocol.mjs";
import { verifyCommand } from "./commands/verify.mjs";

const help = `Vertex Palace A/B Benchmark

Usage:
  vertex-palace-benchmark <command> [options]

Commands:
  doctor   Check Node.js, Git, Codex, and Vertex Palace availability
  prepare  Create identical Control, Route-only, Full Palace, and Adaptive Palace workspaces
  run      Run fresh Codex sessions in one or all arms and capture evidence
  verify   Run tests, inspect Git changes, and score correctness/scope
  report   Produce Markdown and JSON comparison reports
  study    Validate or execute the frozen multi-scenario pilot plan
  v4-plan  Generate the blinded real-repository v4 candidate plan
  v4-gate  Audit or freeze v4 after an independent human review

Common options:
  --run-dir <path>      Use a prepared run (defaults to the newest run)
  --arm <value>         control, route-only, full-palace, adaptive-palace, all, palace, adaptive, or both
  --order <value>       seeded or a comma-separated arm order
  --cooldown-ms <ms>    Sequential pause between arms (default: 15000)
  --timeout-ms <ms>     Maximum time for each agent arm (default: 600000)
  --model <model>       Codex CLI model id (default: gpt-5.6-sol)
  --reasoning-effort    low, medium, high, or xhigh (default: xhigh)
  --resume              Skip arms that already have execution evidence
  --codex-bin <path>    Codex CLI executable or command
  --palace-bin <path>   Vertex Palace CLI executable or command

Control-first v3 environment:
  VERTEX_PALACE_BENCHMARK_VARIANT_KEY
                         32-byte hexadecimal blinding key; required only after
                         its commitment is preregistered in the frozen plan

Examples:
  npm run benchmark -- doctor
  npm run benchmark -- study --plan results/pilot/plan.json
  npm run benchmark -- v4-plan --write
  npm run benchmark -- v4-gate
  npm run benchmark -- study --plan results/pilot/plan.json --execute
  npm run benchmark -- prepare --scenario cross-stack-regression --run-id demo --seed demo-01
  npm run benchmark -- run --run-dir .benchmark-runs/demo --arm all --order seeded
  npm run benchmark -- report --run-dir .benchmark-runs/build-week-demo
`;

export async function main(argv) {
  const parsed = parseArgs(argv);
  if (parsed.flags.has("help")) {
    console.log(help);
    return;
  }
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
    case "study":
      return studyCommand(parsed.flags);
    case "v4-plan":
      return v4PlanCommand(parsed.flags);
    case "v4-gate":
      return v4GateCommand(parsed.flags);
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
