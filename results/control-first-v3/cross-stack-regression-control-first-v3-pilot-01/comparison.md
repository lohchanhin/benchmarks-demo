# Vertex Palace Control-First Four-Arm Benchmark

Run: `cross-stack-regression-control-first-v3-pilot-01`
Scenario: Cross-stack discounted shipping quote regression
Shared Git tree: `03e668daf6544de5d35a32f0ab12ce7684e23e87`
Generated fixture files: 87
Palace index state: warm
Comparable result: yes
Execution: sequential (Route-only -> Full Palace -> Control -> Adaptive Palace)

## Task

Fix checkout shipping quotes end to end. Free shipping must use the discounted merchandise subtotal, and the checkout view model must display the shipping amount returned by the quote service. Preserve the public response contract and make the complete test suite pass without changing tests.

## Results

| Metric | Control | Route-only | Full Palace | Adaptive Palace | Control minus Adaptive |
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
| Elapsed time | 50.3s | 55.3s | 58.7s | 44.2s | +6.1s |
| Recorded command/tool calls | 4 | 6 | 12 | 3 | +1 |
| Failed recorded calls | 0 | 0 | 0 | 0 | 0 |
| Codex router errors in stderr | 0 | 0 | 0 | 0 | 0 |
| Native patch verification errors | 0 | 0 | 0 | 0 | 0 |
| Sandbox preparation errors | 0 | 0 | 0 | 0 | 0 |
| Inspection commands | 2 | 2 | 4 | 0 | +2 |
| Files named in commands | 4 | 6 | 4 | 3 | +1 |
| Distinct repository path strings observed | 5 | 6 | 6 | 7 | -2 |
| Command output characters | 4,307 | 9,211 | 7,511 | 6,912 | -2,605 |
| Palace context output characters | n/a | 3,121 | 3,121 | 4,617 | n/a |
| Palace context output bytes | n/a | 3,121 | 3,121 | 4,617 | n/a |
| Palace context estimated tokens | n/a | 781 | 781 | 1,155 | n/a |
| Cumulative input tokens | 103,440 | 109,262 | 127,151 | 75,706 | +27,734 |
| Cached input tokens | 90,368 | 99,584 | 115,712 | 52,224 | +38,144 |
| Uncached input tokens | 13,072 | 9,678 | 11,439 | 23,482 | -10,410 |
| Output tokens | 1,510 | 1,391 | 1,895 | 1,249 | +261 |
| Cumulative reported tokens | 104,950 | 110,653 | 129,046 | 76,955 | +27,995 |
| Palace calls | 0 | 1 | 1 | 1 | - |

Positive values in the final column mean Adaptive Palace used less than Control for that measured resource.

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

## Instrumentation Excluded From Scope

Raw Git status is preserved in each arm evidence file. Only root `.palace` state is excluded from correctness and changed-file precision/recall.

- Control: None
- Route-only: None
- Full Palace: None
- Adaptive Palace: None

## Validity

- Control: 0 Palace calls detected; expected 0; Codex exit code 0; timedOut=false; fixed execution settings match the run plan; sandbox preparation errors=0; expected 0; fixture tree matches 03e668daf6544de5d35a32f0ab12ce7684e23e87
- Route-only: 1/1 successful/total Palace calls; adaptiveRequested=false; expected false; adaptivePayloadMatchesOutput=null; taskFidelity=true; Codex exit code 0; timedOut=false; fixed execution settings match the run plan; sandbox preparation errors=0; expected 0; fixture tree matches 03e668daf6544de5d35a32f0ab12ce7684e23e87
- Full Palace: 1/1 successful/total Palace calls; adaptiveRequested=false; expected false; adaptivePayloadMatchesOutput=null; taskFidelity=true; Codex exit code 0; timedOut=false; fixed execution settings match the run plan; sandbox preparation errors=0; expected 0; fixture tree matches 03e668daf6544de5d35a32f0ab12ce7684e23e87
- Adaptive Palace: 1/1 successful/total Palace calls; adaptiveRequested=true; expected true; adaptivePayloadMatchesOutput=true; taskFidelity=true; Codex exit code 0; timedOut=false; fixed execution settings match the run plan; sandbox preparation errors=0; expected 0; fixture tree matches 03e668daf6544de5d35a32f0ab12ce7684e23e87

## Route And Memory Signals

- Route-only Recall@K / Precision@K: 100.0% / 80.0% (K=5)
- Full Palace Recall@K / Precision@K: 100.0% / 80.0% (K=5)
- Adaptive Palace Recall@K / Precision@K: 100.0% / 80.0% (K=5)
- Control pitfall violation / wrong-memory adoption: n/a / n/a
- Route-only pitfall violation / wrong-memory adoption: n/a / n/a
- Full Palace pitfall violation / wrong-memory adoption: n/a / n/a
- Adaptive Palace pitfall violation / wrong-memory adoption: n/a / n/a
- Adaptive selected mode: full-palace
- Adaptive self-reported payload: 4,617 bytes / ~1,155 tokens
- Adaptive self-reported memory: 0 included / 0 candidates / 0 excluded

## Caveats

- Distinct repository path strings are matched anywhere in the transcript. An inventory command can list every path without reading every file's contents.
- Command-named files and command-output characters are transcript-derived context proxies, not an operating-system file-access audit.
- Codex input tokens are cumulative across model turns. Cached and uncached input are shown separately and are not an API billing statement.
- Paired arms run sequentially, never concurrently. Repeat pairs with alternating order and report medians to reduce order and service-load effects.
- Palace index cache state for this trial: warm. This does not control provider-side model caching.
- Root .palace paths are recorded as benchmark instrumentation and excluded from changed-file scope; raw Git status remains in each arm evidence file.
- A result is comparable only when both arms start from the recorded Git tree and pass their arm-validity checks.
- Correctness and scope determine the score. Speed and token metrics are reported, not rewarded.
