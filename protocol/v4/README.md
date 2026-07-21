# V4 Protocol Workspace

This directory contains the public, outcome-free preparation artifacts for the
real-repository v4 candidate. Formal execution later completed under this
unchanged frozen identity; results live outside this directory.

- `fixtures.candidates.json`: real issues, frozen commits, prompts, and tests.
- `plan.draft.json`: deterministic 16-trial blinded plan and frozen statistics.
- `plan.frozen.json`: owner-approved frozen plan; still zero formal trials.
- `execution.empty.json`: proof that no formal v4 trial has run.
- `oracle.template.private.json`: shape only; never use it as an answer key.
- `review.template.json`: human review receipt shape.
- `review.receipt.json`: public hash-bound owner authorization and audit record.
- `execution.profile.json`: exact runtimes, dependency setup, and verification baselines.
- `execution.binding.frozen.json`: reviewed runner, product, Agent, evaluator, and result binding.
- `execution.gate.json`: ten-check execution-freeze audit.
- `../../results/real-repository-v4/incidents/`: outcome-free execution incidents retained before correction.

Evaluator-only oracle, key, and receipt files belong outside Git. The local
default `.benchmark-private/v4/` is ignored.

Read the [English protocol](../../docs/research/PROTOCOL_V4_CANDIDATE.md) or the
[execution freeze](../../docs/research/REAL_REPOSITORY_V4_EXECUTION_FREEZE.md),
the [completed final report](../../docs/research/REAL_REPOSITORY_V4_FINAL.md),
or the [Simplified Chinese final report](../../docs/zh-CN/REAL_REPOSITORY_V4_FINAL.md). Run
`npm run check:v4-prep` to verify that the public frozen plan remains
outcome-free. The formal runner is implemented, but the frozen binding records
zero formal Agent arms because it describes the pre-outcome state. The separate
result manifest records 32/32 completed arms and does not establish a product
benefit; the final report records a negative result for this sample.
