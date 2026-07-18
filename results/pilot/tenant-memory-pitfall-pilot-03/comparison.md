# Vertex Palace Three-Arm Benchmark

Run: `tenant-memory-pitfall-pilot-03`
Scenario: Tenant-scoped article theme regression with prior pitfall
Shared Git tree: `966f07829c3d89ff0ad4e7db19ea0724dc36ad86`
Generated fixture files: 240
Comparable result: yes
Execution: sequential (Route-only -> Full Palace -> Control)

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
| Elapsed time | 159.4s | 129.2s | 243.8s | -84.4s |
| Recorded command/tool calls | 12 | 29 | 30 | -18 |
| Failed recorded calls | 6 | 5 | 10 | -4 |
| Codex router errors in stderr | 8 | 7 | 12 | -4 |
| Inspection commands | 6 | 10 | 8 | -2 |
| Files named in commands | 9 | 9 | 14 | -5 |
| Distinct repository path strings observed | 201 | 11 | 239 | -38 |
| Command output characters | 22,142 | 13,767 | 29,303 | -7,161 |
| Cumulative input tokens | 332,388 | 282,402 | 555,011 | -222,623 |
| Cached input tokens | 306,176 | 262,400 | 523,520 | -217,344 |
| Uncached input tokens | 26,212 | 20,002 | 31,491 | -5,279 |
| Output tokens | 5,311 | 4,555 | 7,860 | -2,549 |
| Cumulative reported tokens | 337,699 | 286,957 | 562,871 | -225,172 |
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

- Control: 0 Palace calls detected; expected 0; Codex exit code 0; timedOut=false; fixed execution settings match the run plan; fixture tree matches 966f07829c3d89ff0ad4e7db19ea0724dc36ad86
- Route-only: 1/1 successful/total Palace calls; expected 1/1; Codex exit code 0; timedOut=false; fixed execution settings match the run plan; fixture tree matches 966f07829c3d89ff0ad4e7db19ea0724dc36ad86
- Full Palace: 1/1 successful/total Palace calls; expected 1/1; Codex exit code 0; timedOut=false; fixed execution settings match the run plan; fixture tree matches 966f07829c3d89ff0ad4e7db19ea0724dc36ad86

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
