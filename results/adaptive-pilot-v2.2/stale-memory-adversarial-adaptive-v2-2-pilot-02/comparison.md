# Vertex Palace Four-Arm Adaptive Benchmark

Run: `stale-memory-adversarial-adaptive-v2-2-pilot-02`
Scenario: Stale scheduler-configuration memory
Shared Git tree: `6132ce8f5ee8c967d5a0b1ab91e8e51d4695b9a5`
Generated fixture files: 93
Palace index state: cold
Comparable result: yes
Execution: sequential (Control -> Route-only -> Adaptive Palace -> Full Palace)

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
| Elapsed time | 71.8s | 71.4s | 65.4s | 59.8s | +5.6s |
| Recorded command/tool calls | 18 | 10 | 6 | 12 | -6 |
| Failed recorded calls | 0 | 0 | 0 | 0 | 0 |
| Codex router errors in stderr | 0 | 0 | 0 | 0 | 0 |
| Native patch verification errors | 0 | 0 | 0 | 0 | 0 |
| Sandbox preparation errors | 0 | 0 | 0 | 0 | 0 |
| Inspection commands | 9 | 1 | 2 | 6 | -4 |
| Files named in commands | 7 | 7 | 7 | 6 | +1 |
| Distinct repository path strings observed | 93 | 92 | 92 | 7 | +85 |
| Command output characters | 7,828 | 8,813 | 10,669 | 4,903 | +5,766 |
| Palace context output characters | n/a | 2,327 | 3,127 | 2,894 | +233 |
| Palace context output bytes | n/a | 2,327 | 3,127 | 2,894 | +233 |
| Palace context estimated tokens | n/a | 582 | 782 | 724 | +58 |
| Cumulative input tokens | 180,098 | 128,390 | 130,827 | 137,727 | -6,900 |
| Cached input tokens | 147,968 | 106,752 | 118,784 | 126,720 | -7,936 |
| Uncached input tokens | 32,130 | 21,638 | 12,043 | 11,007 | +1,036 |
| Output tokens | 2,012 | 1,679 | 1,805 | 1,732 | +73 |
| Cumulative reported tokens | 182,110 | 130,069 | 132,632 | 139,459 | -6,827 |
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

- Control: 0 Palace calls detected; expected 0; Codex exit code 0; timedOut=false; fixed execution settings match the run plan; sandbox preparation errors=0; expected 0; fixture tree matches 6132ce8f5ee8c967d5a0b1ab91e8e51d4695b9a5
- Route-only: 1/1 successful/total Palace calls; adaptiveRequested=false; expected false; adaptivePayloadMatchesOutput=null; taskFidelity=true; Codex exit code 0; timedOut=false; fixed execution settings match the run plan; sandbox preparation errors=0; expected 0; fixture tree matches 6132ce8f5ee8c967d5a0b1ab91e8e51d4695b9a5
- Full Palace: 1/1 successful/total Palace calls; adaptiveRequested=false; expected false; adaptivePayloadMatchesOutput=null; taskFidelity=true; Codex exit code 0; timedOut=false; fixed execution settings match the run plan; sandbox preparation errors=0; expected 0; fixture tree matches 6132ce8f5ee8c967d5a0b1ab91e8e51d4695b9a5
- Adaptive Palace: 1/1 successful/total Palace calls; adaptiveRequested=true; expected true; adaptivePayloadMatchesOutput=true; taskFidelity=true; Codex exit code 0; timedOut=false; fixed execution settings match the run plan; sandbox preparation errors=0; expected 0; fixture tree matches 6132ce8f5ee8c967d5a0b1ab91e8e51d4695b9a5

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
- Palace index cache state for this trial: cold. This does not control provider-side model caching.
- A result is comparable only when both arms start from the recorded Git tree and pass their arm-validity checks.
- Correctness and scope determine the score. Speed and token metrics are reported, not rewarded.
