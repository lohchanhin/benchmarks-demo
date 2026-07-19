# Vertex Palace Four-Arm Adaptive Benchmark

Run: `cross-stack-regression-adaptive-v2-2-pilot-01`
Scenario: Cross-stack discounted shipping quote regression
Shared Git tree: `8b93dfd4e1ba278292f2549a53ca06b5ed3d18af`
Generated fixture files: 87
Palace index state: warm
Comparable result: yes
Execution: sequential (Route-only -> Full Palace -> Control -> Adaptive Palace)

## Task

Fix checkout shipping quotes end to end. Free shipping must use the discounted merchandise subtotal, and the checkout view model must display the shipping amount returned by the quote service. Preserve the public response contract and make the complete test suite pass without changing tests.

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
| Elapsed time | 50.7s | 65.0s | 115.2s | 60.1s | +55.1s |
| Recorded command/tool calls | 6 | 16 | 5 | 7 | -2 |
| Failed recorded calls | 1 | 0 | 1 | 0 | +1 |
| Codex router errors in stderr | 1 | 0 | 1 | 0 | +1 |
| Native patch verification errors | 0 | 0 | 0 | 0 | 0 |
| Sandbox preparation errors | 0 | 0 | 0 | 0 | 0 |
| Inspection commands | 3 | 7 | 2 | 3 | -1 |
| Files named in commands | 6 | 6 | 6 | 5 | +1 |
| Distinct repository path strings observed | 87 | 87 | 86 | 7 | +79 |
| Command output characters | 13,367 | 12,215 | 12,622 | 6,678 | +5,944 |
| Palace context output characters | n/a | 3,108 | 3,108 | 2,179 | +929 |
| Palace context output bytes | n/a | 3,108 | 3,108 | 2,179 | +929 |
| Palace context estimated tokens | n/a | 777 | 777 | 545 | +232 |
| Cumulative input tokens | 98,465 | 151,679 | 113,095 | 137,385 | -24,290 |
| Cached input tokens | 83,456 | 124,928 | 92,672 | 124,672 | -32,000 |
| Uncached input tokens | 15,009 | 26,751 | 20,423 | 12,713 | +7,710 |
| Output tokens | 1,390 | 2,009 | 1,391 | 1,689 | -298 |
| Cumulative reported tokens | 99,855 | 153,688 | 114,486 | 139,074 | -24,588 |
| Palace calls | 0 | 1 | 1 | 1 | - |

Positive values in the final column mean Adaptive Palace used less than Full Palace for that measured resource.

## Changed Files

### Control

- `client/src/checkout/quote-view-model.mjs`
- `server/src/pricing/create-quote.mjs`

### Route-only

- `client/src/checkout/quote-view-model.mjs`
- `server/src/pricing/create-quote.mjs`

### Full Palace

- `client/src/checkout/quote-view-model.mjs`
- `server/src/pricing/create-quote.mjs`

### Adaptive Palace

- `client/src/checkout/quote-view-model.mjs`
- `server/src/pricing/create-quote.mjs`

## Validity

- Control: 0 Palace calls detected; expected 0; Codex exit code 0; timedOut=false; fixed execution settings match the run plan; sandbox preparation errors=0; expected 0; fixture tree matches 8b93dfd4e1ba278292f2549a53ca06b5ed3d18af
- Route-only: 1/1 successful/total Palace calls; adaptiveRequested=false; expected false; adaptivePayloadMatchesOutput=null; taskFidelity=true; Codex exit code 0; timedOut=false; fixed execution settings match the run plan; sandbox preparation errors=0; expected 0; fixture tree matches 8b93dfd4e1ba278292f2549a53ca06b5ed3d18af
- Full Palace: 1/1 successful/total Palace calls; adaptiveRequested=false; expected false; adaptivePayloadMatchesOutput=null; taskFidelity=true; Codex exit code 0; timedOut=false; fixed execution settings match the run plan; sandbox preparation errors=0; expected 0; fixture tree matches 8b93dfd4e1ba278292f2549a53ca06b5ed3d18af
- Adaptive Palace: 1/1 successful/total Palace calls; adaptiveRequested=true; expected true; adaptivePayloadMatchesOutput=true; taskFidelity=true; Codex exit code 0; timedOut=false; fixed execution settings match the run plan; sandbox preparation errors=0; expected 0; fixture tree matches 8b93dfd4e1ba278292f2549a53ca06b5ed3d18af

## Route And Memory Signals

- Route-only Recall@K / Precision@K: 100.0% / 80.0% (K=5)
- Full Palace Recall@K / Precision@K: 100.0% / 80.0% (K=5)
- Adaptive Palace Recall@K / Precision@K: 100.0% / 80.0% (K=5)
- Control pitfall violation / wrong-memory adoption: n/a / n/a
- Route-only pitfall violation / wrong-memory adoption: n/a / n/a
- Full Palace pitfall violation / wrong-memory adoption: n/a / n/a
- Adaptive Palace pitfall violation / wrong-memory adoption: n/a / n/a
- Adaptive selected mode: full-palace
- Adaptive self-reported payload: 2,179 bytes / ~545 tokens

## Caveats

- Distinct repository path strings are matched anywhere in the transcript. An inventory command can list every path without reading every file's contents.
- Command-named files and command-output characters are transcript-derived context proxies, not an operating-system file-access audit.
- Codex input tokens are cumulative across model turns. Cached and uncached input are shown separately and are not an API billing statement.
- Paired arms run sequentially, never concurrently. Repeat pairs with alternating order and report medians to reduce order and service-load effects.
- Palace index cache state for this trial: warm. This does not control provider-side model caching.
- A result is comparable only when both arms start from the recorded Git tree and pass their arm-validity checks.
- Correctness and scope determine the score. Speed and token metrics are reported, not rewarded.
