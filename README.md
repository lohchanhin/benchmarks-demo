# Vertex Palace Agent Benchmark

[![CI](https://github.com/lohchanhin/benchmarks-ab-demo/actions/workflows/ci.yml/badge.svg)](https://github.com/lohchanhin/benchmarks-ab-demo/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

A public, preregistered, reproducible experiment comparing Codex repository
work with no Palace, structural routing only, and full Vertex Palace memory.

[Simplified Chinese](README.zh-CN.md) | [Protocol](docs/research/PROTOCOL.md) | [Methodology](METHODOLOGY.md) | [Demo guide](DEMO.md)

## Falsifiable Claims

Vertex Palace is not assumed to win. The frozen pilot tests five claims:

- **H1 correctness:** Full Palace is not materially less successful than Control.
- **H2 efficiency:** among mutually successful pairs, Palace reduces repeated
  context and exploration.
- **H3 useful memory:** prior pitfalls reduce repeated tenant-isolation mistakes.
- **H4 harmful memory:** stale memory does not materially increase wrong edits.
- **H5 negative control:** on a tiny one-file bug, Palace may be pure overhead.

The exact outcomes, -10 percentage-point pilot non-inferiority margin,
exclusions, and statistics were committed before the new trials at tag
[`protocol-v1.0.0`](https://github.com/lohchanhin/benchmarks-ab-demo/tree/protocol-v1.0.0).

## Reproduce The Pilot

```sh
git clone https://github.com/lohchanhin/benchmarks-ab-demo.git
cd benchmarks-ab-demo
npm ci
npm run benchmark -- doctor
npm run benchmark -- study --plan results/pilot/plan.json --execute
npm run analysis:pilot
```

The study command resumes safely, runs arms sequentially, and records every
attempt. The frozen plan contains 4 scenarios x 5 seeds x 3 arms = 60 fresh
ephemeral Codex sessions. Use `--limit 1` for a one-trial demonstration.

## Correctness-First Evidence

The preregistered four-scenario pilot is in progress and is not yet a
statistical result. Fifteen of 20 planned trials are published; no interim value is
being presented as evidence for or against a hypothesis.

| Dataset | Correctness | Efficiency result | Status |
| --- | --- | --- | --- |
| New four-scenario, three-arm pilot | 45/45 arms passed public tests and the hidden oracle in 15/20 trials | Small-task Full vs Control paired median: +29,423 reported tokens, -130 uncached input, +6 calls; cross-stack: +23,648, +10,250, +11; tenant-memory: +173,308, +5,279, +20 | Small-task 5/5; cross-stack 5/5; tenant-memory 5/5; overall 15/20 |
| Legacy `v0.1.6` three paired runs | 6/6 arms passed, 100/100 scope | Palace lower cumulative tokens in 3/3; faster in 2/3 | Exploratory pilot |
| Legacy `live-05` | Both arms passed | Palace was 105.4s slower and used more reported tokens | Published negative case |

The complete legacy values are in
[`v0.1.6-three-pairs.md`](docs/results/v0.1.6-three-pairs.md). The losing Palace
run and its diagnosis remain public in [`live-05.md`](docs/results/live-05.md).
The older result also found **higher median uncached input for Palace by 6,101
tokens**. That counter-result is not hidden.

The five preregistered negative-control trials are available as reviewed
[trial 01](results/pilot/small-local-bug-pilot-01/comparison.md),
[trial 02](results/pilot/small-local-bug-pilot-02/comparison.md),
[trial 03](results/pilot/small-local-bug-pilot-03/comparison.md), and
[trial 04](results/pilot/small-local-bug-pilot-04/comparison.md), and
[trial 05](results/pilot/small-local-bug-pilot-05/comparison.md) evidence, with
an [interim analysis](results/pilot/analysis.md). The median paired Full Palace
result used 29,423 more reported tokens (95% bootstrap CI -2,445 to 113,838)
and six more tool calls (CI 3 to 7), while uncached input differed by -130
(CI -24,212 to 11,814). Wall time ranged from 25.5 seconds faster to 62.0
seconds slower. This completed negative-control block descriptively supports
fixed call overhead on tiny tasks, not a universal performance conclusion.

All five preregistered cross-stack results are public as
[trial 01](results/pilot/cross-stack-regression-pilot-01/comparison.md) and
[trial 02](results/pilot/cross-stack-regression-pilot-02/comparison.md), and
[trial 03](results/pilot/cross-stack-regression-pilot-03/comparison.md), and
[trial 04](results/pilot/cross-stack-regression-pilot-04/comparison.md), and
[trial 05](results/pilot/cross-stack-regression-pilot-05/comparison.md). All 15
arms found the two required changes and passed the hidden oracle; all Palace
routes retrieved the four route ground-truth files (Recall@K 100%, Precision@K
80%). Across five pairs, Full Palace minus Control has a paired median of
+23,648 reported tokens (95% bootstrap CI -43,041 to +85,854), +10,250 uncached
input tokens (CI -5,575 to +21,513), +11 tool calls (CI +7 to +17), and +20.5
seconds (CI -7.5 to +37.5). The separate group medians are 245,300 Control and
240,938 Full for reported tokens, which point in the opposite direction; the
paired difference is the appropriate summary for this paired design.
Transcript-observed path strings fell from 87 to 6
in trial 01 but were
87 versus 86 in trial 02, demonstrating why that inventory-sensitive proxy is
not treated as a file-read audit. This completed five-pair scenario remains an
exploratory pilot, not a general performance conclusion. Route-only raw metrics
remain in every comparison for the final ablation summary.

All five preregistered tenant-memory results are public as
[trial 01](results/pilot/tenant-memory-pitfall-pilot-01/comparison.md) and
[trial 02](results/pilot/tenant-memory-pitfall-pilot-02/comparison.md), and
[trial 03](results/pilot/tenant-memory-pitfall-pilot-03/comparison.md), and
[trial 04](results/pilot/tenant-memory-pitfall-pilot-04/comparison.md), and
[trial 05](results/pilot/tenant-memory-pitfall-pilot-05/comparison.md). All 15
arms passed the hidden oracle with 100% changed-file precision and recall and
no forbidden-file violation. Control never repeated the seeded pitfall, so this
completed block did not observe a memory correctness benefit and does not
support H3. Full Palace minus Control has paired medians of +173,308 reported
tokens (95% bootstrap CI -64,710 to +225,172), +5,279 uncached input tokens
(CI -15,277 to +11,023), +20 calls (CI -1 to +24), and +68.5 seconds
(CI -34.7 to +84.4). This exploratory result suggests the fixture was not
sensitive enough to make prior memory necessary while the Full treatment added
behavioral overhead.

Vertex Palace does **not** guarantee that every task will be faster or cheaper.
Wall time is secondary because hosted-model latency varies.

## Why Three Arms

- **Control:** normal Codex exploration; Palace calls and `.palace` reads are prohibited.
- **Route-only:** one `palace context` call with a fresh index and no task memory.
- **Full Palace:** the same route treatment plus seeded decisions, failed
  attempts, and pitfalls.

This ablation distinguishes structural routing from historical memory. All
three workspaces use the same task, random fixture seed, tracked files, and Git
tree. Each arm runs in a fresh `codex exec --ephemeral` process with fixed
model, reasoning effort, timeout, and CLI version.

## Preregistered Scenarios

| Scenario | What it tests | Expected boundary |
| --- | --- | --- |
| `small-local-bug` | One-file negative-zero fix | Palace may add overhead |
| `cross-stack-regression` | Backend policy plus frontend response contract | Route dependency coverage |
| `tenant-memory-pitfall` | Multi-client shared-style regression | Useful pitfall memory |
| `stale-memory-adversarial` | Plausible v1 memory conflicts with v2 architecture | Resistance to harmful memory |

Each scenario has public tests plus an external oracle that is never copied
into the agent workspace. A canonical repair must fail before the patch and
pass both test layers after the smallest expected change.

## Primary And Secondary Outcomes

The primary outcome is successful completion inside 600 seconds. Success
requires:

- a valid treatment run;
- successful Codex exit without timeout;
- complete public tests passing;
- hidden external oracle passing; and
- no forbidden-file modification.

Secondary evidence includes changed-file precision/recall, route Recall@K and
Precision@K, pitfall repetition, wrong-memory adoption, tool and failed-call
counts, router errors, command-output characters, and cumulative cached,
uncached, input, and output tokens.

Efficiency deltas are withheld unless both paired arms succeed. Transcript path
strings are context proxies, not claims about files whose contents were read.

## Statistical Analysis

The analysis scripts publish every raw paired value and report:

- paired success differences and exact two-sided McNemar tests;
- arm medians and median paired differences;
- seeded paired-bootstrap 95% confidence intervals;
- Holm correction across scenario-level tests; and
- a post-pilot power analysis for a separately frozen confirmatory study.

Five pairs per scenario are explicitly labeled exploratory and underpowered.
See the [hypotheses](docs/research/HYPOTHESES.md),
[data dictionary](docs/research/DATA_DICTIONARY.md), and
[threats to validity](docs/research/THREATS_TO_VALIDITY.md).

## Single-Trial Workflow

```sh
npm run benchmark -- prepare \
  --scenario cross-stack-regression \
  --run-id demo-01 \
  --seed reproducible-demo-seed

npm run benchmark -- run \
  --run-dir .benchmark-runs/demo-01 \
  --arm all \
  --order seeded

npm run benchmark -- report --run-dir .benchmark-runs/demo-01
```

On Windows, pass the real Codex executable when a Store alias cannot launch
from a child process:

```powershell
npm run benchmark -- study --plan results/pilot/plan.json --execute --codex-bin "$env:CODEX_CLI_PATH"
```

## Evidence Layout

```text
docs/research/
  PROTOCOL.md
  HYPOTHESES.md
  DATA_DICTIONARY.md
  THREATS_TO_VALIDITY.md
  PROTOCOL_AMENDMENTS.md
analysis/
  paired-analysis.mjs
  bootstrap-ci.mjs
  power-analysis.mjs
results/
  manifest.json
  pilot/plan.json
  pilot/
  confirmatory/
```

Per-run JSONL transcripts stay in `.benchmark-runs/` because they may contain
local paths and session metadata. Reviewed evidence JSON and reports can be
published, but attempted, failed, invalid, and timed-out trial records must
remain in `results/manifest.json`.

## Requirements And Verification

- Node.js 20 or newer
- Git
- Authenticated `codex-cli 0.145.0-alpha.18` for the frozen pilot
- `vertex-palace@0.1.6`, installed by `npm ci`

```sh
npm run check
npm run benchmark -- study --plan results/pilot/plan.json
```

The repository is licensed under the [MIT License](LICENSE).
