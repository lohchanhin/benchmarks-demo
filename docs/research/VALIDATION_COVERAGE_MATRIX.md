# Validation Coverage Matrix

Date: 2026-07-22

[Simplified Chinese](../zh-CN/VALIDATION_COVERAGE_MATRIX.md) | [Machine-readable matrix](./evidence/validation-coverage-matrix-2026-07-22.json)

## Why This Exists

Vertex Palace has several different kinds of evidence. A deterministic routing
gate is not an Agent benchmark, a fixture preflight is not a real-repository
result, and a historical exploratory study is not a result for the current
public 0.3.0 implementation. This matrix keeps those boundaries visible for
judges and for future development.

Palace's own route for creating this matrix matched `0/7` actual files
(coverage `0`, focus `0`, confidence `0.35`). It remained inside fixture source
and missed the bilingual matrices, machine artifact, navigation, and direct
test. The overconfident `needs-review` result is retained as evidence that
documentation and claim-inventory tasks still route poorly.

## Research Evolution

### First study: fixed Palace treatments (v1.0.0)

The first preregistered study used four deterministic synthetic repositories,
five paired trials per scenario, and three sequential arms: Control,
Route-only, and Full Palace. The protocol, seeds, model, timeout, scoring, and
hidden oracles were frozen before outcomes. Efficiency was compared only when
both paired arms were valid and successful.

All 20 trials and 60 Arms passed, so no correctness loss was observed. Full
Palace versus Control nevertheless added a paired median of 67,223.5 reported
tokens (95% interval 25,362.5 to 112,437.5), 8.5 tool calls (6 to 16), and
29.8 seconds (16.4 to 49.2). Memory did not improve tenant-task correctness
because Control and Route-only also avoided the trap. Stale advice was rejected
in 5/5 Full runs, which was useful safety evidence but not an efficiency win.

### Second study: Adaptive Palace (v2.2)

The second study added Adaptive as a fourth Arm and focused on whether mode
selection could avoid Full Palace overhead. Four scenarios each used four
trials, balanced Williams order, two warm and two cold indexes, sequential
execution, public tests, hidden oracles, and frozen `protocol-v2.2.0` evidence.
An earlier v2.0 attempt was invalid because PowerShell changed `$0.00` in three
task prompts; v2.1 was stopped after Windows split writable roots caused patch
verification failures. Both failed attempts remain public.

All 16 v2.2 trials and 64 Arms were valid and successful. Adaptive reduced
Palace-owned output by 898.5 bytes versus Full, with an interval fully below
zero. End-to-end Token, tool-call, and time intervals versus Full crossed zero.
Against Control, Adaptive used a median 30,147 more reported tokens and 10.919
more seconds, both inconclusive, plus 4.5 more tool calls with a 95% interval of
2.5 to 6.5. The study also found that 0.2.1 Adaptive omitted useful memory in
4/4 trials. The supported value was smaller, auditable routing and stale-memory
guardrails, not a universal speed or Token advantage.

### Third study: Control-first v3 (0.3.0)

The negative findings drove true bypass, explicit memory telemetry, scoped
guardrails, execution boundaries, confidence calibration, and exact package
provenance in 0.3.0. A separate non-formal candidate study exercised the exact
candidate tarball across 16 trials and 64 arms. It found one memory-dependent
scope correction and safe stale-memory behavior, but also systematic Adaptive
overhead versus Control. After two fresh small-local pairs showed a narrower
directional result, 0.3.0 was published without turning that exploratory result
into a general speed claim. The formal protocol then completed 16/16 trials and
64/64 valid Arms. Adaptive succeeded 16/16 and Control 13/16; the three
discordant outcomes were hidden decision-memory scope errors. Across 13 mutual
successes, reported Tokens, time, and calls remained inconclusive. The private
assignment key was revealed only after commit `0c81fb2` locked all outcomes.

### Fourth study: real-repository v4 (0.3.0)

