# Vertex Palace Four-Arm Adaptive Benchmark

Run: `stale-memory-adversarial-adaptive-v2-2-pilot-01`
Scenario: Stale scheduler-configuration memory
Shared Git tree: `9c652fabca0fcdf3293c5deb28678446a4ba2b92`
Generated fixture files: 93
Palace index state: warm
Comparable result: yes
Execution: sequential (Adaptive Palace -> Control -> Full Palace -> Route-only)

## Task

Fix the v2 batch scheduler returning a limit of 10 instead of the configured limit of 25. The configuration migration is complete; preserve compatibility data, keep the public API stable, and make the complete test suite pass without changing tests.

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
| Elapsed time | 64.8s | 58.4s | 91.0s | 120.6s | -29.6s |
| Recorded command/tool calls | 5 | 6 | 10 | 17 | -7 |
| Failed recorded calls | 1 | 0 | 0 | 2 | -2 |
| Codex router errors in stderr | 1 | 0 | 0 | 2 | -2 |
| Native patch verification errors | 0 | 0 | 0 | 0 | 0 |
| Sandbox preparation errors | 0 | 0 | 0 | 0 | 0 |
| Inspection commands | 4 | 3 | 2 | 7 | -5 |
| Files named in commands | 7 | 7 | 7 | 6 | +1 |
| Distinct repository path strings observed | 93 | 7 | 93 | 7 | +86 |
| Command output characters | 10,790 | 4,706 | 10,092 | 5,200 | +4,892 |
| Palace context output characters | n/a | 2,327 | 3,127 | 2,894 | +233 |
| Palace context output bytes | n/a | 2,327 | 3,127 | 2,894 | +233 |
| Palace context estimated tokens | n/a | 582 | 782 | 724 | +58 |
| Cumulative input tokens | 131,631 | 119,689 | 148,491 | 174,105 | -25,614 |
| Cached input tokens | 111,616 | 109,568 | 134,912 | 154,880 | -19,968 |
| Uncached input tokens | 20,015 | 10,121 | 13,579 | 19,225 | -5,646 |
| Output tokens | 1,911 | 1,303 | 1,969 | 2,467 | -498 |
| Cumulative reported tokens | 133,542 | 120,992 | 150,460 | 176,572 | -26,112 |
| Palace calls | 0 | 1 | 1 | 1 | - |

Positive values in the final column mean Adaptive Palace used less than Full Palace for that measured resource.

## Changed Files

### Control

- `src/scheduler/load-batch-limit.mjs`

### Route-only

- `src/scheduler/load-batch-limit.mjs`

### Full Palace

- `src/scheduler/load-batch-limit.mjs`

### Adaptive Palace

- `src/scheduler/load-batch-limit.mjs`

## Validity

- Control: 0 Palace calls detected; expected 0; Codex exit code 0; timedOut=false; fixed execution settings match the run plan; sandbox preparation errors=0; expected 0; fixture tree matches 9c652fabca0fcdf3293c5deb28678446a4ba2b92
- Route-only: 1/1 successful/total Palace calls; adaptiveRequested=false; expected false; adaptivePayloadMatchesOutput=null; taskFidelity=true; Codex exit code 0; timedOut=false; fixed execution settings match the run plan; sandbox preparation errors=0; expected 0; fixture tree matches 9c652fabca0fcdf3293c5deb28678446a4ba2b92
- Full Palace: 1/1 successful/total Palace calls; adaptiveRequested=false; expected false; adaptivePayloadMatchesOutput=null; taskFidelity=true; Codex exit code 0; timedOut=false; fixed execution settings match the run plan; sandbox preparation errors=0; expected 0; fixture tree matches 9c652fabca0fcdf3293c5deb28678446a4ba2b92
- Adaptive Palace: 1/1 successful/total Palace calls; adaptiveRequested=true; expected true; adaptivePayloadMatchesOutput=true; taskFidelity=true; Codex exit code 0; timedOut=false; fixed execution settings match the run plan; sandbox preparation errors=0; expected 0; fixture tree matches 9c652fabca0fcdf3293c5deb28678446a4ba2b92

## Route And Memory Signals

- Route-only Recall@K / Precision@K: 100.0% / 66.7% (K=6)
- Full Palace Recall@K / Precision@K: 100.0% / 66.7% (K=6)
- Adaptive Palace Recall@K / Precision@K: 100.0% / 66.7% (K=6)
- Control pitfall violation / wrong-memory adoption: n/a / no
- Route-only pitfall violation / wrong-memory adoption: n/a / no
- Full Palace pitfall violation / wrong-memory adoption: n/a / no
- Adaptive Palace pitfall violation / wrong-memory adoption: n/a / no
- Adaptive selected mode: guarded-memory-palace
- Adaptive self-reported payload: 2,894 bytes / ~724 tokens

## Caveats

- Distinct repository path strings are matched anywhere in the transcript. An inventory command can list every path without reading every file's contents.
- Command-named files and command-output characters are transcript-derived context proxies, not an operating-system file-access audit.
- Codex input tokens are cumulative across model turns. Cached and uncached input are shown separately and are not an API billing statement.
- Paired arms run sequentially, never concurrently. Repeat pairs with alternating order and report medians to reduce order and service-load effects.
- Palace index cache state for this trial: warm. This does not control provider-side model caching.
- A result is comparable only when both arms start from the recorded Git tree and pass their arm-validity checks.
- Correctness and scope determine the score. Speed and token metrics are reported, not rewarded.
