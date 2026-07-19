# Vertex Palace Four-Arm Adaptive Benchmark

Run: `cross-stack-regression-adaptive-v2-2-pilot-03`
Scenario: Cross-stack discounted shipping quote regression
Shared Git tree: `812f0000c11729e88c9f3ebb43716c8a066a7e92`
Generated fixture files: 87
Palace index state: warm
Comparable result: yes
Execution: sequential (Adaptive Palace -> Control -> Full Palace -> Route-only)

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
| Elapsed time | 50.6s | 47.4s | 70.4s | 88.3s | -17.9s |
| Recorded command/tool calls | 5 | 5 | 10 | 14 | -4 |
| Failed recorded calls | 0 | 0 | 0 | 1 | -1 |
| Codex router errors in stderr | 0 | 0 | 0 | 1 | -1 |
| Native patch verification errors | 0 | 0 | 0 | 0 | 0 |
| Sandbox preparation errors | 0 | 0 | 0 | 0 | 0 |
| Inspection commands | 2 | 2 | 5 | 5 | 0 |
| Files named in commands | 6 | 6 | 6 | 5 | +1 |
| Distinct repository path strings observed | 87 | 86 | 7 | 6 | +1 |
| Command output characters | 10,220 | 11,935 | 7,840 | 8,686 | -846 |
| Palace context output characters | n/a | 3,108 | 3,108 | 2,179 | +929 |
| Palace context output bytes | n/a | 3,108 | 3,108 | 2,179 | +929 |
| Palace context estimated tokens | n/a | 777 | 777 | 545 | +232 |
| Cumulative input tokens | 109,965 | 113,135 | 112,945 | 224,011 | -111,066 |
| Cached input tokens | 83,456 | 101,632 | 95,488 | 201,216 | -105,728 |
| Uncached input tokens | 26,509 | 11,503 | 17,457 | 22,795 | -5,338 |
| Output tokens | 1,292 | 1,463 | 2,454 | 2,391 | +63 |
| Cumulative reported tokens | 111,257 | 114,598 | 115,399 | 226,402 | -111,003 |
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

- Control: 0 Palace calls detected; expected 0; Codex exit code 0; timedOut=false; fixed execution settings match the run plan; sandbox preparation errors=0; expected 0; fixture tree matches 812f0000c11729e88c9f3ebb43716c8a066a7e92
- Route-only: 1/1 successful/total Palace calls; adaptiveRequested=false; expected false; adaptivePayloadMatchesOutput=null; taskFidelity=true; Codex exit code 0; timedOut=false; fixed execution settings match the run plan; sandbox preparation errors=0; expected 0; fixture tree matches 812f0000c11729e88c9f3ebb43716c8a066a7e92
- Full Palace: 1/1 successful/total Palace calls; adaptiveRequested=false; expected false; adaptivePayloadMatchesOutput=null; taskFidelity=true; Codex exit code 0; timedOut=false; fixed execution settings match the run plan; sandbox preparation errors=0; expected 0; fixture tree matches 812f0000c11729e88c9f3ebb43716c8a066a7e92
- Adaptive Palace: 1/1 successful/total Palace calls; adaptiveRequested=true; expected true; adaptivePayloadMatchesOutput=true; taskFidelity=true; Codex exit code 0; timedOut=false; fixed execution settings match the run plan; sandbox preparation errors=0; expected 0; fixture tree matches 812f0000c11729e88c9f3ebb43716c8a066a7e92

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
