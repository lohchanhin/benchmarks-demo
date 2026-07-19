# Vertex Palace Four-Arm Adaptive Benchmark

Run: `tenant-memory-pitfall-adaptive-v2-2-pilot-04`
Scenario: Tenant-scoped article theme regression with prior pitfall
Shared Git tree: `6394986e531de8424ff9050f8bff1f919bebebdb`
Generated fixture files: 240
Palace index state: cold
Comparable result: yes
Execution: sequential (Route-only -> Full Palace -> Control -> Adaptive Palace)

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
| Elapsed time | 67.7s | 92.2s | 84.2s | 85.2s | -1.0s |
| Recorded command/tool calls | 5 | 14 | 22 | 11 | +11 |
| Failed recorded calls | 1 | 2 | 1 | 1 | 0 |
| Codex router errors in stderr | 1 | 2 | 1 | 1 | 0 |
| Native patch verification errors | 0 | 0 | 0 | 0 | 0 |
| Sandbox preparation errors | 0 | 0 | 0 | 0 | 0 |
| Inspection commands | 3 | 4 | 14 | 5 | +9 |
| Files named in commands | 11 | 11 | 14 | 5 | +9 |
| Distinct repository path strings observed | 240 | 11 | 239 | 9 | +230 |
| Command output characters | 33,066 | 11,933 | 25,183 | 8,821 | +16,362 |
| Palace context output characters | n/a | 4,545 | 5,465 | 2,450 | +3,015 |
| Palace context output bytes | n/a | 4,545 | 5,465 | 2,450 | +3,015 |
| Palace context estimated tokens | n/a | 1,137 | 1,367 | 613 | +754 |
| Cumulative input tokens | 139,080 | 171,259 | 175,069 | 177,439 | -2,370 |
| Cached input tokens | 121,088 | 152,064 | 135,168 | 157,952 | -22,784 |
| Uncached input tokens | 17,992 | 19,195 | 39,901 | 19,487 | +20,414 |
| Output tokens | 1,958 | 2,605 | 2,605 | 2,127 | +478 |
| Cumulative reported tokens | 141,038 | 173,864 | 177,674 | 179,566 | -1,892 |
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

- Control: 0 Palace calls detected; expected 0; Codex exit code 0; timedOut=false; fixed execution settings match the run plan; sandbox preparation errors=0; expected 0; fixture tree matches 6394986e531de8424ff9050f8bff1f919bebebdb
- Route-only: 1/1 successful/total Palace calls; adaptiveRequested=false; expected false; adaptivePayloadMatchesOutput=null; taskFidelity=true; Codex exit code 0; timedOut=false; fixed execution settings match the run plan; sandbox preparation errors=0; expected 0; fixture tree matches 6394986e531de8424ff9050f8bff1f919bebebdb
- Full Palace: 1/1 successful/total Palace calls; adaptiveRequested=false; expected false; adaptivePayloadMatchesOutput=null; taskFidelity=true; Codex exit code 0; timedOut=false; fixed execution settings match the run plan; sandbox preparation errors=0; expected 0; fixture tree matches 6394986e531de8424ff9050f8bff1f919bebebdb
- Adaptive Palace: 1/1 successful/total Palace calls; adaptiveRequested=true; expected true; adaptivePayloadMatchesOutput=true; taskFidelity=true; Codex exit code 0; timedOut=false; fixed execution settings match the run plan; sandbox preparation errors=0; expected 0; fixture tree matches 6394986e531de8424ff9050f8bff1f919bebebdb

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
- Palace index cache state for this trial: cold. This does not control provider-side model caching.
- A result is comparable only when both arms start from the recorded Git tree and pass their arm-validity checks.
- Correctness and scope determine the score. Speed and token metrics are reported, not rewarded.
