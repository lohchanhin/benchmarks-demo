# Vertex Palace Control-First Four-Arm Benchmark

Run: `decision-memory-dependent-control-first-v3-pilot-04`
Scenario: Launch-tenant ownership decision hidden from public tests
Shared Git tree: `75509415d1dd9b17b118d7cb78be0c6d50e7b166`
Generated fixture files: 142
Palace index state: cold
Comparable result: yes
Execution: sequential (Route-only -> Full Palace -> Control -> Adaptive Palace)

## Task

Fix the article body text contrast regression for the independently governed launch tenant. Historical project decisions define which tenant owns this token. Keep the shared token, every other tenant, the resolver, and the public API unchanged. The launch tenant must meet WCAG AA, and the complete test suite must pass. Do not rewrite tests.

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
| Elapsed time | 138.0s | 167.4s | 108.6s | 58.8s | +79.2s |
| Recorded command/tool calls | 24 | 17 | 21 | 8 | +16 |
| Failed recorded calls | 2 | 1 | 4 | 0 | +2 |
| Codex router errors in stderr | 2 | 1 | 4 | 0 | +2 |
| Native patch verification errors | 0 | 0 | 0 | 0 | 0 |
| Sandbox preparation errors | 0 | 0 | 0 | 0 | 0 |
| Inspection commands | 11 | 3 | 2 | 2 | +9 |
| Files named in commands | 19 | 10 | 9 | 2 | +17 |
| Distinct repository path strings observed | 142 | 142 | 9 | 10 | +132 |
| Command output characters | 24,569 | 16,154 | 16,125 | 9,060 | +15,509 |
| Palace context output characters | n/a | 3,600 | 4,571 | 6,890 | n/a |
| Palace context output bytes | n/a | 3,600 | 4,571 | 6,890 | n/a |
| Palace context estimated tokens | n/a | 900 | 1,143 | 1,723 | n/a |
| Cumulative input tokens | 222,885 | 202,325 | 188,346 | 129,161 | +93,724 |
| Cached input tokens | 189,696 | 178,432 | 170,496 | 116,736 | +72,960 |
| Uncached input tokens | 33,189 | 23,893 | 17,850 | 12,425 | +20,764 |
| Output tokens | 5,649 | 6,455 | 4,138 | 2,074 | +3,575 |
| Cumulative reported tokens | 228,534 | 208,780 | 192,484 | 131,235 | +97,299 |
| Palace calls | 0 | 1 | 1 | 1 | - |

Positive values in the final column mean Adaptive Palace used less than Control for that measured resource.

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

- Control: 0 Palace calls detected; expected 0; Codex exit code 0; timedOut=false; fixed execution settings match the run plan; sandbox preparation errors=0; expected 0; fixture tree matches 75509415d1dd9b17b118d7cb78be0c6d50e7b166
- Route-only: 1/1 successful/total Palace calls; adaptiveRequested=false; expected false; adaptivePayloadMatchesOutput=null; taskFidelity=true; Codex exit code 0; timedOut=false; fixed execution settings match the run plan; sandbox preparation errors=0; expected 0; fixture tree matches 75509415d1dd9b17b118d7cb78be0c6d50e7b166
- Full Palace: 1/1 successful/total Palace calls; adaptiveRequested=false; expected false; adaptivePayloadMatchesOutput=null; taskFidelity=true; Codex exit code 0; timedOut=false; fixed execution settings match the run plan; sandbox preparation errors=0; expected 0; fixture tree matches 75509415d1dd9b17b118d7cb78be0c6d50e7b166
- Adaptive Palace: 1/1 successful/total Palace calls; adaptiveRequested=true; expected true; adaptivePayloadMatchesOutput=true; taskFidelity=true; Codex exit code 0; timedOut=false; fixed execution settings match the run plan; sandbox preparation errors=0; expected 0; fixture tree matches 75509415d1dd9b17b118d7cb78be0c6d50e7b166

## Route And Memory Signals

- Route-only Recall@K / Precision@K: 100.0% / 100.0% (K=8)
- Full Palace Recall@K / Precision@K: 100.0% / 100.0% (K=8)
- Adaptive Palace Recall@K / Precision@K: 100.0% / 100.0% (K=8)
- Control pitfall violation / wrong-memory adoption: no / n/a
- Route-only pitfall violation / wrong-memory adoption: no / n/a
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
