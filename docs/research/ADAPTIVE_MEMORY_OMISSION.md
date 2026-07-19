# Adaptive Memory Omission Observation

Status: observed after all four outcomes of the first v2.2 useful-memory trial
were available and independently repeated in all three remaining trials after
the first finding was committed. This is a treatment finding, not a protocol
validity failure.

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

## Independent Repetition

The second trial used a fresh fixture seed, a cold local index, and Adaptive in
the first sequence position. Fixture preparation again reported history seeded
for both Full and Adaptive.

| Field | Full Palace | Adaptive Palace |
| --- | ---: | ---: |
| Context bytes | 5,465 | 2,450 |
| Context output SHA-256 | `092bd5e2...f0253a` | `b0e3ade5...d0b5e` |
| Shared-theme pitfall present | yes | no |
| Renderer failed-attempt notice present | yes | no |
| Adaptive memory items | n/a | 0 |
| Adaptive guardrails | n/a | 0 |

The complete Full hash is
`092bd5e2ec3ff5f4ef3d5b872be4dc2f7c6abed6a25cc25e691b1f2cf3f0253a`.
The Adaptive hash exactly matched trial 01, confirming identical Adaptive
context output despite a fresh seed and cold rebuild.

The third trial used another fresh seed, a warm index, and Adaptive in the third
sequence position. Full again contained both notices in 5,465 bytes; its output
hash was
`60b110bc9d6ae80a81d7455527e7a8825370567d0ab518e2c02807bd76861c62`.
Adaptive again emitted the identical 2,450-byte output hash
`b0e3ade5eae88dedef50e2bc566e018c68dfc4ad21c09cf5bb650813be8d0b5e`
with zero memory items and guardrails and neither notice.

The fourth trial used another fresh seed, a cold index, and Adaptive in the
fourth sequence position. Full again contained both notices in 5,465 bytes;
its output hash was
`7c2c9746046298c634ca264eaa57ca8f4a262b341b07e9da616f8d4300db30f9`.
Adaptive produced the same hash for the fourth time with zero memory items,
zero guardrails, and neither notice. The omission therefore survived fresh
seeds, both cache states, and every Williams sequence position.

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

Machine-readable evidence is available for
[`trial 01`](./evidence/adaptive-memory-omission-v2.2-trial01.json),
[`trial 02`](./evidence/adaptive-memory-omission-v2.2-trial02.json),
[`trial 03`](./evidence/adaptive-memory-omission-v2.2-trial03.json), and
[`trial 04`](./evidence/adaptive-memory-omission-v2.2-trial04.json).
