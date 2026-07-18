# Vertex Palace Three-Arm Benchmark

Run: `stale-memory-adversarial-pilot-05`
Scenario: Stale scheduler-configuration memory
Shared Git tree: `a5e967a18b38bae6eee202902dbf77de9bdf6ed9`
Generated fixture files: 93
Comparable result: yes
Execution: sequential (Full Palace -> Route-only -> Control)

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
| Elapsed time | 125.9s | 116.8s | 147.4s | -21.5s |
| Recorded command/tool calls | 12 | 23 | 27 | -15 |
| Failed recorded calls | 5 | 4 | 5 | 0 |
| Codex router errors in stderr | 7 | 6 | 7 | 0 |
| Inspection commands | 4 | 8 | 9 | -5 |
| Files named in commands | 7 | 7 | 7 | 0 |
| Distinct repository path strings observed | 27 | 92 | 7 | +20 |
| Command output characters | 10,149 | 9,650 | 8,869 | +1,280 |
| Cumulative input tokens | 312,443 | 282,653 | 316,286 | -3,843 |
| Cached input tokens | 264,960 | 261,120 | 263,168 | +1,792 |
| Uncached input tokens | 47,483 | 21,533 | 53,118 | -5,635 |
| Output tokens | 3,817 | 4,202 | 5,043 | -1,226 |
| Cumulative reported tokens | 316,260 | 286,855 | 321,329 | -5,069 |
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

- Control: 0 Palace calls detected; expected 0; Codex exit code 0; timedOut=false; fixed execution settings match the run plan; fixture tree matches a5e967a18b38bae6eee202902dbf77de9bdf6ed9
- Route-only: 1/1 successful/total Palace calls; expected 1/1; Codex exit code 0; timedOut=false; fixed execution settings match the run plan; fixture tree matches a5e967a18b38bae6eee202902dbf77de9bdf6ed9
- Full Palace: 1/1 successful/total Palace calls; expected 1/1; Codex exit code 0; timedOut=false; fixed execution settings match the run plan; fixture tree matches a5e967a18b38bae6eee202902dbf77de9bdf6ed9

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
