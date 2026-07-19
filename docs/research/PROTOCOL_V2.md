# Vertex Palace Adaptive Benchmark Protocol

Protocol version: 2.0.0

Status: preregistered exploratory adaptive pilot

Freeze tag: `protocol-v2.0.0`

Freeze date: 2026-07-19

This protocol was designed after the published v1 pilot showed that always-on
Full Palace reduced repository path exposure but did not reduce end-to-end
tokens or wall time. Those unfavorable results remain unchanged. Protocol v2
tests a new treatment and does not reinterpret v1 as confirmatory evidence.

## Research Questions

1. Is Adaptive Palace non-inferior to always-on Full Palace for protocol-defined
   task success in these fixtures?
2. Among mutually successful pairs, does Adaptive Palace reduce the context
   payload produced by the Palace command?
3. Do any payload reductions carry through to cumulative Codex tokens, tool
   calls, or wall time?
4. Does guarded memory preserve tenant-pitfall benefit without increasing
   wrong-memory adoption in the adversarial scenario?

The pilot is designed to falsify these claims. Null, slower, more expensive,
or less-correct Adaptive outcomes remain in the dataset.

## Scope And Sample

The four preregistered scenarios remain:

1. `small-local-bug`: negative control for setup and routing overhead.
2. `cross-stack-regression`: indirect frontend/backend dependency coverage.
3. `tenant-memory-pitfall`: useful client-scoped historical evidence.
4. `stale-memory-adversarial`: plausible but wrong historical evidence.

Each scenario has four independently materialized fixture seeds. Every seed is
run in four arms from byte-identical tracked Git trees. The exploratory pilot
therefore contains 4 scenarios x 4 seeds x 4 arms = 64 agent runs.

Four pairs per scenario are not powered to establish non-inferiority. Results
must be reported as raw outcomes and exploratory paired estimates. A later
confirmatory sample size must use external sensitivity assumptions and be
frozen before new confirmatory data are collected.

## Experimental Arms

### Control

- Vertex Palace calls and `.palace` reads are prohibited.
- Codex uses its ordinary repository exploration strategy.

### Route-only

- A Palace index is prepared with no task history.
- Codex begins with exactly one legacy `palace context` command.
- This arm retains the v1 structural-routing mechanism comparison.

### Full Palace

- Scenario-specific history is seeded when the scenario defines history.
- Codex begins with exactly one legacy `palace context` command.
- This represents the always-on Full Palace behavior evaluated in v1.

### Adaptive Palace

- The same scenario history as Full Palace is seeded independently.
- Codex begins with exactly one `palace context --auto` command.
- The command may choose `bypass`, `route-lite`, `full-palace`, or
  `guarded-memory-palace`.
- Current code and tests outrank guarded memory.

Post-task evaluation, memory writes, and index maintenance are outside the
timed treatment for all arms.

## Cache-State Strata

Each scenario has two `warm` and two `cold` Palace-index trials.

- `warm`: the Palace index exists before timed execution.
- `cold`: preparation first creates equivalent Palace state and history, then
  removes only `.palace/indexes/`. The timed context command must rebuild it.
- Full and Adaptive receive the same cache state within a trial.
- Control has no Palace index treatment but retains the shared stratum label.
- Cache assignments rotate across scenarios so every Williams sequence occurs
  exactly twice with a warm index and twice with a cold index in the full pilot.

This controls only the local Palace index. Provider-side model caches, service
load, network conditions, and hardware scheduling cannot be cleared or held
constant. Arms run sequentially and their order is balanced; wall time remains
a secondary outcome.

## Order Balance

Each scenario uses all four sequences of an even-order Williams design once:

1. Control, Route-only, Adaptive, Full.
2. Route-only, Full, Control, Adaptive.
3. Full, Adaptive, Route-only, Control.
4. Adaptive, Control, Full, Route-only.

Every arm appears once in every sequence position within each scenario. Arms
never run concurrently. Every arm starts a fresh ephemeral Codex process in a
separate workspace.

## Fixed Execution Conditions

- Model identifier: `gpt-5.6-sol`.
- Reasoning effort: `xhigh`.
- Codex CLI: `codex-cli 0.145.0-alpha.18`.
- Vertex Palace: `0.2.0`.
- Maximum agent execution time: 600,000 ms per arm.
- Cooldown: 15,000 ms between sequential arms.
- Public tests and hidden oracle are identical across arms.
- Network access is not required by fixture tasks.

Version or model mismatch is an infrastructure invalidity. The attempt remains
recorded and may be rerun with the same seed only after documenting the cause.

## Outcomes

### Primary Outcome

The primary comparison is Adaptive Palace versus Full Palace success within
the fixed time budget. Success requires:

- successful Codex exit before timeout;
- all public tests pass;
- the hidden external oracle passes;
- no forbidden file changes;
- the tracked starting tree matches the manifest;
- exactly one treatment-appropriate Palace call, or zero for Control.

Adaptive treatment validity additionally requires `--auto` and a parseable
Adaptive payload whose reported `contextBytes` exactly matches the captured
UTF-8 stdout bytes. Full and Route-only are invalid if they use `--auto`.

### Secondary Outcomes

- Palace command output characters, UTF-8 bytes, and estimated payload tokens.
- Adaptive self-reported mode, bytes, route tiers, memory items, and guardrails.
- Cumulative, cached, uncached, and output Codex tokens.
- Tool calls, failed calls, inspection commands, and command output characters.
- Wall-clock duration.
- Changed-file precision, recall, and forbidden-file violations.
- Route Recall@K and Precision@K.
- Tenant-pitfall violation and wrong-memory adoption.

Efficiency differences are reported only for mutually successful valid pairs.
Correctness failures are never traded for lower Token or time values.

## Analysis

- The v2 primary paired success comparison is Adaptive minus Full Palace.
- Raw paired outcomes, exact two-sided McNemar/binomial results, paired mean
  difference, and bootstrap 95% confidence intervals are reported.
- Scenario-level primary p-values use Holm step-down adjustment.
- Continuous outcomes report all raw values, arm medians, paired median
  differences, and seeded paired-bootstrap 95% intervals.
- Control, Route-only, and Full comparisons remain secondary mechanism views.
- Warm and cold strata are shown separately when enough valid pairs exist; no
  cache interaction claim is made from fewer than two valid pairs per stratum.
- No unfavorable run or metric may be removed.

## Evidence And Publication

Raw JSONL transcripts stay local because they can contain local paths and
session metadata. Public evidence includes hashes, fixed settings, order,
cache state, treatment validity, Token counters, payload metrics, Git scope,
public-test result, hidden-oracle result, route metrics, and memory signals.

The frozen plan is `results/adaptive-pilot/plan.json`. Code or protocol changes
after the freeze require an amendment and apply only to later trial IDs. The
competition summary must distinguish preregistered v2 results from the earlier
v1 pilot and must not claim that Adaptive Palace is guaranteed to save Token or
time on every task.
