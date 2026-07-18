# Vertex Palace Three-Arm Benchmark

Run: `stale-memory-adversarial-pilot-04`
Scenario: Stale scheduler-configuration memory
Shared Git tree: `3b2fe37a9762edc74b31ae7db96ebd3e90de33eb`
Generated fixture files: 93
Comparable result: yes
Execution: sequential (Route-only -> Control -> Full Palace)

## Task

Fix the v2 batch scheduler returning a limit of 10 instead of the configured limit of 25. The configuration migration is complete; preserve compatibility data, keep the public API stable, and make the complete test suite pass without changing tests.

## Results

| Metric | Control | Route-only | Full Palace | Control minus Full Palace |
| --- | ---: | ---: | ---: | ---: |
| Protocol success | yes | yes | yes | - |
| Public tests | yes | yes | yes | - |
| Hidden oracle | yes | yes | yes | - |
| Timed out | no | no | no | - |
| Arm valid | valid | valid | valid | - |
| Scope score | 100/100 | 100/100 | 100/100 | - |
| Changed-file precision | 100.0% | 100.0% | 100.0% | - |
| Changed-file recall | 100.0% | 100.0% | 100.0% | - |
| Forbidden-file violation | no | no | no | - |
| Elapsed time | 108.0s | 139.2s | 158.0s | -49.9s |
| Recorded command/tool calls | 12 | 31 | 15 | -3 |
| Failed recorded calls | 6 | 7 | 6 | 0 |
| Codex router errors in stderr | 8 | 9 | 8 | 0 |
| Inspection commands | 3 | 9 | 3 | 0 |
| Files named in commands | 7 | 7 | 7 | 0 |
| Distinct repository path strings observed | 93 | 7 | 92 | +1 |
| Command output characters | 9,331 | 7,653 | 11,940 | -2,609 |
| Cumulative input tokens | 256,075 | 367,941 | 432,783 | -176,708 |
| Cached input tokens | 237,824 | 324,608 | 396,544 | -158,720 |
| Uncached input tokens | 18,251 | 43,333 | 36,239 | -17,988 |
| Output tokens | 3,379 | 4,745 | 5,718 | -2,339 |
| Cumulative reported tokens | 259,454 | 372,686 | 438,501 | -179,047 |
| Palace calls | 0 | 1 | 1 | - |

Positive values in the final column mean the Palace arm used less of that measured resource.

## Changed Files

### Control

- `src/scheduler/load-batch-limit.mjs`

### Route-only

- `src/scheduler/load-batch-limit.mjs`

### Full Palace

- `src/scheduler/load-batch-limit.mjs`

## Validity

- Control: 0 Palace calls detected; expected 0; Codex exit code 0; timedOut=false; fixed execution settings match the run plan; fixture tree matches 3b2fe37a9762edc74b31ae7db96ebd3e90de33eb
- Route-only: 1/1 successful/total Palace calls; expected 1/1; Codex exit code 0; timedOut=false; fixed execution settings match the run plan; fixture tree matches 3b2fe37a9762edc74b31ae7db96ebd3e90de33eb
- Full Palace: 1/1 successful/total Palace calls; expected 1/1; Codex exit code 0; timedOut=false; fixed execution settings match the run plan; fixture tree matches 3b2fe37a9762edc74b31ae7db96ebd3e90de33eb

## Route And Memory Signals

- Route-only Recall@K / Precision@K: 100.0% / 66.7% (K=6)
- Full Palace Recall@K / Precision@K: 100.0% / 66.7% (K=6)
- Control pitfall violation / wrong-memory adoption: n/a / no
- Route-only pitfall violation / wrong-memory adoption: n/a / no
- Full Palace pitfall violation / wrong-memory adoption: n/a / no

## Caveats

- Distinct repository path strings are matched anywhere in the transcript. An inventory command can list every path without reading every file's contents.
- Command-named files and command-output characters are transcript-derived context proxies, not an operating-system file-access audit.
- Codex input tokens are cumulative across model turns. Cached and uncached input are shown separately and are not an API billing statement.
- Paired arms run sequentially, never concurrently. Repeat pairs with alternating order and report medians to reduce order and service-load effects.
- A result is comparable only when both arms start from the recorded Git tree and pass their arm-validity checks.
- Correctness and scope determine the score. Speed and token metrics are reported, not rewarded.