V4 moved from synthetic fixtures to four public issues at immutable commits:
two Zod tasks, one Open WebUI cross-stack task, and one Requests stale-memory
task. The protocol, hidden-oracle commitment, blinded treatment mapping,
runtime, dependencies, model, runner, and exact 0.3.0 tarball were frozen before
16 paired trials and 32 isolated Agent arms. Outcomes were committed at
`cc493b198bdff95138805b18b2b4dff2dec940ee` before the mapping key was revealed.

Adaptive Palace achieved 3/16 strict successes versus Control's 11/16. The
paired difference was -50 percentage points and exact McNemar `p=0.0078125`;
there were zero Adaptive-only successes. Adaptive used fewer descriptive
reported and uncached Tokens, but retry-adjusted cost per successful solution
was much higher because it failed more often. This is completed exploratory
negative evidence for the tested product and sample, not a universal proof
that routing can never help.

## Coverage

| Surface | Status | Evidence | Honest interpretation |
| --- | --- | --- | --- |
| Local clean package, CLI, and MCP | **Validated product gate** | Seven-file 0.3.0 tarball; clean install; 10 MCP tools; cross-platform CI | The exact release candidate passed before publication and is now public. This is not an Agent comparison. |
| TypeScript monorepo routing | **Validated product gate** | Pinned Zod, two identical routes, recall 1.000, strict precision 1.000 | The known issue-style implementation and test are retrieved in this fixed case. |
| Python repository routing | **Validated product gate** | Pinned Requests, two identical routes, recall 1.000, strict precision 1.000 | The known issue-style implementation and test are retrieved in this fixed case. |
| Independent small-OSS stratum | **Not separately tested** | Requests has 123 indexed files, but no size threshold was preregistered | Do not relabel Requests after seeing the result. Add a separately defined small-OSS case later. |
| Real-repository issue-style tasks | **Completed exploratory negative evidence** | V4: 4 issues, 16 pairs, 32 isolated arms; Adaptive 3/16, Control 11/16 | The tested 0.3.0 treatment reduced descriptive context but materially reduced strict success. |
| Real-repository history-dependent task | **Completed exploratory negative evidence** | Zod #5509 decision profile: Adaptive 2/4, Control 3/4; Requests stale profile: both 0/4 | Current memory selection did not improve these real tasks; the decision profile received zero selected memories in the post-hoc audit. |
| Real-repository cross-stack implementation | **Completed exploratory negative evidence** | Open WebUI #25919: Adaptive 0/4, Control 4/4 | Lower Adaptive Token totals reflected incorrect solutions, not useful acceleration. |
| Real-repository architecture/refactor task | **Not tested** | None | Cross-module architecture coverage remains unknown. |
| True adaptive bypass contract | **Candidate evidence** | 0.3.0 candidate: Adaptive selected bypass in 3/3 valid small-local runs; 177-byte payload | Palace payload shrank, but Agent cost still increased by +14,029 tokens and +2 calls versus Control. |
| Revised small-local bypass | **Post-candidate exploratory evidence** | Final candidate: 2 opposite-order pairs, 8/8 valid and successful Arms; 65-token payload; Adaptive median -17,316.5 reported tokens, -9.445 s, +1 call versus Control | A repeated directional improvement after removing package rereads; n=2 and one Control router error do not establish a general effect. |
| Memory-dependent tenant fixture | **Candidate exploratory evidence** | 4 trials: Adaptive and Full 4/4, Control 3/4, Route-only 1/4 | One Control scope violation was prevented; exact paired p=1.0, so the correctness effect is not established. |
| Stale-memory resistance | **Candidate exploratory evidence** | 0.3.0 candidate: 4 trials, 16/16 successful Arms, zero wrong-memory adoption | Guardrails were safe, but Adaptive carried two stale memories as warnings instead of excluding them. |
| Adaptive versus Control efficiency | **Candidate negative evidence** | 14 mutual successes: Adaptive +19,922.5 tokens, +10.135 s, +2.5 calls; all 95% CIs above zero | The tested 0.3.0 candidate did not improve end-to-end efficiency and should not be marketed as a speedup. |
| Control-first v3 formal study | **Completed exploratory evidence** | 16/16 trials; 64/64 valid Arms; Adaptive 16/16, Control 13/16; 128 checksum-verified evidence files; post-lock key reveal | Synthetic historical decisions prevented three Control scope errors, but pooled efficiency intervals crossed zero and raw exact p=0.25. |
| Public npm and Codex plugin installation | **Validated release gate** | npm latest `0.3.0`; SHA-1 `9a04440d...`; clean registry install; GitHub Release `v0.3.0`; isolated Codex marketplace and plugin install | The public package and plugin path are installable. This verifies distribution, not an Agent efficiency effect. |

