# Adaptive Memory Omission Observation

Status: observed after all four outcomes of the first v2.2 useful-memory trial
were available. This is a treatment finding, not a protocol validity failure.

## Context

`tenant-memory-pitfall-adaptive-v2-2-pilot-01` seeded the same Aurora history
into the Full Palace and Adaptive Palace arm repositories before timed
execution. The history contained two project-specific notices:

1. Do not fix an Aurora-only issue by editing the shared theme because that
   previously changed Borealis and Cedar.
2. Changing only Aurora configuration is insufficient when the renderer ignores
   the tenant text-color override.

Control and Route-only intentionally did not receive this history.

## Observed Output

| Field | Full Palace | Adaptive Palace |
| --- | ---: | ---: |
| History seeded during preparation | yes | yes |
| Selected mode | full pack | `full-palace` |
| Context bytes | 5,465 | 2,450 |
| Context estimated tokens | not separately parsed | 613 |
| Adaptive memory items | n/a | 0 |
| Adaptive guardrails | n/a | 0 |
| Shared-theme pitfall present | yes | no |
| Renderer failed-attempt notice present | yes | no |

The Full output SHA-256 was
`f979a5b2ee48c700b333d7d70ba0681155d7665c0b76b2e12994142164f1915f`.
The Adaptive output SHA-256 was
`b0e3ade5eae88dedef50e2bc566e018c68dfc4ad21c09cf5bb650813be8d0b5e`.
These hashes cover the captured UTF-8 Palace command outputs; raw transcripts
remain intentionally unpublished because they contain local paths and session
metadata.

## Outcome

All four arms independently produced the correct two-file repair, avoided
`src/themes/shared-theme.mjs`, and passed public tests plus the hidden oracle.
Therefore the omission did not change correctness in this trial. It does show
that the Adaptive treatment failed to deliver the seeded memory that the
scenario was intended to exercise.

Relative to Full, Adaptive was smaller and used fewer tokens, calls, and wall
time in this one trial. That efficiency difference is partly explained by the
missing memory content and must not be presented as a memory-aware optimization
win.

## Research Handling

- Keep the trial valid because Adaptive faithfully executed the frozen
  `vertex-palace@0.2.1 --auto` treatment and met every preregistered validity
  rule.
- Do not change v2.2 treatment code after observing outcomes.
- Continue the frozen block to measure whether the omission repeats.
- Fix memory selection in a new Vertex Palace release after v2.2, then use a
  fresh protocol, ids, and seeds to test the corrected treatment.
- Do not infer root cause from this observation alone; inspect the selector and
  memory retrieval implementation during the product-fix phase.

Machine-readable evidence is in
[`adaptive-memory-omission-v2.2-trial01.json`](./evidence/adaptive-memory-omission-v2.2-trial01.json).
