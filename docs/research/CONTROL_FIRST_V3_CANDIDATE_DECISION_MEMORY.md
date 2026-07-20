# Candidate Validation: Decision-Memory Block

Status: **decision-memory 4/4 trials complete; 16/16 arms valid, 12/16
successful**.

Overall candidate progress after this block is 12/16 trials, 48 arms, 47 valid,
and 42 successful. The only invalid arm remains the previously disclosed
small-local network-startup incident.

## What this block tests

The public repository intentionally contains several locally reasonable tenant
fixes. A private, preregistered assignment identifies which independently
governed tenant owns the change in each trial, and the hidden Oracle checks that
exact scope. Route-only receives repository structure but no historical
decision. Full and Adaptive receive the relevant Palace memory.

This design asks whether memory can prevent a plausible wrong-scope change,
rather than merely helping an Agent find code it could already discover.

## Integrity and infrastructure

- All four preregistered IDs, cache states, seeds, and Williams orders were used.
- The private assignment key stayed outside Git and still matches the public
  commitment. It is not revealed in this interim report.
- The system-awake guard remained active for the block and exited cleanly.
- All 96 public evidence files now pass checksum and privacy audit.
- Arms ran sequentially; no concurrent execution affected the comparison.

## Correctness result

| Arm | Valid | Hidden-Oracle success | Exact expected-file scope |
| --- | ---: | ---: | ---: |
| Control | 4/4 | 3/4 | 3/4 |
| Route-only | 4/4 | 1/4 | 1/4 |
| Full Palace | 4/4 | 4/4 | 4/4 |
| Adaptive Palace | 4/4 | 4/4 | 4/4 |

The primary Adaptive-versus-Control comparison produced one discordant pair in
the intended direction: Control changed a plausible but wrong tenant while
Adaptive selected the hidden-Oracle tenant. There were no pairs where Control
succeeded and Adaptive failed. The exact paired McNemar p-value is `1.0`, so
four trials do **not** establish statistical significance.

Route-only retrieved the complete relevant code set but succeeded only once.
Full beat Route-only in three discordant pairs (exact p=`0.25`). This is useful
diagnostic evidence that structural routing alone did not supply the missing
historical decision.

## Routing and memory fidelity

All 12 Palace arms achieved route Recall@K and Precision@K of `1.0`. Adaptive
selected `guarded-memory-palace` in all four trials. Each Adaptive payload
reported:

- 2 memory candidates;
- 2 memory items included;
- 0 memory items excluded;
- no wrong-memory adoption or pitfall violation.

Adaptive therefore met the candidate's memory-fidelity requirement in this
block. Its payload was about 6.34 KB (1,585-1,595 estimated tokens), compared
with about 4.57 KB (1,142-1,146 estimated tokens) for legacy Full Palace. The
extra adaptive guardrails and telemetry improved auditability but did not make
the payload smaller.

## Paired efficiency results

Efficiency summaries use only mutually successful pairs, so they describe
cost after correctness rather than assigning a cheap score to a wrong answer.

| Comparison | Reported-token paired median | Tool-call paired median | Wall-time paired median |
| --- | ---: | ---: | ---: |
| Adaptive - Control | +22,438 (95% bootstrap CI -97,887 to +43,196) | +2 (CI 0 to +6) | -44.212 s (CI -77.729 to +14.799) |
| Adaptive - Full | +30,432 (CI -25,931 to +40,911) | -0.5 (CI -11 to +5) | -1.026 s (CI -16.064 to +24.272) |

The intervals are wide and cross zero. This block supports a correctness and
scope-safety mechanism, not a token-saving claim.

## Interim decision

This is the first candidate block to show the product behavior the memory
feature is meant to provide: relevant history changed an otherwise plausible
wrong decision into the correct scoped change. The evidence is encouraging but
still exploratory because `n=4` and only one Adaptive-versus-Control discordant
pair occurred. Product code remains frozen until the final stale-memory block
tests whether the same mechanism can reject obsolete advice safely.
