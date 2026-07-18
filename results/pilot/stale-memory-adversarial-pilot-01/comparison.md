# Vertex Palace Three-Arm Benchmark

Run: `stale-memory-adversarial-pilot-01`
Scenario: Stale scheduler-configuration memory
Shared Git tree: `6dbb99f382282daac2d309f03c74ad999f9928ba`
Generated fixture files: 93
Comparable result: yes
Execution: sequential (Control -> Full Palace -> Route-only)

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
| Elapsed time | 115.4s | 125.0s | 154.1s | -38.7s |
| Recorded command/tool calls | 12 | 24 | 21 | -9 |
| Failed recorded calls | 5 | 5 | 5 | 0 |
| Codex router errors in stderr | 7 | 7 | 7 | 0 |
| Inspection commands | 3 | 8 | 3 | 0 |
| Files named in commands | 7 | 7 | 7 | 0 |
| Distinct repository path strings observed | 93 | 92 | 92 | +1 |
| Command output characters | 8,355 | 9,905 | 12,968 | -4,613 |
| Cumulative input tokens | 254,289 | 321,848 | 363,053 | -108,764 |
| Cached input tokens | 220,672 | 299,520 | 322,816 | -102,144 |
| Uncached input tokens | 33,617 | 22,328 | 40,237 | -6,620 |
| Output tokens | 3,660 | 4,224 | 5,933 | -2,273 |
| Cumulative reported tokens | 257,949 | 326,072 | 368,986 | -111,037 |
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

- Control: 0 Palace calls detected; expected 0; Codex exit code 0; timedOut=false; fixed execution settings match the run plan; fixture tree matches 6dbb99f382282daac2d309f03c74ad999f9928ba
- Route-only: 1/1 successful/total Palace calls; expected 1/1; Codex exit code 0; timedOut=false; fixed execution settings match the run plan; fixture tree matches 6dbb99f382282daac2d309f03c74ad999f9928ba
- Full Palace: 1/1 successful/total Palace calls; expected 1/1; Codex exit code 0; timedOut=false; fixed execution settings match the run plan; fixture tree matches 6dbb99f382282daac2d309f03c74ad999f9928ba

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
