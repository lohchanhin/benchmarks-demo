# Vertex Palace Three-Arm Benchmark

Run: `small-local-bug-pilot-02`
Scenario: Small single-file negative-zero formatting bug
Shared Git tree: `c9c10efa1d7beb60d0c2c620f7dd6d314ff0eb7f`
Generated fixture files: 11
Comparable result: yes
Execution: sequential (Control -> Route-only -> Full Palace)

## Task

Fix currency formatting so negative zero is rendered as $0.00 while genuinely negative cent values keep their minus sign. Keep the public API stable and make the complete test suite pass without changing tests.

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
| Elapsed time | 192.5s | 439.4s | 169.7s | +22.7s |
| Recorded command/tool calls | 14 | 35 | 21 | -7 |
| Failed recorded calls | 5 | 13 | 5 | 0 |
| Codex router errors in stderr | 7 | 15 | 7 | 0 |
| Inspection commands | 3 | 6 | 5 | -2 |
| Files named in commands | 4 | 4 | 4 | 0 |
| Distinct repository path strings observed | 11 | 4 | 4 | +7 |
| Command output characters | 8,971 | 10,162 | 7,057 | +1,914 |
| Cumulative input tokens | 291,817 | 641,481 | 321,365 | -29,548 |
| Cached input tokens | 243,712 | 570,880 | 297,472 | -53,760 |
| Uncached input tokens | 48,105 | 70,601 | 23,893 | +24,212 |
| Output tokens | 6,066 | 9,236 | 5,941 | +125 |
| Cumulative reported tokens | 297,883 | 650,717 | 327,306 | -29,423 |
| Palace calls | 0 | 1 | 1 | - |

Positive values in the final column mean the Palace arm used less of that measured resource.

## Changed Files

### Control

- `src/format-currency.mjs`

### Route-only

- `src/format-currency.mjs`

### Full Palace

- `src/format-currency.mjs`

## Validity

- Control: 0 Palace calls detected; expected 0; Codex exit code 0; timedOut=false; fixed execution settings match the run plan; fixture tree matches c9c10efa1d7beb60d0c2c620f7dd6d314ff0eb7f
- Route-only: 1/1 successful/total Palace calls; expected 1/1; Codex exit code 0; timedOut=false; fixed execution settings match the run plan; fixture tree matches c9c10efa1d7beb60d0c2c620f7dd6d314ff0eb7f
- Full Palace: 1/1 successful/total Palace calls; expected 1/1; Codex exit code 0; timedOut=false; fixed execution settings match the run plan; fixture tree matches c9c10efa1d7beb60d0c2c620f7dd6d314ff0eb7f

## Route And Memory Signals

- Route-only Recall@K / Precision@K: 100.0% / 50.0% (K=4)
- Full Palace Recall@K / Precision@K: 100.0% / 50.0% (K=4)
- Control pitfall violation / wrong-memory adoption: n/a / n/a
- Route-only pitfall violation / wrong-memory adoption: n/a / n/a
- Full Palace pitfall violation / wrong-memory adoption: n/a / n/a

## Caveats

- Distinct repository path strings are matched anywhere in the transcript. An inventory command can list every path without reading every file's contents.
- Command-named files and command-output characters are transcript-derived context proxies, not an operating-system file-access audit.
- Codex input tokens are cumulative across model turns. Cached and uncached input are shown separately and are not an API billing statement.
- Paired arms run sequentially, never concurrently. Repeat pairs with alternating order and report medians to reduce order and service-load effects.
- A result is comparable only when both arms start from the recorded Git tree and pass their arm-validity checks.
- Correctness and scope determine the score. Speed and token metrics are reported, not rewarded.
