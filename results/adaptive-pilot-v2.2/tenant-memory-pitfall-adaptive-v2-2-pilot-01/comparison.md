# Vertex Palace Four-Arm Adaptive Benchmark

Run: `tenant-memory-pitfall-adaptive-v2-2-pilot-01`
Scenario: Tenant-scoped article theme regression with prior pitfall
Shared Git tree: `8486a4f3601b43553c58af620a5aeff68f6e08ec`
Generated fixture files: 240
Palace index state: warm
Comparable result: yes
Execution: sequential (Full Palace -> Adaptive Palace -> Route-only -> Control)

## Task

Fix the Aurora article hero contrast regression while preserving the appearance of every other tenant. The renderer must honor an explicit tenant text-color override, the Aurora hero must meet WCAG AA contrast, and the complete test suite must pass. Do not weaken or rewrite the tests.

## Results

| Metric | Control | Route-only | Full Palace | Adaptive Palace | Full Palace minus Adaptive |
| --- | ---: | ---: | ---: | ---: | ---: |
| Protocol success | yes | yes | yes | yes | - |
| Public tests | yes | yes | yes | yes | - |
| Hidden oracle | yes | yes | yes | yes | - |
| Timed out | no | no | no | no | - |
| Arm valid | valid | valid | valid | valid | - |
| Scope score | 100/100 | 100/100 | 100/100 | 100/100 | - |
| Changed-file precision | 100.0% | 100.0% | 100.0% | 100.0% | - |
| Changed-file recall | 100.0% | 100.0% | 100.0% | 100.0% | - |
| Forbidden-file violation | no | no | no | no | - |
| Elapsed time | 75.4s | 97.0s | 96.7s | 90.7s | +6.0s |
| Recorded command/tool calls | 5 | 24 | 12 | 8 | +4 |
| Failed recorded calls | 1 | 1 | 1 | 1 | 0 |
| Codex router errors in stderr | 1 | 1 | 1 | 1 | 0 |
| Native patch verification errors | 0 | 0 | 0 | 0 | 0 |
| Sandbox preparation errors | 0 | 0 | 0 | 0 | 0 |
| Inspection commands | 3 | 14 | 3 | 3 | 0 |
| Files named in commands | 11 | 11 | 9 | 5 | +4 |
| Distinct repository path strings observed | 202 | 11 | 239 | 9 | +230 |
| Command output characters | 20,709 | 13,532 | 22,315 | 8,821 | +13,494 |
| Palace context output characters | n/a | 4,545 | 5,465 | 2,450 | +3,015 |
| Palace context output bytes | n/a | 4,545 | 5,465 | 2,450 | +3,015 |
| Palace context estimated tokens | n/a | 1,137 | 1,367 | 613 | +754 |
| Cumulative input tokens | 126,570 | 157,602 | 175,428 | 159,864 | +15,564 |
| Cached input tokens | 101,888 | 142,080 | 153,344 | 146,944 | +6,400 |
| Uncached input tokens | 24,682 | 15,522 | 22,084 | 12,920 | +9,164 |
| Output tokens | 2,052 | 2,861 | 2,801 | 2,375 | +426 |
| Cumulative reported tokens | 128,622 | 160,463 | 178,229 | 162,239 | +15,990 |
| Palace calls | 0 | 1 | 1 | 1 | - |

Positive values in the final column mean Adaptive Palace used less than Full Palace for that measured resource.

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

### Adaptive Palace

- `clients/aurora/theme.mjs`
- `src/rendering/article-page.mjs`

## Validity

- Control: 0 Palace calls detected; expected 0; Codex exit code 0; timedOut=false; fixed execution settings match the run plan; sandbox preparation errors=0; expected 0; fixture tree matches 8486a4f3601b43553c58af620a5aeff68f6e08ec
- Route-only: 1/1 successful/total Palace calls; adaptiveRequested=false; expected false; adaptivePayloadMatchesOutput=null; taskFidelity=true; Codex exit code 0; timedOut=false; fixed execution settings match the run plan; sandbox preparation errors=0; expected 0; fixture tree matches 8486a4f3601b43553c58af620a5aeff68f6e08ec
- Full Palace: 1/1 successful/total Palace calls; adaptiveRequested=false; expected false; adaptivePayloadMatchesOutput=null; taskFidelity=true; Codex exit code 0; timedOut=false; fixed execution settings match the run plan; sandbox preparation errors=0; expected 0; fixture tree matches 8486a4f3601b43553c58af620a5aeff68f6e08ec
- Adaptive Palace: 1/1 successful/total Palace calls; adaptiveRequested=true; expected true; adaptivePayloadMatchesOutput=true; taskFidelity=true; Codex exit code 0; timedOut=false; fixed execution settings match the run plan; sandbox preparation errors=0; expected 0; fixture tree matches 8486a4f3601b43553c58af620a5aeff68f6e08ec

## Route And Memory Signals

- Route-only Recall@K / Precision@K: 100.0% / 50.0% (K=8)
- Full Palace Recall@K / Precision@K: 100.0% / 50.0% (K=8)
- Adaptive Palace Recall@K / Precision@K: 100.0% / 50.0% (K=8)
- Control pitfall violation / wrong-memory adoption: no / n/a
- Route-only pitfall violation / wrong-memory adoption: no / n/a
- Full Palace pitfall violation / wrong-memory adoption: no / n/a
- Adaptive Palace pitfall violation / wrong-memory adoption: no / n/a
- Adaptive selected mode: full-palace
- Adaptive self-reported payload: 2,450 bytes / ~613 tokens

## Caveats

- Distinct repository path strings are matched anywhere in the transcript. An inventory command can list every path without reading every file's contents.
- Command-named files and command-output characters are transcript-derived context proxies, not an operating-system file-access audit.
- Codex input tokens are cumulative across model turns. Cached and uncached input are shown separately and are not an API billing statement.
- Paired arms run sequentially, never concurrently. Repeat pairs with alternating order and report medians to reduce order and service-load effects.
- Palace index cache state for this trial: warm. This does not control provider-side model caching.
- A result is comparable only when both arms start from the recorded Git tree and pass their arm-validity checks.
- Correctness and scope determine the score. Speed and token metrics are reported, not rewarded.
