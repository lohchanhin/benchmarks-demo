# Vertex Palace Control-First Four-Arm Benchmark

Run: `decision-memory-dependent-control-first-v3-pilot-02`
Scenario: Launch-tenant ownership decision hidden from public tests
Shared Git tree: `395e27718268702d2ab4908736ae4d9d44d27cfa`
Generated fixture files: 142
Palace index state: cold
Comparable result: no
Execution: sequential (Adaptive Palace -> Control -> Full Palace -> Route-only)

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
| Elapsed time | 191.4s | 149.3s | 105.7s | 65.8s | n/a |
| Recorded command/tool calls | 13 | 22 | 24 | 9 | n/a |
| Failed recorded calls | 1 | 0 | 2 | 0 | n/a |
| Codex router errors in stderr | 1 | 0 | 2 | 0 | n/a |
| Native patch verification errors | 0 | 0 | 0 | 0 | n/a |
| Sandbox preparation errors | 0 | 0 | 0 | 0 | n/a |
| Inspection commands | 3 | 9 | 10 | 2 | n/a |
| Files named in commands | 12 | 9 | 9 | 2 | n/a |
| Distinct repository path strings observed | 142 | 9 | 9 | 10 | n/a |
| Command output characters | 37,214 | 8,827 | 10,344 | 9,044 | n/a |
| Palace context output characters | n/a | 3,600 | 4,571 | 6,890 | n/a |
| Palace context output bytes | n/a | 3,600 | 4,571 | 6,890 | n/a |
| Palace context estimated tokens | n/a | 900 | 1,143 | 1,723 | n/a |
| Cumulative input tokens | 336,813 | 215,855 | 249,158 | 128,568 | n/a |
| Cached input tokens | 305,920 | 190,464 | 221,696 | 116,736 | n/a |
| Uncached input tokens | 30,893 | 25,391 | 27,462 | 11,832 | n/a |
| Output tokens | 6,557 | 5,150 | 3,450 | 1,985 | n/a |
| Cumulative reported tokens | 343,370 | 221,005 | 252,608 | 130,553 | n/a |
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

- Control: 0 Palace calls detected; expected 0; Codex exit code 0; timedOut=false; fixed execution settings match the run plan; sandbox preparation errors=0; expected 0; fixture tree matches 395e27718268702d2ab4908736ae4d9d44d27cfa
- Route-only: 1/1 successful/total Palace calls; adaptiveRequested=false; expected false; adaptivePayloadMatchesOutput=null; taskFidelity=true; Codex exit code 0; timedOut=false; fixed execution settings match the run plan; sandbox preparation errors=0; expected 0; fixture tree matches 395e27718268702d2ab4908736ae4d9d44d27cfa
- Full Palace: 1/1 successful/total Palace calls; adaptiveRequested=false; expected false; adaptivePayloadMatchesOutput=null; taskFidelity=true; Codex exit code 0; timedOut=false; fixed execution settings match the run plan; sandbox preparation errors=0; expected 0; fixture tree matches 395e27718268702d2ab4908736ae4d9d44d27cfa
- Adaptive Palace: 1/1 successful/total Palace calls; adaptiveRequested=true; expected true; adaptivePayloadMatchesOutput=true; taskFidelity=true; Codex exit code 0; timedOut=false; fixed execution settings match the run plan; sandbox preparation errors=0; expected 0; fixture tree matches 395e27718268702d2ab4908736ae4d9d44d27cfa

## Route And Memory Signals

- Route-only Recall@K / Precision@K: 100.0% / 100.0% (K=8)
- Full Palace Recall@K / Precision@K: 100.0% / 100.0% (K=8)
- Adaptive Palace Recall@K / Precision@K: 100.0% / 100.0% (K=8)
- Control pitfall violation / wrong-memory adoption: yes / n/a
- Route-only pitfall violation / wrong-memory adoption: yes / n/a
- Full Palace pitfall violation / wrong-memory adoption: no / n/a
- Adaptive Palace pitfall violation / wrong-memory adoption: no / n/a
- Adaptive selected mode: guarded-memory-palace
- Adaptive self-reported payload: 6,890 bytes / ~1,723 tokens
- Adaptive self-reported memory: 2 included / 2 candidates / 0 excluded

## Caveats

- Distinct repository path strings are matched anywhere in the transcript. An inventory command can list every path without reading every file's contents.
- Command-named files and command-output characters are transcript-derived context proxies, not an operating-system file-access audit.
- Codex input tokens are cumulative across model turns. Cached and uncached input are shown separately and are not an API billing statement.
- Paired arms run sequentially, never concurrently. Repeat pairs with alternating order and report medians to reduce order and service-load effects.
- Palace index cache state for this trial: cold. This does not control provider-side model caching.
- Root .palace paths are recorded as benchmark instrumentation and excluded from changed-file scope; raw Git status remains in each arm evidence file.
- A result is comparable only when both arms start from the recorded Git tree and pass their arm-validity checks.
- Correctness and scope determine the score. Speed and token metrics are reported, not rewarded.
