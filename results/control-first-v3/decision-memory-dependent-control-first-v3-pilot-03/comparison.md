# Vertex Palace Control-First Four-Arm Benchmark

Run: `decision-memory-dependent-control-first-v3-pilot-03`
Scenario: Launch-tenant ownership decision hidden from public tests
Shared Git tree: `73aeacdc900f9487b2bec1739a3e7bc85f88fe24`
Generated fixture files: 142
Palace index state: warm
Comparable result: no
Execution: sequential (Control -> Route-only -> Adaptive Palace -> Full Palace)

## Task

Fix the article body text contrast regression for the independently governed launch tenant. Historical project decisions define which tenant owns this token. Keep the shared token, every other tenant, the resolver, and the public API unchanged. The launch tenant must meet WCAG AA, and the complete test suite must pass. Do not rewrite tests.

## Results

| Metric | Control | Route-only | Full Palace | Adaptive Palace | Control minus Adaptive |
| --- | ---: | ---: | ---: | ---: | ---: |
| Protocol success | no | no | yes | yes | - |
| Public tests | yes | yes | yes | yes | - |
| Hidden oracle | no | no | yes | yes | - |
| Timed out | no | no | no | no | - |
| Arm valid | valid | valid | valid | valid | - |
| Scope score | 0/100 | 0/100 | 100/100 | 100/100 | - |
| Changed-file precision | 0.0% | 0.0% | 100.0% | 100.0% | - |
| Changed-file recall | 0.0% | 0.0% | 100.0% | 100.0% | - |
| Forbidden-file violation | yes | yes | no | no | - |
| Elapsed time | 112.5s | 144.6s | 69.0s | 46.9s | n/a |
| Recorded command/tool calls | 6 | 21 | 17 | 5 | n/a |
| Failed recorded calls | 1 | 3 | 0 | 0 | n/a |
| Codex router errors in stderr | 1 | 3 | 0 | 0 | n/a |
| Native patch verification errors | 0 | 0 | 0 | 0 | n/a |
| Sandbox preparation errors | 0 | 0 | 0 | 0 | n/a |
| Inspection commands | 3 | 2 | 9 | 1 | n/a |
| Files named in commands | 9 | 10 | 9 | 2 | n/a |
| Distinct repository path strings observed | 142 | 142 | 9 | 10 | n/a |
| Command output characters | 20,465 | 17,824 | 8,421 | 8,803 | n/a |
| Palace context output characters | n/a | 3,600 | 4,566 | 6,874 | n/a |
| Palace context output bytes | n/a | 3,600 | 4,566 | 6,874 | n/a |
| Palace context estimated tokens | n/a | 900 | 1,142 | 1,719 | n/a |
| Cumulative input tokens | 146,847 | 222,528 | 131,849 | 94,837 | n/a |
| Cached input tokens | 129,024 | 192,512 | 111,616 | 79,360 | n/a |
| Uncached input tokens | 17,823 | 30,016 | 20,233 | 15,477 | n/a |
| Output tokens | 3,978 | 5,261 | 2,502 | 1,416 | n/a |
| Cumulative reported tokens | 150,825 | 227,789 | 134,351 | 96,253 | n/a |
| Palace calls | 0 | 1 | 1 | 1 | - |

Efficiency deltas are withheld because the primary baseline and treatment did not both complete as valid, passing runs.

## Changed Files

### Control

- `clients/<blinded-tenant>/article-tokens.mjs`

### Route-only

- `clients/<blinded-tenant>/article-tokens.mjs`

### Full Palace

- `clients/<blinded-tenant>/article-tokens.mjs`

### Adaptive Palace

- `clients/<blinded-tenant>/article-tokens.mjs`

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
- Control pitfall violation / wrong-memory adoption: yes / n/a
- Route-only pitfall violation / wrong-memory adoption: yes / n/a
- Full Palace pitfall violation / wrong-memory adoption: no / n/a
- Adaptive Palace pitfall violation / wrong-memory adoption: no / n/a
- Adaptive selected mode: guarded-memory-palace
- Adaptive self-reported payload: 6,874 bytes / ~1,719 tokens
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
