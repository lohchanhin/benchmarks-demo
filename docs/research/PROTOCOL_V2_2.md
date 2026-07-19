# Vertex Palace Adaptive Benchmark Protocol 2.2

Protocol version: 2.2.0

Status: preregistered exploratory successor pilot

Freeze tag: `protocol-v2.2.0`

Freeze date: 2026-07-19

This protocol supersedes the unexecuted remainder of v2.1. One v2.1 trial was
inspected before a Windows sandbox conformance defect was identified: all four
arms hit native `apply_patch` sandbox-preparation failures and used unequal
fallback paths. That trial remains public and unchanged for correctness and
scope observations, but its efficiency values are infrastructure-noisy.

Protocol v2.2 uses fresh trial ids and seeds. Before this protocol was frozen,
a non-study development smoke confirmed that the proposed fixed profile could
run repository-local `vertex-palace@0.2.1`, native `apply_patch`, public tests,
and the hidden oracle with zero router or sandbox-preparation errors. The smoke
is disclosed separately and is not included in any treatment analysis.

## Research Questions

1. Is Adaptive Palace non-inferior to always-on Full Palace for fixture-defined
   task success?
2. Among mutually successful, valid, and infrastructure-conformant pairs, does
   Adaptive Palace reduce the Palace command payload?
3. Do payload reductions carry through to cumulative uncached input tokens,
   total reported tokens, tool calls, or wall time?
4. Does the selected adaptive mode match the preregistered scenario role?
5. Does guarded memory retain useful tenant evidence without adopting stale
   adversarial advice?

Null, slower, more expensive, or less-correct outcomes remain in the dataset.
Fewer routed paths or a smaller Palace payload alone are not evidence of
end-to-end efficiency.

## Scope And Sample

The four preregistered scenarios are unchanged:

1. `small-local-bug`: negative control for routing overhead.
2. `cross-stack-regression`: indirect frontend/backend dependency coverage.
3. `tenant-memory-pitfall`: useful client-scoped historical evidence.
4. `stale-memory-adversarial`: plausible but wrong historical evidence.

Each scenario has four new independently materialized seeds. Every seed runs
four arms from byte-identical tracked Git trees: 4 scenarios x 4 seeds x 4
arms = 64 agent runs. Four pairs per scenario are exploratory and are not
powered to establish non-inferiority.

## Experimental Arms

### Control

- No Palace call and no `.palace` read.
- Ordinary Codex repository exploration.

### Route-only

- Prepared structural index without task history.
- Exactly one legacy `palace context` call.

### Full Palace

- Scenario history is seeded when defined.
- Exactly one legacy `palace context` call.
- Represents the always-on treatment.

### Adaptive Palace

- Receives the same independently seeded history as Full Palace.
- Exactly one `palace context --auto` call.
- May choose `bypass`, `route-lite`, `full-palace`, or
  `guarded-memory-palace`.
- Current code and tests outrank remembered evidence.

Post-task evaluation, memory writes, publication, and index maintenance are
outside timed treatment.

## Task Transport And Fidelity

The frozen task is passed to Palace as a PowerShell single-quoted argument;
embedded single quotes are doubled. Every Palace arm must expose the received
task under `## Task`. Verification exact-compares it with the run manifest.

A mismatch makes that arm invalid even when its code, tests, or hidden oracle
pass. No cross-arm efficiency comparison is eligible unless every arm required
by that comparison is valid.

## Cache And Order Balance

Each scenario has two `warm` and two `cold` local Palace-index trials. Cold
preparation removes only `.palace/indexes/` after creating equivalent Palace
state. Provider-side cache, service load, and network conditions cannot be
held constant.

Each scenario uses all four Williams sequences once:

1. Control, Route-only, Adaptive, Full.
2. Route-only, Full, Control, Adaptive.
3. Full, Adaptive, Route-only, Control.
4. Adaptive, Control, Full, Route-only.

Every sequence occurs twice warm and twice cold across the complete study.
Arms run sequentially in separate workspaces and fresh Codex processes; they
never run concurrently.

## Fixed Execution Conditions

- Model: `gpt-5.6-sol`.
- Reasoning effort: `xhigh`.
- Codex CLI: `codex-cli 0.145.0-alpha.18`.
- Vertex Palace: repository-local `0.2.1` installed by `npm ci`.
- Platform: `win32`.
- Sandbox profile: `workspace-write/windows-elevated`.
- Last-message transport: `workspace-local-then-artifacts-v1`.
- Timeout: 600,000 ms per arm.
- Cooldown: 15,000 ms between arms.
- Public tests and hidden oracle are identical across arms.
- Network access is unnecessary for fixture tasks.

During Codex execution, the temporary last-message file is inside the arm
workspace. The parent harness moves it to ignored artifacts only after Codex
exits. Run plans, execution records, and evidence must all match the frozen
platform, sandbox, and transport values.

Any `failed to prepare fs sandbox`, `failed to prepare windows sandbox`, or
`split writable root sets` diagnostic makes the affected v2.2 arm
infrastructure-invalid. Its raw outcome remains retained. Version, model, or
fixed-environment mismatch is also infrastructure invalidity and requires an
explicit amendment before any rerun.

## Outcomes

The primary comparison is Adaptive Palace versus Full Palace task success.
Success requires a valid treatment, infrastructure conformance, exit before
timeout, passing public tests, passing hidden oracle, the frozen starting Git
tree, and no forbidden change.

Adaptive validity additionally requires `--auto`, one successful Palace call,
a parseable adaptive payload, exact final-output byte accounting, and exact
task fidelity. Route-only and Full are invalid if they use `--auto`; every
Palace arm requires exact task fidelity.

Secondary outcomes are:

- Palace output characters, UTF-8 bytes, and common estimated tokens;
- adaptive mode, route tiers, memory items, and guardrails;
- cumulative, cached, uncached, and output Codex tokens;
- tool calls, failed calls, inspection commands, and command-output size;
- wall time, changed-file precision/recall, and forbidden changes;
- route Recall@K/Precision@K and memory safety signals;
- router, native patch-verification, and sandbox-preparation diagnostics.

Efficiency is reported only for mutually successful valid pairs. Correctness
is never traded for lower Token or time values.

## Analysis And Publication

- Adaptive minus Full is the primary paired view.
- Raw paired outcomes, exact paired success tests, paired differences, and
  seeded bootstrap 95% intervals are reported.
- Scenario p-values use Holm adjustment when inferential tests are eligible.
- Continuous metrics include every raw value, medians, paired medians, and
  missingness; invalid pairs are named, not discarded.
- Warm/cold strata are descriptive unless enough valid pairs exist.
- No unfavorable run or metric may be removed.

Raw JSONL transcripts remain local because they may contain session ids and
absolute paths. Public bundles contain sanitized manifests, all four evidence
files, reports, and SHA-256 coverage for every public file.

The frozen plan is `results/adaptive-pilot-v2.2/plan.json`. The frozen empty
results manifest is `results/adaptive-pilot-v2.2/manifest.json`. Any later code,
protocol, fixture, metric, exclusion, or validity change requires a dated
amendment and a new successor protocol before affected agent execution.
