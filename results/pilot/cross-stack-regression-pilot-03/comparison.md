# Vertex Palace Three-Arm Benchmark

Run: `cross-stack-regression-pilot-03`
Scenario: Cross-stack discounted shipping quote regression
Shared Git tree: `b0929ecf80c522d105c1614fcb3ffbe9a8cbb9be`
Generated fixture files: 87
Comparable result: yes
Execution: sequential (Control -> Route-only -> Full Palace)

## Task

Fix checkout shipping quotes end to end. Free shipping must use the discounted merchandise subtotal, and the checkout view model must display the shipping amount returned by the quote service. Preserve the public response contract and make the complete test suite pass without changing tests.

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
| Elapsed time | 108.6s | 132.2s | 101.1s | +7.5s |
| Recorded command/tool calls | 13 | 27 | 20 | -7 |
| Failed recorded calls | 7 | 3 | 2 | +5 |
| Codex router errors in stderr | 9 | 5 | 3 | +6 |
| Inspection commands | 4 | 8 | 7 | -3 |
| Files named in commands | 5 | 6 | 6 | -1 |
| Distinct repository path strings observed | 86 | 86 | 86 | 0 |
| Command output characters | 11,021 | 15,075 | 12,921 | -1,900 |
| Cumulative input tokens | 274,300 | 334,906 | 231,605 | +42,695 |
| Cached input tokens | 250,880 | 312,832 | 213,760 | +37,120 |
| Uncached input tokens | 23,420 | 22,074 | 17,845 | +5,575 |
| Output tokens | 3,712 | 4,495 | 3,366 | +346 |
| Cumulative reported tokens | 278,012 | 339,401 | 234,971 | +43,041 |
| Palace calls | 0 | 1 | 1 | - |

Positive values in the final column mean the Palace arm used less of that measured resource.

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

## Validity

- Control: 0 Palace calls detected; expected 0; Codex exit code 0; timedOut=false; fixed execution settings match the run plan; fixture tree matches b0929ecf80c522d105c1614fcb3ffbe9a8cbb9be
- Route-only: 1/1 successful/total Palace calls; expected 1/1; Codex exit code 0; timedOut=false; fixed execution settings match the run plan; fixture tree matches b0929ecf80c522d105c1614fcb3ffbe9a8cbb9be
- Full Palace: 1/1 successful/total Palace calls; expected 1/1; Codex exit code 0; timedOut=false; fixed execution settings match the run plan; fixture tree matches b0929ecf80c522d105c1614fcb3ffbe9a8cbb9be

## Route And Memory Signals

- Route-only Recall@K / Precision@K: 100.0% / 80.0% (K=5)
- Full Palace Recall@K / Precision@K: 100.0% / 80.0% (K=5)
- Control pitfall violation / wrong-memory adoption: n/a / n/a
- Route-only pitfall violation / wrong-memory adoption: n/a / n/a
- Full Palace pitfall violation / wrong-memory adoption: n/a / n/a

## Caveats

- Distinct repository path strings are matched anywhere in the transcript. An inventory command can list every path without reading every file's contents.
- Command-named files and command-output characters are transcript-derived context proxies, not an operating-system file-access audit.
- Codex input tokens are cumulative across model turns. Cached and uncached input are shown separately and are not an API billing statement.
- Paired arms run sequentially, never concurrently. Repeat pairs with alternating order and report medians to reduce order and service-load effects.
- A result is comparable only when both arms start from the recorded Git tree and pass their arm-validity checks.
- Correctness and scope determine the score. Speed and token metrics are reported, not rewarded.
