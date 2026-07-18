# Vertex Palace Agent Benchmark Protocol

Protocol version: 1.0.0

Status: preregistered exploratory pilot

Freeze tag: `protocol-v1.0.0`

Freeze date: 2026-07-19

This document defines the experiment before the four-scenario pilot is run.
Results produced under this protocol must not be used to silently change its
outcomes, exclusions, or analysis. Any later change belongs in
`PROTOCOL_AMENDMENTS.md` and applies only to runs created after that amendment.

## Research Question

For fresh Codex sessions solving the same repository task from the same Git
tree, how do task routing and project memory affect correctness, exploration,
context use, and repeated mistakes?

The benchmark is designed to falsify Vertex Palace claims, not to guarantee a
win. A null result, a slower Palace run, or a harmful-memory result is a valid
outcome and must remain in the published dataset.

## Pilot Scope

The first public pilot contains four scenarios and five independent fixture
seeds per scenario:

1. `small-local-bug`: negative control for Palace setup cost.
2. `cross-stack-regression`: indirect frontend/backend dependency coverage.
3. `tenant-memory-pitfall`: repeated tenant-isolation mistake.
4. `stale-memory-adversarial`: resistance to plausible but wrong memory.

Each seed is materialized once per arm from the same scenario template. The
three arms therefore start from byte-identical tracked Git trees.

The pilot contains 4 scenarios x 5 seeds x 3 arms = 60 agent runs. The primary
competition comparison is Control versus Full Palace: 4 x 5 paired trials x 2
arms = 40 runs. The 20 Route-only runs are a mechanism analysis that separates
structural routing from historical memory. All analyses are exploratory until
a power analysis determines the confirmatory sample size.

## Experimental Arms

### Control

- Vertex Palace calls and `.palace` reads are prohibited.
- Codex chooses its normal repository exploration strategy.

### Route-only

- A fresh Palace index is available.
- No historical task memory or pitfall is seeded.
- Codex must begin with exactly one `palace context` call.

### Full Palace

- The same routing treatment as Route-only is used.
- Scenario-specific decisions, failed attempts, and pitfalls are seeded before
  the timed run.
- For the adversarial scenario, the seeded memory is intentionally plausible
  but wrong and is labeled with its historical scope and age.

Post-task `palace evaluate`, memory writes, and index maintenance are outside
the timed treatment. They may be recorded separately but cannot be included in
the arm latency or token comparison.

## Fixed Execution Conditions

- Model identifier: `gpt-5.6-sol`.
- Reasoning effort: `xhigh`.
- Codex CLI version: recorded in every run plan and held constant within a
  released dataset.
- Vertex Palace version: `0.1.6` for this pilot.
- Maximum agent execution time: 600,000 ms per arm.
- Cooldown: 15,000 ms between sequential arms.
- Execution: fresh `codex exec --ephemeral` process for every arm.
- Network: not required by fixture tasks or correctness tests.
- Tests: identical public command plus an external oracle hidden from the
  agent workspace.

If the configured model or CLI is unavailable, the run is an infrastructure
failure. It is retained in the manifest and rerun with the same seed only after
the cause is documented. The original attempt is never deleted.

## Randomization And Pairing

- `prepare` accepts a recorded seed. If omitted, it generates a random seed.
- A seed deterministically changes irrelevant fixture names and values while
  preserving the task and oracle.
- All three arms for a trial use the same seed and Git tree.
- Arm order is selected from the six permutations of the three arms using the
  seed. Across five trials, the runner should use five different permutations;
  the omitted permutation is reported.
- Arms run sequentially, never concurrently.
- Each arm uses a new workspace and ephemeral Codex session.

## Blinding And Ground Truth

The task prompt and public tests are visible to Codex. The external oracle,
expected changed-file set, forbidden-file set, route ground truth, and scoring
logic remain in the benchmark repository and are not copied into arm
workspaces. The scorer reads only committed arm evidence and the preregistered
scenario contract.

Human judgment is not used to decide whether a run succeeded. A successful
run must finish inside the fixed time budget, pass the external oracle, pass
the complete public suite, preserve forbidden files, and satisfy arm-validity
checks.

## Outcomes

### Primary Outcome

The primary outcome is the paired difference in successful completion within
the fixed time budget between Full Palace and Control.

Success is binary and requires all of the following:

- Codex exits successfully before timeout.
- Public tests pass.
- The hidden external oracle passes.
- No forbidden file changes.
- The arm follows its treatment protocol.

### Secondary Outcomes

- Changed-file precision, recall, and forbidden-file violation rate.
- Cumulative input, cached input, uncached input, and output tokens.
- Tool calls, failed calls, router errors, inspection commands, and command
  output characters.
- Ground-truth route Recall@K and Precision@K for Route-only and Full Palace.
- Repeated pitfall rate in the tenant-memory scenario.
- Wrong-memory adoption rate in the adversarial scenario.
- Wall-clock duration, reported as secondary because online service latency is
  unstable.

No efficiency delta is treated as beneficial when either paired arm fails the
primary correctness outcome.

## Hypothesis Tests And Estimation

- H1 uses paired success outcomes. The pilot reports the raw discordant-pair
  table, exact two-sided McNemar/binomial p-value, paired success difference,
  and bootstrap 95% confidence interval. The planned non-inferiority margin is
  -10 percentage points; the five-pair pilot is not powered to establish it.
- Continuous paired outcomes report every raw value, each arm median, median
  paired difference, and a seeded paired-bootstrap 95% confidence interval.
- Route-only comparisons are secondary mechanism analyses.
- Scenario-level p-values are adjusted with Holm's step-down procedure.
- No run or metric is removed because it is unfavorable.
- Missing transcript metrics remain missing; they are not converted to zero.

After five pilot seeds per scenario, `analysis/power-analysis.mjs` estimates a
confirmatory sample size from observed discordance and paired variability. The
confirmatory protocol must be frozen in a new tag before confirmatory runs.

## Invalid, Failed, And Timed-Out Runs

An arm is invalid only for a preregistered reason:

- wrong model, reasoning effort, CLI version, fixture tree, or treatment mode;
- benchmark process failure before the agent starts;
- missing or corrupt transcript/evidence caused by harness failure.

Agent errors, test failures, timeouts, excessive exploration, incorrect edits,
and harmful memory adoption are outcomes, not exclusions. They count as
failures and remain in the dataset.

## Evidence And Publication

Raw JSONL transcripts stay local because they may contain machine paths and
session metadata. Each published arm must include a reviewed evidence JSON
containing hashes, execution settings, token counters, tool metrics, Git diff
summary, public-test result, hidden-oracle result, route metrics, and memory
signals. `results/manifest.json` lists every attempted trial and its public or
local evidence status.

The competition README must lead with the hypotheses, one reproduction
command, correctness-first results, successful and failed examples, and links
to this protocol, raw reviewed evidence, and analysis code. It must state that
Vertex Palace is not guaranteed to make every task faster.
