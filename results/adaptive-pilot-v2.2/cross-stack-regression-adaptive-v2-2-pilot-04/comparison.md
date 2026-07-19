# Vertex Palace Four-Arm Adaptive Benchmark

Run: `cross-stack-regression-adaptive-v2-2-pilot-04`
Scenario: Cross-stack discounted shipping quote regression
Shared Git tree: `cee0f66fa29aa8bad8dcde2e3c22b899306132b0`
Generated fixture files: 87
Palace index state: cold
Comparable result: yes
Execution: sequential (Control -> Route-only -> Adaptive Palace -> Full Palace)

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
| Elapsed time | 49.3s | 67.7s | 101.9s | 80.4s | +21.5s |
| Recorded command/tool calls | 7 | 14 | 19 | 13 | +6 |
| Failed recorded calls | 0 | 0 | 2 | 1 | +1 |
| Codex router errors in stderr | 0 | 0 | 2 | 1 | +1 |
| Native patch verification errors | 0 | 0 | 0 | 0 | 0 |
| Sandbox preparation errors | 0 | 0 | 0 | 0 | 0 |
| Inspection commands | 3 | 6 | 7 | 6 | +1 |
| Files named in commands | 6 | 6 | 6 | 5 | +1 |
| Distinct repository path strings observed | 87 | 6 | 86 | 6 | +80 |
| Command output characters | 10,863 | 7,355 | 12,068 | 8,639 | +3,429 |
| Palace context output characters | n/a | 3,108 | 3,108 | 2,179 | +929 |
| Palace context output bytes | n/a | 3,108 | 3,108 | 2,179 | +929 |
| Palace context estimated tokens | n/a | 777 | 777 | 545 | +232 |
| Cumulative input tokens | 95,471 | 141,427 | 213,675 | 159,363 | +54,312 |
| Cached input tokens | 85,504 | 129,792 | 197,632 | 139,776 | +57,856 |
| Uncached input tokens | 9,967 | 11,635 | 16,043 | 19,587 | -3,544 |
| Output tokens | 1,520 | 1,906 | 3,077 | 2,243 | +834 |
| Cumulative reported tokens | 96,991 | 143,333 | 216,752 | 161,606 | +55,146 |
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

- Control: 0 Palace calls detected; expected 0; Codex exit code 0; timedOut=false; fixed execution settings match the run plan; sandbox preparation errors=0; expected 0; fixture tree matches cee0f66fa29aa8bad8dcde2e3c22b899306132b0
- Route-only: 1/1 successful/total Palace calls; adaptiveRequested=false; expected false; adaptivePayloadMatchesOutput=null; taskFidelity=true; Codex exit code 0; timedOut=false; fixed execution settings match the run plan; sandbox preparation errors=0; expected 0; fixture tree matches cee0f66fa29aa8bad8dcde2e3c22b899306132b0
- Full Palace: 1/1 successful/total Palace calls; adaptiveRequested=false; expected false; adaptivePayloadMatchesOutput=null; taskFidelity=true; Codex exit code 0; timedOut=false; fixed execution settings match the run plan; sandbox preparation errors=0; expected 0; fixture tree matches cee0f66fa29aa8bad8dcde2e3c22b899306132b0
- Adaptive Palace: 1/1 successful/total Palace calls; adaptiveRequested=true; expected true; adaptivePayloadMatchesOutput=true; taskFidelity=true; Codex exit code 0; timedOut=false; fixed execution settings match the run plan; sandbox preparation errors=0; expected 0; fixture tree matches cee0f66fa29aa8bad8dcde2e3c22b899306132b0

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
- Palace index cache state for this trial: cold. This does not control provider-side model caching.
- A result is comparable only when both arms start from the recorded Git tree and pass their arm-validity checks.
- Correctness and scope determine the score. Speed and token metrics are reported, not rewarded.
