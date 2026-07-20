# Vertex Palace Control-First Four-Arm Benchmark

Run: `small-local-bug-control-first-v3-candidate-02`
Scenario: Small single-file negative-zero formatting bug
Shared Git tree: `f51156c0d8560abafea8d966a01cea5f94242e9c`
Generated fixture files: 11
Palace index state: cold
Comparable result: yes
Execution: sequential (Route-only -> Full Palace -> Control -> Adaptive Palace)

## Task

Fix currency formatting so negative zero is rendered as $0.00 while genuinely negative cent values keep their minus sign. Keep the public API stable and make the complete test suite pass without changing tests.

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
| Elapsed time | 49.1s | 51.7s | 102.5s | 46.5s | +2.6s |
| Recorded command/tool calls | 4 | 9 | 13 | 5 | -1 |
| Failed recorded calls | 0 | 0 | 3 | 0 | 0 |
| Codex router errors in stderr | 0 | 0 | 3 | 0 | 0 |
| Native patch verification errors | 0 | 0 | 0 | 0 | 0 |
| Sandbox preparation errors | 0 | 0 | 0 | 0 | 0 |
| Inspection commands | 2 | 3 | 3 | 2 | 0 |
| Files named in commands | 3 | 3 | 3 | 2 | +1 |
| Distinct repository path strings observed | 5 | 3 | 3 | 2 | +3 |
| Command output characters | 2,312 | 3,821 | 6,461 | 1,425 | +887 |
| Palace context output characters | n/a | 1,870 | 1,870 | 177 | n/a |
| Palace context output bytes | n/a | 1,870 | 1,870 | 177 | n/a |
| Palace context estimated tokens | n/a | 468 | 468 | 45 | n/a |
| Cumulative input tokens | 85,442 | 103,608 | 190,615 | 99,618 | -14,176 |
| Cached input tokens | 53,248 | 93,440 | 147,968 | 91,392 | -38,144 |
| Uncached input tokens | 32,194 | 10,168 | 42,647 | 8,226 | +23,968 |
| Output tokens | 1,143 | 1,195 | 2,902 | 996 | +147 |
| Cumulative reported tokens | 86,585 | 104,803 | 193,517 | 100,614 | -14,029 |
| Palace calls | 0 | 1 | 1 | 1 | - |

Positive values in the final column mean Adaptive Palace used less than Control for that measured resource.

## Changed Files

### Control

- `src/format-currency.mjs`

### Route-only

- `src/format-currency.mjs`

### Full Palace

- `src/format-currency.mjs`

### Adaptive Palace

- `src/format-currency.mjs`

## Instrumentation Excluded From Scope

Raw Git status is preserved in each arm evidence file. Only root `.palace` state is excluded from correctness and changed-file precision/recall.

- Control: None
- Route-only: None
- Full Palace: None
- Adaptive Palace: None

## Validity

- Control: 0 Palace calls detected; expected 0; Codex exit code 0; timedOut=false; fixed execution settings match the run plan; sandbox preparation errors=0; expected 0; fixture tree matches f51156c0d8560abafea8d966a01cea5f94242e9c
- Route-only: 1/1 successful/total Palace calls; adaptiveRequested=false; expected false; adaptivePayloadMatchesOutput=null; taskFidelity=true; Codex exit code 0; timedOut=false; fixed execution settings match the run plan; sandbox preparation errors=0; expected 0; fixture tree matches f51156c0d8560abafea8d966a01cea5f94242e9c
- Full Palace: 1/1 successful/total Palace calls; adaptiveRequested=false; expected false; adaptivePayloadMatchesOutput=null; taskFidelity=true; Codex exit code 0; timedOut=false; fixed execution settings match the run plan; sandbox preparation errors=0; expected 0; fixture tree matches f51156c0d8560abafea8d966a01cea5f94242e9c
- Adaptive Palace: 1/1 successful/total Palace calls; adaptiveRequested=true; expected true; adaptivePayloadMatchesOutput=true; taskFidelity=true; Codex exit code 0; timedOut=false; fixed execution settings match the run plan; sandbox preparation errors=0; expected 0; fixture tree matches f51156c0d8560abafea8d966a01cea5f94242e9c

## Route And Memory Signals

- Route-only Recall@K / Precision@K: 100.0% / 66.7% (K=3)
- Full Palace Recall@K / Precision@K: 100.0% / 66.7% (K=3)
- Adaptive Palace Recall@K / Precision@K: 100.0% / 66.7% (K=3)
- Control pitfall violation / wrong-memory adoption: n/a / n/a
- Route-only pitfall violation / wrong-memory adoption: n/a / n/a
- Full Palace pitfall violation / wrong-memory adoption: n/a / n/a
- Adaptive Palace pitfall violation / wrong-memory adoption: n/a / n/a
- Adaptive selected mode: bypass
- Adaptive self-reported payload: 177 bytes / ~45 tokens
- Adaptive self-reported memory: 0 included / 0 candidates / 0 excluded

## Caveats

- Distinct repository path strings are matched anywhere in the transcript. An inventory command can list every path without reading every file's contents.
- Command-named files and command-output characters are transcript-derived context proxies, not an operating-system file-access audit.
- Codex input tokens are cumulative across model turns. Cached and uncached input are shown separately and are not an API billing statement.
- Paired arms run sequentially, never concurrently. Repeat pairs with alternating order and report medians to reduce order and service-load effects.
- Palace index cache state for this trial: cold. This does not control provider-side model caching.
- Root .palace paths are recorded as benchmark instrumentation and excluded from changed-file scope; raw Git status remains in each arm evidence file.
- A result is comparable only when both arms start from the recorded Git tree and pass their arm-validity checks.
- Correctness and scope determine the score. Speed and token metrics are reported, not rewarded.
