# Vertex Palace Four-Arm Adaptive Benchmark

Run: `small-local-bug-adaptive-v2-2-pilot-02`
Scenario: Small single-file negative-zero formatting bug
Shared Git tree: `1d21b35ef827ce72c6d627eaf8ea9ba9a235fa18`
Generated fixture files: 11
Palace index state: cold
Comparable result: yes
Execution: sequential (Route-only -> Full Palace -> Control -> Adaptive Palace)

## Task

Fix currency formatting so negative zero is rendered as $0.00 while genuinely negative cent values keep their minus sign. Keep the public API stable and make the complete test suite pass without changing tests.

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
| Elapsed time | 39.8s | 82.2s | 66.8s | 52.2s | +14.6s |
| Recorded command/tool calls | 4 | 14 | 13 | 7 | +6 |
| Failed recorded calls | 0 | 1 | 1 | 0 | +1 |
| Codex router errors in stderr | 0 | 1 | 1 | 0 | +1 |
| Native patch verification errors | 0 | 0 | 0 | 0 | 0 |
| Sandbox preparation errors | 0 | 0 | 0 | 0 | 0 |
| Inspection commands | 2 | 4 | 4 | 2 | +2 |
| Files named in commands | 4 | 4 | 4 | 2 | +2 |
| Distinct repository path strings observed | 11 | 4 | 4 | 4 | 0 |
| Command output characters | 2,931 | 5,718 | 5,331 | 2,580 | +2,751 |
| Palace context output characters | n/a | 2,086 | 2,086 | 1,218 | +868 |
| Palace context output bytes | n/a | 2,086 | 2,086 | 1,218 | +868 |
| Palace context estimated tokens | n/a | 522 | 522 | 305 | +217 |
| Cumulative input tokens | 86,134 | 138,463 | 140,602 | 101,980 | +38,622 |
| Cached input tokens | 60,160 | 110,592 | 128,768 | 87,296 | +41,472 |
| Uncached input tokens | 25,974 | 27,871 | 11,834 | 14,684 | -2,850 |
| Output tokens | 1,026 | 2,344 | 1,833 | 1,524 | +309 |
| Cumulative reported tokens | 87,160 | 140,807 | 142,435 | 103,504 | +38,931 |
| Palace calls | 0 | 1 | 1 | 1 | - |

Positive values in the final column mean Adaptive Palace used less than Full Palace for that measured resource.

## Changed Files

### Control

- `src/format-currency.mjs`

### Route-only

- `src/format-currency.mjs`

### Full Palace

- `src/format-currency.mjs`

### Adaptive Palace

- `src/format-currency.mjs`

## Validity

- Control: 0 Palace calls detected; expected 0; Codex exit code 0; timedOut=false; fixed execution settings match the run plan; sandbox preparation errors=0; expected 0; fixture tree matches 1d21b35ef827ce72c6d627eaf8ea9ba9a235fa18
- Route-only: 1/1 successful/total Palace calls; adaptiveRequested=false; expected false; adaptivePayloadMatchesOutput=null; taskFidelity=true; Codex exit code 0; timedOut=false; fixed execution settings match the run plan; sandbox preparation errors=0; expected 0; fixture tree matches 1d21b35ef827ce72c6d627eaf8ea9ba9a235fa18
- Full Palace: 1/1 successful/total Palace calls; adaptiveRequested=false; expected false; adaptivePayloadMatchesOutput=null; taskFidelity=true; Codex exit code 0; timedOut=false; fixed execution settings match the run plan; sandbox preparation errors=0; expected 0; fixture tree matches 1d21b35ef827ce72c6d627eaf8ea9ba9a235fa18
- Adaptive Palace: 1/1 successful/total Palace calls; adaptiveRequested=true; expected true; adaptivePayloadMatchesOutput=true; taskFidelity=true; Codex exit code 0; timedOut=false; fixed execution settings match the run plan; sandbox preparation errors=0; expected 0; fixture tree matches 1d21b35ef827ce72c6d627eaf8ea9ba9a235fa18

## Route And Memory Signals

- Route-only Recall@K / Precision@K: 100.0% / 50.0% (K=4)
- Full Palace Recall@K / Precision@K: 100.0% / 50.0% (K=4)
- Adaptive Palace Recall@K / Precision@K: 100.0% / 50.0% (K=4)
- Control pitfall violation / wrong-memory adoption: n/a / n/a
- Route-only pitfall violation / wrong-memory adoption: n/a / n/a
- Full Palace pitfall violation / wrong-memory adoption: n/a / n/a
- Adaptive Palace pitfall violation / wrong-memory adoption: n/a / n/a
- Adaptive selected mode: route-lite
- Adaptive self-reported payload: 1,218 bytes / ~305 tokens

## Caveats

- Distinct repository path strings are matched anywhere in the transcript. An inventory command can list every path without reading every file's contents.
- Command-named files and command-output characters are transcript-derived context proxies, not an operating-system file-access audit.
- Codex input tokens are cumulative across model turns. Cached and uncached input are shown separately and are not an API billing statement.
- Paired arms run sequentially, never concurrently. Repeat pairs with alternating order and report medians to reduce order and service-load effects.
- Palace index cache state for this trial: cold. This does not control provider-side model caching.
- A result is comparable only when both arms start from the recorded Git tree and pass their arm-validity checks.
- Correctness and scope determine the score. Speed and token metrics are reported, not rewarded.
