# Vertex Palace Three-Arm Benchmark

Run: `small-local-bug-pilot-03`
Scenario: Small single-file negative-zero formatting bug
Shared Git tree: `1b08beda021d05d4cae75479cf3753ca193257af`
Generated fixture files: 11
Comparable result: yes
Execution: sequential (Full Palace -> Route-only -> Control)

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
| Elapsed time | 129.6s | 128.3s | 178.1s | -48.5s |
| Recorded command/tool calls | 14 | 17 | 17 | -3 |
| Failed recorded calls | 6 | 4 | 5 | +1 |
| Codex router errors in stderr | 8 | 6 | 7 | +1 |
| Inspection commands | 3 | 4 | 1 | +2 |
| Files named in commands | 4 | 4 | 4 | 0 |
| Distinct repository path strings observed | 11 | 4 | 4 | +7 |
| Command output characters | 6,728 | 9,956 | 7,161 | -433 |
| Cumulative input tokens | 281,648 | 289,710 | 394,069 | -112,421 |
| Cached input tokens | 253,696 | 256,256 | 368,128 | -114,432 |
| Uncached input tokens | 27,952 | 33,454 | 25,941 | +2,011 |
| Output tokens | 4,348 | 4,816 | 5,765 | -1,417 |
| Cumulative reported tokens | 285,996 | 294,526 | 399,834 | -113,838 |
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

- Control: 0 Palace calls detected; expected 0; Codex exit code 0; timedOut=false; fixed execution settings match the run plan; fixture tree matches 1b08beda021d05d4cae75479cf3753ca193257af
- Route-only: 1/1 successful/total Palace calls; expected 1/1; Codex exit code 0; timedOut=false; fixed execution settings match the run plan; fixture tree matches 1b08beda021d05d4cae75479cf3753ca193257af
- Full Palace: 1/1 successful/total Palace calls; expected 1/1; Codex exit code 0; timedOut=false; fixed execution settings match the run plan; fixture tree matches 1b08beda021d05d4cae75479cf3753ca193257af

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
