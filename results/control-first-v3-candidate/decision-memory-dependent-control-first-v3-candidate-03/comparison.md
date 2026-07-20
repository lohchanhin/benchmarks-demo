# Vertex Palace Control-First Four-Arm Benchmark

Run: `decision-memory-dependent-control-first-v3-candidate-03`
Scenario: Launch-tenant ownership decision hidden from public tests
Shared Git tree: `73aeacdc900f9487b2bec1739a3e7bc85f88fe24`
Generated fixture files: 142
Palace index state: warm
Comparable result: yes
Execution: sequential (Control -> Route-only -> Adaptive Palace -> Full Palace)

## Task

Fix the article body text contrast regression for the independently governed launch tenant. Historical project decisions define which tenant owns this token. Keep the shared token, every other tenant, the resolver, and the public API unchanged. The launch tenant must meet WCAG AA, and the complete test suite must pass. Do not rewrite tests.

## Results

| Metric | Control | Route-only | Full Palace | Adaptive Palace | Control minus Adaptive |
| --- | ---: | ---: | ---: | ---: | ---: |
| Protocol success | yes | no | yes | yes | - |
| Public tests | yes | yes | yes | yes | - |
| Hidden oracle | yes | no | yes | yes | - |
| Timed out | no | no | no | no | - |
| Arm valid | valid | valid | valid | valid | - |
| Scope score | 100/100 | 0/100 | 100/100 | 100/100 | - |
| Changed-file precision | 100.0% | 0.0% | 100.0% | 100.0% | - |
| Changed-file recall | 100.0% | 0.0% | 100.0% | 100.0% | - |
| Forbidden-file violation | no | yes | no | no | - |
| Elapsed time | 144.6s | 211.0s | 76.1s | 100.4s | +44.2s |
| Recorded command/tool calls | 9 | 25 | 18 | 15 | -6 |
| Failed recorded calls | 0 | 3 | 0 | 2 | -2 |
| Codex router errors in stderr | 0 | 3 | 0 | 2 | -2 |
| Native patch verification errors | 0 | 0 | 0 | 0 | 0 |
| Sandbox preparation errors | 0 | 0 | 0 | 0 | 0 |
| Inspection commands | 4 | 10 | 10 | 5 | -1 |
| Files named in commands | 12 | 9 | 9 | 5 | +7 |
| Distinct repository path strings observed | 142 | 9 | 9 | 10 | +132 |
| Command output characters | 21,554 | 11,633 | 9,492 | 11,345 | +10,209 |
| Palace context output characters | n/a | 3,600 | 4,566 | 6,337 | n/a |
| Palace context output bytes | n/a | 3,600 | 4,566 | 6,337 | n/a |
| Palace context estimated tokens | n/a | 900 | 1,142 | 1,585 | n/a |
| Cumulative input tokens | 166,711 | 247,895 | 150,070 | 190,252 | -23,541 |
| Cached input tokens | 141,056 | 208,896 | 119,808 | 167,168 | -26,112 |
| Uncached input tokens | 25,655 | 38,999 | 30,262 | 23,084 | +2,571 |
| Output tokens | 4,184 | 7,231 | 2,352 | 3,081 | +1,103 |
| Cumulative reported tokens | 170,895 | 255,126 | 152,422 | 193,333 | -22,438 |
| Palace calls | 0 | 1 | 1 | 1 | - |

Positive values in the final column mean Adaptive Palace used less than Control for that measured resource.

## Changed Files

### Control

- `clients/cedar/article-tokens.mjs`

### Route-only

- `clients/aurora/article-tokens.mjs`

### Full Palace

- `clients/cedar/article-tokens.mjs`

### Adaptive Palace

- `clients/cedar/article-tokens.mjs`

## Instrumentation Excluded From Scope

Raw Git status is preserved in each arm evidence file. Only root `.palace` state is excluded from correctness and changed-file precision/recall.

- Control: None
- Route-only: None
- Full Palace: None
- Adaptive Palace: None

## Validity

- Control: 0 Palace calls detected; expected 0; Codex exit code 0; timedOut=false; fixed execution settings match the run plan; sandbox preparation errors=0; expected 0; fixture tree matches 73aeacdc900f9487b2bec1739a3e7bc85f88fe24
- Route-only: 1/1 successful/total Palace calls; adaptiveRequested=false; expected false; adaptivePayloadMatchesOutput=null; taskFidelity=true; Codex exit code 0; timedOut=false; fixed execution settings match the run plan; sandbox preparation errors=0; expected 0; fixture tree matches 73aeacdc900f9487b2bec1739a3e7bc85f88fe24
- Full Palace: 1/1 successful/total Palace calls; adaptiveRequested=false; expected false; adaptivePayloadMatchesOutput=null; taskFidelity=true; Codex exit code 0; timedOut=false; fixed execution settings match the run plan; sandbox preparation errors=0; expected 0; fixture tree matches 73aeacdc900f9487b2bec1739a3e7bc85f88fe24
- Adaptive Palace: 1/1 successful/total Palace calls; adaptiveRequested=true; expected true; adaptivePayloadMatchesOutput=true; taskFidelity=true; Codex exit code 0; timedOut=false; fixed execution settings match the run plan; sandbox preparation errors=0; expected 0; fixture tree matches 73aeacdc900f9487b2bec1739a3e7bc85f88fe24

## Route And Memory Signals

- Route-only Recall@K / Precision@K: 100.0% / 100.0% (K=8)
- Full Palace Recall@K / Precision@K: 100.0% / 100.0% (K=8)
- Adaptive Palace Recall@K / Precision@K: 100.0% / 100.0% (K=8)
- Control pitfall violation / wrong-memory adoption: no / n/a
- Route-only pitfall violation / wrong-memory adoption: yes / n/a
- Full Palace pitfall violation / wrong-memory adoption: no / n/a
- Adaptive Palace pitfall violation / wrong-memory adoption: no / n/a
- Adaptive selected mode: guarded-memory-palace
- Adaptive self-reported payload: 6,337 bytes / ~1,585 tokens
- Adaptive self-reported memory: 2 included / 2 candidates / 0 excluded

## Caveats

- Distinct repository path strings are matched anywhere in the transcript. An inventory command can list every path without reading every file's contents.
- Command-named files and command-output characters are transcript-derived context proxies, not an operating-system file-access audit.
- Codex input tokens are cumulative across model turns. Cached and uncached input are shown separately and are not an API billing statement.
- Paired arms run sequentially, never concurrently. Repeat pairs with alternating order and report medians to reduce order and service-load effects.
- Palace index cache state for this trial: warm. This does not control provider-side model caching.
- Root .palace paths are recorded as benchmark instrumentation and excluded from changed-file scope; raw Git status remains in each arm evidence file.
- A result is comparable only when both arms start from the recorded Git tree and pass their arm-validity checks.
- Correctness and scope determine the score. Speed and token metrics are reported, not rewarded.
