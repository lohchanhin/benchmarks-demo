# Candidate Validation: Cross-Stack Block

Status: **cross-stack 4/4 trials complete; 16/16 arms valid and successful**.

Overall candidate progress after this block is 8/16 trials, 32 arms, 31 valid,
and 30 successful. The two missing valid/successful counts come only from the
previously disclosed small-local infrastructure incident.

## Integrity and infrastructure

- All preregistered IDs, seeds, cache states, and Williams orders were used.
- The system-awake guard was active for the entire block, then released with
  exit code 0 and empty stderr.
- All 64 public evidence files currently pass checksum and privacy audit.
- Execution remained sequential. No arms ran concurrently.

## Correctness, scope, and routing

Every Control, Route-only, Full, and Adaptive arm passed public tests and the
hidden Oracle. Every arm changed exactly the two required files, producing
changed-file precision and recall of `1.0 / 1.0`, with no forbidden change.

Every Palace arm retrieved all four routing ground-truth files: route Recall@K
was `1.0` and Precision@K was `0.8` in all 12 Palace arms. This supports the
0.3.0 routing correction as accurate on the synthetic cross-stack contract.
It did not produce a correctness advantage because Control also solved all four
trials exactly.

## Adaptive behavior

Adaptive selected `full-palace` in all four trials. It emitted 4,183 context
bytes each time, while the legacy Full and Route-only outputs were 3,121 bytes.
The conservative mode avoided missing cross-stack dependencies but did not
bound the payload below Full Palace in this fixture.

## Paired results

| Comparison | Reported-token paired median | Tool-call paired median | Wall-time paired median |
| --- | ---: | ---: | ---: |
| Adaptive - Control | +30,630.5 (95% bootstrap CI +11,218 to +53,592) | +3 (CI +2 to +6) | +10.974 s (CI +9.022 to +22.131) |
| Adaptive - Full | +1,283.5 (CI -19,868 to +19,881) | -4 (CI -6 to +1) | -2.483 s (CI -32.704 to +15.075) |
| Route-only - Control | +20,260.5 (CI -5,355 to +37,438) | +8 (CI +8 to +10) | +8.805 s (CI +4.725 to +16.899) |

With four pairs, this remains exploratory. Even so, the observed direction is
clear enough for product diagnosis: Adaptive was equivalent to Full within
wide intervals and measurably more expensive than Control in this block.

## Interim decision

The 0.3.0 route is complete and safe here, but current Adaptive mode selection
is too conservative to improve cross-stack efficiency. A future product change
should introduce a genuinely bounded cross-stack payload, reduce mode/telemetry
overhead, or provide stronger evidence that routed context prevents errors in
tasks Control cannot already solve. No product code is changed mid-candidate;
the remaining memory-dependent and stale-memory blocks run first.
