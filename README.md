# Vertex Palace Agent Benchmark

[![CI](https://github.com/lohchanhin/benchmarks-ab-demo/actions/workflows/ci.yml/badge.svg)](https://github.com/lohchanhin/benchmarks-ab-demo/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

A public, preregistered, reproducible experiment comparing Codex repository
work with no Palace, structural routing only, always-on Full Palace, and
Adaptive Palace.

[Simplified Chinese](README.zh-CN.md) | [中文辅助文档](docs/zh-CN/README.md) | [中文快速验证](docs/zh-CN/QUICKSTART.md) | [中文结果解读](docs/zh-CN/RESULTS_GUIDE.md) | [Control-first v3 draft](docs/research/PROTOCOL_V3.md) | [v2.2 final report](docs/research/ADAPTIVE_V2_2_FINAL.md) | [v1 protocol](docs/research/PROTOCOL.md) | [Adaptive v2.2 protocol](docs/research/PROTOCOL_V2_2.md) | [Amendments](docs/research/PROTOCOL_AMENDMENTS.md) | [Methodology](METHODOLOGY.md) | [Demo guide](DEMO.md)

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

## Adaptive v2.2 Successor Study

The published v1 pilot found no end-to-end efficiency win for always-on Full
Palace. That negative result motivated a new treatment rather than a rewritten
interpretation. Protocol v2 adds `adaptive-palace`, which runs exactly one
`palace context --auto` command and may bypass, use a Primary-only route, load
bounded support context, or add guarded memory.

The first frozen v2.0 attempt exposed a task-transport defect after its outcome
was inspected: PowerShell changed `$0.00` to `.00` in all Palace arms. The raw
attempt is retained as a [public incomparable result](results/adaptive-pilot/small-local-bug-adaptive-pilot-01/comparison.md): Control is individually valid,
the three Palace arms fail exact task fidelity, `comparable` is `false`, and all
efficiency deltas are `null`.

The corrected [v2.1 protocol](docs/research/PROTOCOL_V2_1.md) and
[fresh frozen plan](results/adaptive-pilot-v2.1/plan.json) use Vertex Palace
0.2.1, new trial ids, new seeds, PowerShell-safe task transport, and exact
comparison of Palace's rendered `## Task` against the manifest. The exploratory
design contains 4 scenarios x 4 seeds x 4 arms = 64
fresh sessions. Within every scenario it uses all four Williams sequences, so
each arm appears once in each execution position. Two trials use a warm local
Palace index and two force an index rebuild; assignments rotate across
scenarios so each Williams sequence occurs twice warm and twice cold.
Provider-side model caches cannot be controlled and remain an explicit limitation.

The v2 primary comparison is Adaptive Palace versus Full Palace correctness.
Payload, cumulative Token, tool calls, and wall time are secondary and are
compared only for mutually successful valid pairs. One v2.1 trial was executed
and all four arms were valid and correct. Adaptive versus Full reduced payload
by 868 bytes, calls by 9, and reported tokens by 135,969, but was 4.1 seconds
slower and used 2,392 more uncached input tokens. This is one interim result,
not a general efficiency claim. The [full disclosure](results/adaptive-pilot-v2.1/README.md)
also records a Windows split-writable-root error that added unequal recovery
noise, so the remaining v2.1 plan is retired rather than silently continued.

The [v2.2 protocol](docs/research/PROTOCOL_V2_2.md) and
[fresh frozen plan](results/adaptive-pilot-v2.2/plan.json) repeat the 4 x 4 x 4
design with new ids and seeds. They additionally freeze `win32`,
`workspace-write/windows-elevated`, and a workspace-local last-message file
that the parent harness relocates only after Codex exits. Any sandbox-
preparation diagnostic invalidates the affected arm. Before freezing, an
explicitly non-study pipeline smoke passed repository-local Palace context,
native `apply_patch`, public tests, and the hidden oracle with zero router
errors. The [sanitized diagnostic record](docs/research/HARNESS_DIAGNOSTICS.md)
is public; no v2.2 treatment outcome existed at freeze.

After the tag was pushed, the complete four-trial small-local block finished
with all 16 arms valid, correctly scoped, and passing both public tests and the
hidden oracle; all recorded zero sandbox-preparation errors. Adaptive selected
`route-lite` in all four. The Adaptive-minus-Full paired medians are -19,935
reported tokens, +887 uncached input tokens, -4.5 tool calls, and -7.448
seconds. This first completed block and its
[scenario report](docs/research/SMALL_LOCAL_V2_2_BLOCK.md) are
descriptive only and do not establish a general efficiency advantage.

The complete four-trial cross-stack block then brought the study to 8/16. All
16 arms found both required client/server changes and passed every validity
gate. Adaptive selected `full-palace` in all four. Its paired medians versus
Full are -929 Palace bytes, -2,083 uncached input tokens, -2 tool calls, and
-16.483 seconds, but +25,709.5 reported tokens. Every interval except the
Palace payload reduction includes zero. The
[completed block report](docs/research/CROSS_STACK_V2_2_BLOCK.md) also shows
that Adaptive remained slower and more call-heavy than Control.

The complete useful-memory block brought the study to 12/16. All 16 arms
avoided the forbidden shared-theme edit and passed every gate, so the task did
not expose a correctness benefit from memory. Seeded Full context contained
both Aurora pitfall notices in all four trials, while Adaptive selected
`full-palace` but reported zero memory items and zero guardrails and omitted
both notices every time. The [block report](docs/research/USEFUL_MEMORY_V2_2_BLOCK.md)
and [treatment finding](docs/research/ADAPTIVE_MEMORY_OMISSION.md) retain this as
valid v0.2.1 behavior; v2.2 was not changed mid-study.

The complete stale-memory adversarial block brought the study to 16/16.
Adaptive selected `guarded-memory-palace` four times, delivered both stale v1
records, and added two explicit guardrails that made current code and tests
authoritative. All sixteen arms rejected the stale edit and passed, so
correctness remains tied. Across four pairs, Adaptive-minus-Full paired
medians are -16,381 reported tokens, +458 uncached input tokens, +4 tool
calls, and -6.377 seconds, while the Palace payload is 233 bytes smaller. See
the [block report](docs/research/STALE_MEMORY_V2_2_BLOCK.md) and four sanitized
mechanism records under [`docs/research/evidence/`](docs/research/evidence/).

The completed study has 64/64 valid, successful, correctly scoped arms.
Adaptive versus Full has a pooled median of -898.5 Palace bytes, -16,522.5
reported tokens, -2.5 tool calls, and -6.553 seconds, but only the Palace
payload interval excludes zero. Against Control, Adaptive has central
differences of +30,147 reported tokens, +4.5 tool calls, and +10.919 seconds;
the tool-call interval is entirely positive. The
[final report](docs/research/ADAPTIVE_V2_2_FINAL.md) concludes that routing and
guarded context are useful, while universal Token or speed savings are not
established.

## Control-First v3 Design Review

The next independent protocol now asks the product-facing question directly:
Adaptive Palace versus normal Codex. Its primary efficiency metric is paired
cumulative `reportedTokens`, but correctness and exact changed-file scope are
evaluated first. The old useful-memory fixture is replaced by a deliberately
underdetermined ownership task whose public tests pass at baseline while an
external oracle requires the historically designated Aurora scope.

The [v3 protocol draft](docs/research/PROTOCOL_V3.md), [16-trial candidate
plan](results/control-first-v3/plan.json), and empty [result
manifest](results/control-first-v3/manifest.json) are public. The plan remains
`frozen:false`, has zero Agent outcomes, and cannot execute. It will be frozen
and tagged only after the immutable Palace 0.3.0 package, clean-install checks,
memory smoke, and full benchmark gates pass.

The [preflight record](docs/research/CONTROL_FIRST_V3_PREFLIGHT.md) publishes the
failed and passing memory smokes, the product fix commit, CI evidence, and the
remaining freeze gates without presenting engineering checks as Agent outcomes.
The subsequent [two-run Agent preflight](docs/research/CONTROL_FIRST_V3_AGENT_PREFLIGHT.md)
keeps a 177-byte bypass that was still slower and more Token-heavy than Control,
plus one guarded-memory run where Route-only failed but Control and Adaptive
both succeeded. These are design inputs, not formal v3 outcomes.
The current product gate also records exact Zod and Requests routes at recall
1.000 / strict precision 1.000 and a clean-install 50-memory ceiling test; these
remain engineering evidence until the independent Agent arms are frozen and run.

The reviewed runtime source is pinned to Vertex Palace
`2d167f81d688160649a8768c863b4e5fe188d1a6`; the bilingual evidence record is
pinned to `605b254341d6f3d3ce4993410bd108bda5593182`. Historical route evaluations
progressed from 3/8 to an exact 8/8 fixed oracle, yet a real nine-file update
still reached only 7/9. The final provenance candidate routes the current
nine-file source/evidence sync exactly 9/9 with 1.00 coverage and focus. Its own
broader implementation self-evaluation remains 9/17 by default and 13/17 with
an expanded route; the final documentation closeout remains 3/5. Passing and
negative results are retained together as
[machine evidence](docs/research/evidence/vertex-palace-0.3.0-sync-evaluation.json),
and neither proves lower end-to-end Agent tokens or time.

Validate the frozen plan without running an agent:

```sh
npm ci
npm run benchmark -- study --plan results/adaptive-pilot-v2.2/plan.json
```

After checking out tag `protocol-v2.2.0`, execute or resume the frozen study:

```sh
npm run benchmark -- study --plan results/adaptive-pilot-v2.2/plan.json --execute
npm run analysis:adaptive
```

The retired v2.1 analysis remains reproducible with
`npm run analysis:adaptive:v2.1`; its remaining planned trials must not be run.

## Reproduce The Published v1 Pilot

```sh
git clone https://github.com/lohchanhin/benchmarks-ab-demo.git
cd benchmarks-ab-demo
git checkout pilot-v1-complete
npm ci
npm run benchmark -- doctor
npm run benchmark -- study --plan results/pilot/plan.json --execute
npm run analysis:pilot
```

The study command resumes safely, runs arms sequentially, and records every
attempt. The frozen plan contains 4 scenarios x 5 seeds x 3 arms = 60 fresh
ephemeral Codex sessions. Use `--limit 1` for a one-trial demonstration.

## Correctness-First Evidence

The preregistered four-scenario pilot is complete. All 20 planned trials and 60
fresh arm runs are published. It remains an exploratory, underpowered pilot,
not a confirmatory product-performance claim.

| Dataset | Correctness | Efficiency result | Status |
| --- | --- | --- | --- |
| New four-scenario, three-arm pilot | 60/60 arms passed public tests and the hidden oracle in 20/20 trials | Overall Full vs Control paired median: +67,223.5 reported tokens, +6,127.5 uncached input, +8.5 calls, +29.8s | Complete exploratory pilot; no efficiency win observed |
| Legacy `v0.1.6` three paired runs | 6/6 arms passed, 100/100 scope | Palace lower cumulative tokens in 3/3; faster in 2/3 | Exploratory pilot |
| Legacy `live-05` | Both arms passed | Palace was 105.4s slower and used more reported tokens | Published negative case |

The [complete paired analysis](results/pilot/analysis.md) and
[power-sensitivity analysis](results/pilot/power-analysis.md) support these
bounded interpretations:

- **H1:** all three arms succeeded in every trial, so no correctness loss was
  observed. Five pairs per scenario cannot establish the preregistered
  non-inferiority claim.
- **H2:** not supported in this pilot. Overall Full Palace minus Control was
  +67,223.5 reported tokens (95% bootstrap CI +25,362.5 to +112,437.5),
  +6,127.5 uncached input (CI +2,390 to +10,636.5), +8.5 calls (CI +6 to
  +16), and +29.8 seconds (CI +16.4 to +49.2).
- **H3:** not supported because Control and Route-only also avoided every
  seeded tenant pitfall; the fixture did not make memory necessary.
- **H4:** descriptively supported as a safety mechanism: Full Palace rejected
  stale v1 advice in 5/5 trials, but the sample is too small for a broad claim.
- **H5:** the small-task negative control showed fixed Palace call overhead,
  as anticipated.

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
the [complete analysis](results/pilot/analysis.md). The median paired Full Palace
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
and both secondary contrasts are included in the final ablation analysis.

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

All five preregistered stale-memory results are public as
[trial 01](results/pilot/stale-memory-adversarial-pilot-01/comparison.md) and
[trial 02](results/pilot/stale-memory-adversarial-pilot-02/comparison.md), and
[trial 03](results/pilot/stale-memory-adversarial-pilot-03/comparison.md), and
[trial 04](results/pilot/stale-memory-adversarial-pilot-04/comparison.md), and
[trial 05](results/pilot/stale-memory-adversarial-pilot-05/comparison.md). All
15 arms changed only the v2 scheduler loader and passed the hidden oracle;
Full Palace did not adopt the obsolete v1 memory in any pair. Full Palace
minus Control has paired medians of +71,864 reported tokens (95% bootstrap CI
+5,069 to +179,047), +6,620 uncached input (CI +1,310 to +17,988), +9 calls
(CI +3 to +19), and +35.0 seconds (CI +20.2 to +49.9). This is descriptive
safety evidence for H4 accompanied by a clear efficiency cost.

Vertex Palace does **not** guarantee that every task will be faster or cheaper.
Wall time is secondary because hosted-model latency varies.

## v1 Three Arms And v2 Four Arms

- **Control:** normal Codex exploration; Palace calls and `.palace` reads are prohibited.
- **Route-only:** one `palace context` call with a fresh index and no task memory.
- **Full Palace:** the same route treatment plus seeded decisions, failed
  attempts, and pitfalls.
- **Adaptive Palace (v2):** the same seeded history as Full Palace, but one
  `palace context --auto` call selects the smallest safe mode and reports its
  actual payload.

The v1 ablation distinguishes structural routing from historical memory. The
v2 fourth arm directly tests adaptive selection against always-on Full Palace.
All workspaces use the same task, random fixture seed, tracked files, and Git
tree. Each arm runs in a fresh `codex exec --ephemeral` process with fixed
model, reasoning effort, timeout, and CLI version.

Across all 20 pairs, Route-only minus Control had paired medians of +26,059.5
reported tokens (CI -2,050.5 to +54,179.5), +2,798 uncached input (CI -1,871
to +13,319), +11 calls (CI +5 to +14), and +16.5 seconds (CI -2.5 to +30.5).
Full Palace minus Route-only added +36,610.5 reported tokens (CI -13,234.5 to
+66,251.5), +2,950 uncached input (CI -6,169.5 to +11,489), +0.5 calls (CI -3
to +5.5), and +16.6 seconds (CI -5.2 to +28.9). The full per-scenario raw
values and intervals are in the [three-arm ablation](results/pilot/analysis.md#three-arm-ablation).

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
- a post-pilot [power-sensitivity analysis](results/pilot/power-analysis.md) for
  a separately frozen confirmatory study.

Five pairs per scenario are explicitly labeled exploratory and underpowered.
With no discordant primary outcomes, the pilot cannot supply a data-driven
finite sample-size estimate. A transparent 20% discordance sensitivity anchor
requires approximately 124 pairs per scenario before attrition or multiplicity
adjustments. Post-outcome analysis extensions are disclosed in the
[protocol amendments](docs/research/PROTOCOL_AMENDMENTS.md).
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
  PROTOCOL_V2.md
  PROTOCOL_V2_1.md
  PROTOCOL_AMENDMENTS.md
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
  adaptive-pilot/plan.json
  adaptive-pilot/manifest.json
  adaptive-pilot-v2.1/plan.json
  adaptive-pilot-v2.1/manifest.json
  adaptive-pilot-v2.2/plan.json
  adaptive-pilot-v2.2/manifest.json
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
- `vertex-palace@0.2.1`, installed by `npm ci` for protocols v2.1 and v2.2

```sh
npm run check
npm run benchmark -- study --plan results/adaptive-pilot-v2.2/plan.json
```

The repository is licensed under the [MIT License](LICENSE).
