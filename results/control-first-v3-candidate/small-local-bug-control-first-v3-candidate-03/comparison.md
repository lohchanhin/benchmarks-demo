# Vertex Palace Control-First Four-Arm Benchmark

Run: `small-local-bug-control-first-v3-candidate-03`
Scenario: Small single-file negative-zero formatting bug
Shared Git tree: `61c287de05e8baa7dd87935a51922d974ba74b2c`
Generated fixture files: 11
Palace index state: warm
Comparable result: no
Execution: sequential (Full Palace -> Adaptive Palace -> Route-only -> Control)

## Task

Fix currency formatting so negative zero is rendered as $0.00 while genuinely negative cent values keep their minus sign. Keep the public API stable and make the complete test suite pass without changing tests.

## Results

| Metric | Control | Route-only | Full Palace | Adaptive Palace | Control minus Adaptive |
| --- | ---: | ---: | ---: | ---: | ---: |
| Protocol success | yes | yes | no | no | - |
| Public tests | yes | yes | yes | no | - |
| Hidden oracle | yes | yes | yes | no | - |
| Timed out | no | no | yes | no | - |
| Arm valid | valid | valid | valid | invalid | - |
| Scope score | 100/100 | 100/100 | 100/100 | 20/100 | - |
| Changed-file precision | 100.0% | 100.0% | 100.0% | 0.0% | - |
| Changed-file recall | 100.0% | 100.0% | 100.0% | 0.0% | - |
| Forbidden-file violation | no | no | no | no | - |
| Elapsed time | 93.5s | 73.0s | 3636.7s | 35.9s | n/a |
| Recorded command/tool calls | 6 | 9 | 18 | 0 | n/a |
| Failed recorded calls | 0 | 0 | 4 | 0 | n/a |
| Codex router errors in stderr | 0 | 0 | 5 | 0 | n/a |
| Native patch verification errors | 0 | 0 | 0 | 0 | n/a |
| Sandbox preparation errors | 0 | 0 | 0 | 0 | n/a |
| Inspection commands | 2 | 3 | 3 | 0 | n/a |
| Files named in commands | 4 | 3 | 3 | 0 | n/a |
| Distinct repository path strings observed | 11 | 3 | 3 | 0 | n/a |
| Command output characters | 5,088 | 3,839 | 5,488 | 0 | n/a |
| Palace context output characters | n/a | 1,870 | 1,870 | n/a | n/a |
| Palace context output bytes | n/a | 1,870 | 1,870 | n/a | n/a |
| Palace context estimated tokens | n/a | 468 | 468 | n/a | n/a |
| Cumulative input tokens | 122,157 | 100,360 | 0 | 0 | n/a |
| Cached input tokens | 92,416 | 69,376 | 0 | 0 | n/a |
| Uncached input tokens | 29,741 | 30,984 | 0 | 0 | n/a |
| Output tokens | 2,124 | 1,349 | 0 | 0 | n/a |
| Cumulative reported tokens | 124,281 | 101,709 | 0 | 0 | n/a |
| Palace calls | 0 | 1 | 1 | 0 | - |

Efficiency deltas are withheld because the primary baseline and treatment did not both complete as valid, passing runs.

## Changed Files

### Control

- `src/format-currency.mjs`

### Route-only

- `src/format-currency.mjs`

### Full Palace

- `src/format-currency.mjs`

### Adaptive Palace

- None

## Instrumentation Excluded From Scope

Raw Git status is preserved in each arm evidence file. Only root `.palace` state is excluded from correctness and changed-file precision/recall.

- Control: None
- Route-only: None
- Full Palace: None
- Adaptive Palace: None

## Validity

- Control: 0 Palace calls detected; expected 0; Codex exit code 0; timedOut=false; fixed execution settings match the run plan; sandbox preparation errors=0; expected 0; fixture tree matches 61c287de05e8baa7dd87935a51922d974ba74b2c
- Route-only: 1/1 successful/total Palace calls; adaptiveRequested=false; expected false; adaptivePayloadMatchesOutput=null; taskFidelity=true; Codex exit code 0; timedOut=false; fixed execution settings match the run plan; sandbox preparation errors=0; expected 0; fixture tree matches 61c287de05e8baa7dd87935a51922d974ba74b2c
- Full Palace: 1/1 successful/total Palace calls; adaptiveRequested=false; expected false; adaptivePayloadMatchesOutput=null; taskFidelity=true; Codex exit code 1; timedOut=true; fixed execution settings match the run plan; sandbox preparation errors=0; expected 0; fixture tree matches 61c287de05e8baa7dd87935a51922d974ba74b2c
- Adaptive Palace: 0/0 successful/total Palace calls; adaptiveRequested=false; expected true; adaptivePayloadMatchesOutput=null; taskFidelity=false; Codex exit code 1; timedOut=false; fixed execution settings match the run plan; sandbox preparation errors=0; expected 0; fixture tree matches 61c287de05e8baa7dd87935a51922d974ba74b2c

## Route And Memory Signals

- Route-only Recall@K / Precision@K: 100.0% / 66.7% (K=3)
- Full Palace Recall@K / Precision@K: 100.0% / 66.7% (K=3)
- Adaptive Palace Recall@K / Precision@K: n/a
- Control pitfall violation / wrong-memory adoption: n/a / n/a
- Route-only pitfall violation / wrong-memory adoption: n/a / n/a
- Full Palace pitfall violation / wrong-memory adoption: n/a / n/a
- Adaptive Palace pitfall violation / wrong-memory adoption: n/a / n/a
- Adaptive selected mode: not captured
- Adaptive self-reported payload: n/a
- Adaptive self-reported memory: n/a

## Caveats

- Distinct repository path strings are matched anywhere in the transcript. An inventory command can list every path without reading every file's contents.
- Command-named files and command-output characters are transcript-derived context proxies, not an operating-system file-access audit.
- Codex input tokens are cumulative across model turns. Cached and uncached input are shown separately and are not an API billing statement.
- Paired arms run sequentially, never concurrently. Repeat pairs with alternating order and report medians to reduce order and service-load effects.
- Palace index cache state for this trial: warm. This does not control provider-side model caching.
- Root .palace paths are recorded as benchmark instrumentation and excluded from changed-file scope; raw Git status remains in each arm evidence file.
- A result is comparable only when both arms start from the recorded Git tree and pass their arm-validity checks.
- Correctness and scope determine the score. Speed and token metrics are reported, not rewarded.
