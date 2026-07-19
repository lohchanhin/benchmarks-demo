# Control-First Protocol v3.0.0

Status: **design-review draft; zero agent outcomes; execution prohibited**

This protocol is the independent successor to the completed v2.2 study. It
does not reinterpret or overwrite v2.2. The committed candidate plan is
[`results/control-first-v3/plan.json`](../../results/control-first-v3/plan.json),
where `frozen` remains `false` until every release gate below passes.

[简体中文辅助说明](../zh-CN/PROTOCOL_V3.md)

## Motivation

v2.2 found that Adaptive Palace was structurally useful but did not establish a
general Token or wall-time advantage over normal Codex. Its primary comparison
was Adaptive versus always-on Full Palace, and its useful-memory fixture was
not discriminating: Control also solved every trial. v3 asks the product-facing
question directly:

> After choosing bypass or bounded structured context, does Adaptive Palace
> improve outcomes over normal Codex?

No positive effect is assumed. Equal, slower, more expensive, harmful, and
inconclusive outcomes are all publishable results.

## Frozen Comparison Hierarchy

1. **Primary:** Adaptive Palace versus Control.
2. **Secondary:** Adaptive Palace versus Full Palace.
3. **Mechanism:** Route-only versus Control.
4. **Mechanism:** Full Palace versus Route-only.

Correctness and scope are evaluated before efficiency. The single primary
efficiency metric is paired cumulative `reportedTokens`. Uncached input,
tool calls, wall time, command output, and route precision are secondary.

## Arms

- **Control:** normal Codex exploration; Palace and `.palace` are prohibited.
- **Route-only:** exactly one non-adaptive `palace context` call without memory.
- **Full Palace:** exactly one non-adaptive context call with the seeded history.
- **Adaptive Palace:** exactly one `palace context --auto` call with the same
  seeded history as Full Palace.

Every arm receives the same task, generated fixture bytes, Git tree, model,
reasoning effort, timeout, and public tests. Arms execute sequentially in fresh
ephemeral Codex processes; they never run concurrently.

## Scenarios

| Scenario | Purpose | Expected product boundary |
| --- | --- | --- |
| `small-local-bug` | Negative control for a high-confidence one-file task | Adaptive should bypass |
| `cross-stack-regression` | Client/server contract and indirect dependencies | Bounded structured context |
| `decision-memory-dependent` | Correct tenant ownership exists only in historical project memory | Relevant memory should prevent a scope error |
| `stale-memory-adversarial` | Plausible history conflicts with current architecture | Current code and tests must outrank memory |

The old `tenant-memory-pitfall` fixture is excluded from v3 because every v2.2
Control arm solved it; it did not create a meaningful memory-dependent contrast.

## Memory-Dependent Fixture

The launch-tenant task is deliberately underdetermined from public evidence:

- several tenant-local fixes and a shared-token fix are plausible;
- public tests verify the resolver contract but do not identify the launch
  tenant or enforce its contrast;
- seeded memory identifies Aurora as the independently governed launch tenant
  and warns against editing shared or sibling tokens;
- memory does not provide a replacement color or literal patch;
- the hidden oracle verifies WCAG AA for Aurora and unchanged behavior for the
  shared fallback, Borealis, and Cedar.

Its unmodified baseline must pass public tests and fail the hidden oracle. The
canonical one-file repair must pass both. Eligible memory-benefit evidence is a
named discordant pair where Control fails and Adaptive succeeds, or where
Control violates scope and Adaptive does not. If no such pair appears, v3 will
not claim a memory correctness benefit.

## Protocol Success

An arm succeeds only when all conditions hold:

- treatment validity and exact task fidelity pass;
- Codex exits successfully without timeout;
- public tests and the external hidden oracle pass;
- no forbidden file changes;
- changed-file precision is exactly `1.0`; and
- changed-file recall is exactly `1.0`.

The strict precision/recall requirement is new in v3. A behaviorally correct but
over-broad edit is an outcome, not a success.

## Design And Statistics

The draft contains 4 scenarios x 4 fresh seeds x 4 arms: 16 paired trials and
64 arm runs. Each scenario uses all four Williams orders exactly once, so every
arm occupies every execution position once. Warm and cold local Palace index
states are balanced within scenarios and across Williams orders. Provider-side
model cache state cannot be controlled.

The analysis publishes:

- paired success rates and exact two-sided McNemar tests;
- named baseline-only and treatment-only discordant trial IDs;
- arm scope precision, recall, and forbidden-violation summaries across all
  valid primary pairs;
- paired medians and deterministic paired-bootstrap 95% intervals for
  mutually successful pairs; and
- Holm correction for the four scenario-level primary success tests.

This remains an exploratory pilot with four pairs per scenario. It is not
powered as a confirmatory non-inferiority or superiority study.

## Fixed Candidate Environment

- Model: `gpt-5.6-sol`
- Reasoning: `xhigh`
- Codex: `codex-cli 0.145.0-alpha.18`
- Vertex Palace candidate: `0.3.0`
- Vertex Palace source commit:
  `5cae580a67c3b8d3b6885abb900a69cd285ecbc0`
- Vertex Palace evidence commit:
  `087d5c65a740c91f6ab849088c27c609d1f6e201`
- Platform: `win32`
- Sandbox: `workspace-write/windows-elevated`
- Timeout: 600 seconds per arm
- Cooldown: 15 seconds between arms

The benchmark repository still installs the previously published Palace while
this plan is in design review. That mismatch is intentional and prevents an
accidental formal run.

Engineering evidence at the pinned source commit reports exact two-file routes
for both pinned Zod and Requests tasks (recall 1.000, strict precision 1.000)
and clean-install JSON/Markdown output below the selected ceiling with 50
memory candidates. A fixed eight-file evidence-maintenance oracle improved from
3/8 coverage and 0.30 route focus to 8/8 and 1.00 focus. Product self-checks
still report 3/6 for the implementation change and 1/8 for the following
documentation-only update, so these are release gates and routing research, not
Agent outcomes.

## Release And Freeze Gates

Before changing `frozen` to `true` or creating `protocol-v3.0.0`:

1. Product unit, CLI, MCP, package, and CI checks for Palace 0.3.0 pass.
2. A clean package install reports 0.3.0 and passes the release-candidate gate.
3. The memory-dependent baseline/oracle/canonical-repair gate passes.
4. Adaptive receives the seeded ownership memory in a non-study smoke run.
5. Pinned TypeScript and Python repositories pass deterministic target-
   retrieval validation with recall and strict precision reported separately.
6. The benchmark depends on the published immutable `vertex-palace@0.3.0`.
7. The complete benchmark test and evidence audit pass.
8. The committed public result manifest still contains zero attempted trials.
9. The reviewed plan is frozen and tagged before any formal arm runs.

Publishing the npm package uses an interactive browser/device verification only
after these engineering and research gates succeed.

## Evidence And Privacy

Attempted, failed, invalid, and timed-out trials remain outcomes. Reviewed JSON,
Markdown, and checksums may be published. Raw JSONL transcripts remain local
because they may contain machine paths and session identifiers. No v3 outcome
exists at the time of this draft.