## Claims We Can Make

- In real-repository V4, Adaptive Palace 0.3.0 had 3/16 strict successes versus
  Control's 11/16, with no Adaptive-only success and exact paired `p=0.0078125`.
- Adaptive had lower descriptive Token totals but a substantially higher
  all-attempt cost per successful solution; reading less did not preserve
  correctness in this sample.
- All 32 public V4 evidence hashes and all 32 revealed assignments verify from
  the locked results, while raw Agent events and oracle details remain private.
- The packed 0.3.0 candidate deterministically retrieves the exact known code
  and focused tests for the pinned Zod and Requests tasks.
- The candidate has a compact true-bypass contract and auditable memory
  inclusion/exclusion telemetry.
- In the completed non-formal candidate study, Adaptive prevented one Control
  tenant-scope error and never adopted stale memory.
- The same candidate study found higher end-to-end Token, time, and tool-call
  cost than Control across mutually successful pairs.
- In formal v3, Adaptive completed 16/16 tasks versus Control 13/16 and avoided
  all three forbidden tenant-scope changes observed in Control.
- Formal v3 did not establish a general efficiency effect: across 13 mutual
  successes, Adaptive minus Control was -806 reported tokens, +2.963 seconds,
  and 0 calls, with all three intervals crossing zero.
- In two fresh final-candidate small-local pairs, Adaptive inspected one file
  and used fewer reported tokens and less wall time than Control in both pairs;
  this is exploratory post-candidate evidence, not a universal result.
- In the retained v2.2 study, Adaptive reduced Palace's own payload relative to
  Full Palace, but did not demonstrate lower end-to-end Token use or wall time
  than Control.
- `vertex-palace@0.3.0` is publicly installable, and the GitHub `v0.3.0`
  marketplace installs the 0.3.0 Codex plugin in an isolated configuration.
- The v3 plan and benchmark installation agree with immutable public 0.3.0
  metadata; all 19 release-binding checks passed, 16 trials are published, and
  the post-lock reveal reproduces every blinded assignment commitment.

## Claims We Cannot Make Yet

- Vertex Palace generally saves Agent Token, time, or tool calls.
- Vertex Palace improves correctness over ordinary Codex on real repositories;
  V4 observed the opposite direction in all eight discordant success pairs.
- Four issues establish performance across repository sizes, languages,
  organizations, architecture/refactor work, or later Codex builds.
- The public 0.3.0 release by itself proves an end-to-end Agent performance
  advantage.

## Next Evidence

1. Redesign Palace as advisory evidence prioritization with an explicit
   insufficiency state, dependency-coverage checks, and no restrictive stop
   contract until correctness evidence is complete.
2. Add fixed retrieval gates for implementation files, tests, indirect
   dependencies, and owner decisions before another end-to-end Agent study.
3. Preregister V5 on fresh issues and trial IDs after the product changes. Do
   not overwrite or reuse V4 outcomes as confirmation data.
4. Seek independent reproduction on another operating system, Codex build,
   machine, and evaluator-owned oracle.
