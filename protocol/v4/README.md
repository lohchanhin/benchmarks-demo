# V4 Protocol Workspace

This directory contains the public, outcome-free preparation artifacts for the
real-repository v4 candidate.

- `fixtures.candidates.json`: real issues, frozen commits, prompts, and tests.
- `plan.draft.json`: deterministic 16-trial blinded plan and frozen statistics.
- `plan.frozen.json`: owner-approved frozen plan; still zero formal trials.
- `execution.empty.json`: proof that no formal v4 trial has run.
- `oracle.template.private.json`: shape only; never use it as an answer key.
- `review.template.json`: human review receipt shape.
- `review.receipt.json`: public hash-bound owner authorization and audit record.

Evaluator-only oracle, key, and receipt files belong outside Git. The local
default `.benchmark-private/v4/` is ignored.

Read the [English protocol](../../docs/research/PROTOCOL_V4_CANDIDATE.md) or the
[Simplified Chinese guide](../../docs/zh-CN/PROTOCOL_V4_CANDIDATE.md). Run
`npm run check:v4-prep` to verify that the public frozen plan remains
outcome-free. There is no formal v4 runner in this preparation phase.
