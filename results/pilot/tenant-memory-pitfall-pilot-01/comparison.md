# Vertex Palace Three-Arm Benchmark

Run: `tenant-memory-pitfall-pilot-01`
Scenario: Tenant-scoped article theme regression with prior pitfall
Shared Git tree: `8ed51632e3eab082e3dee0b880189b03403eedbd`
Generated fixture files: 240
Comparable result: yes
Execution: sequential (Control -> Route-only -> Full Palace)

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
| Elapsed time | 173.9s | 158.8s | 139.2s | +34.7s |
| Recorded command/tool calls | 17 | 17 | 16 | +1 |
| Failed recorded calls | 6 | 6 | 4 | +2 |
| Codex router errors in stderr | 8 | 8 | 6 | +2 |
| Inspection commands | 6 | 4 | 4 | +2 |
| Files named in commands | 11 | 11 | 11 | 0 |
| Distinct repository path strings observed | 204 | 11 | 11 | +193 |
| Command output characters | 20,889 | 17,151 | 16,949 | +3,940 |
| Cumulative input tokens | 412,129 | 364,010 | 347,472 | +64,657 |
| Cached input tokens | 385,024 | 338,176 | 310,784 | +74,240 |
| Uncached input tokens | 27,105 | 25,834 | 36,688 | -9,583 |
| Output tokens | 5,383 | 4,997 | 5,330 | +53 |
| Cumulative reported tokens | 417,512 | 369,007 | 352,802 | +64,710 |
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

- Control: 0 Palace calls detected; expected 0; Codex exit code 0; timedOut=false; fixed execution settings match the run plan; fixture tree matches 8ed51632e3eab082e3dee0b880189b03403eedbd
- Route-only: 1/1 successful/total Palace calls; expected 1/1; Codex exit code 0; timedOut=false; fixed execution settings match the run plan; fixture tree matches 8ed51632e3eab082e3dee0b880189b03403eedbd
- Full Palace: 1/1 successful/total Palace calls; expected 1/1; Codex exit code 0; timedOut=false; fixed execution settings match the run plan; fixture tree matches 8ed51632e3eab082e3dee0b880189b03403eedbd

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
