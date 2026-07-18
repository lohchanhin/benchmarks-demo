# Vertex Palace Three-Arm Benchmark

Run: `tenant-memory-pitfall-pilot-05`
Scenario: Tenant-scoped article theme regression with prior pitfall
Shared Git tree: `b1fcbad8435ee73802c8b4914aec6098b2b4e406`
Generated fixture files: 240
Comparable result: yes
Execution: sequential (Full Palace -> Control -> Route-only)

## Task

Fix the Aurora article hero contrast regression while preserving the appearance of every other tenant. The renderer must honor an explicit tenant text-color override, the Aurora hero must meet WCAG AA contrast, and the complete test suite must pass. Do not weaken or rewrite the tests.

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
| Elapsed time | 147.0s | 199.4s | 203.7s | -56.6s |
| Recorded command/tool calls | 14 | 31 | 38 | -24 |
| Failed recorded calls | 3 | 4 | 7 | -4 |
| Codex router errors in stderr | 5 | 6 | 9 | -4 |
| Inspection commands | 4 | 15 | 14 | -10 |
| Files named in commands | 11 | 14 | 14 | -3 |
| Distinct repository path strings observed | 239 | 239 | 239 | 0 |
| Command output characters | 27,409 | 23,968 | 28,562 | -1,153 |
| Cumulative input tokens | 366,440 | 392,087 | 537,719 | -171,279 |
| Cached input tokens | 341,760 | 364,032 | 502,016 | -160,256 |
| Uncached input tokens | 24,680 | 28,055 | 35,703 | -11,023 |
| Output tokens | 4,971 | 6,458 | 7,000 | -2,029 |
| Cumulative reported tokens | 371,411 | 398,545 | 544,719 | -173,308 |
| Palace calls | 0 | 1 | 1 | - |

Positive values in the final column mean the Palace arm used less of that measured resource.

## Changed Files

### Control

- `clients/aurora/theme.mjs`
- `src/rendering/article-page.mjs`

### Route-only

- `clients/aurora/theme.mjs`
- `src/rendering/article-page.mjs`

### Full Palace

- `clients/aurora/theme.mjs`
- `src/rendering/article-page.mjs`

## Validity

- Control: 0 Palace calls detected; expected 0; Codex exit code 0; timedOut=false; fixed execution settings match the run plan; fixture tree matches b1fcbad8435ee73802c8b4914aec6098b2b4e406
- Route-only: 1/1 successful/total Palace calls; expected 1/1; Codex exit code 0; timedOut=false; fixed execution settings match the run plan; fixture tree matches b1fcbad8435ee73802c8b4914aec6098b2b4e406
- Full Palace: 1/1 successful/total Palace calls; expected 1/1; Codex exit code 0; timedOut=false; fixed execution settings match the run plan; fixture tree matches b1fcbad8435ee73802c8b4914aec6098b2b4e406

## Route And Memory Signals

- Route-only Recall@K / Precision@K: 100.0% / 50.0% (K=8)
- Full Palace Recall@K / Precision@K: 100.0% / 50.0% (K=8)
- Control pitfall violation / wrong-memory adoption: no / n/a
- Route-only pitfall violation / wrong-memory adoption: no / n/a
- Full Palace pitfall violation / wrong-memory adoption: no / n/a

## Caveats

- Distinct repository path strings are matched anywhere in the transcript. An inventory command can list every path without reading every file's contents.
- Command-named files and command-output characters are transcript-derived context proxies, not an operating-system file-access audit.
- Codex input tokens are cumulative across model turns. Cached and uncached input are shown separately and are not an API billing statement.
- Paired arms run sequentially, never concurrently. Repeat pairs with alternating order and report medians to reduce order and service-load effects.
- A result is comparable only when both arms start from the recorded Git tree and pass their arm-validity checks.
- Correctness and scope determine the score. Speed and token metrics are reported, not rewarded.
