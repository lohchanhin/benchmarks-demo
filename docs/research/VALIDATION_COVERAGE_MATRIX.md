# Validation Coverage Matrix

Date: 2026-07-20

[Simplified Chinese](../zh-CN/VALIDATION_COVERAGE_MATRIX.md) | [Machine-readable matrix](./evidence/validation-coverage-matrix-2026-07-20.json)

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

### Current direction: corrected 0.3.0 and Control-first v3

The negative findings drove true bypass, explicit memory telemetry, scoped
guardrails, execution boundaries, confidence calibration, and exact package
provenance in 0.3.0. A separate non-formal candidate study exercised the exact
candidate tarball across 16 trials and 64 arms. It found one memory-dependent
scope correction and safe stale-memory behavior, but also systematic Adaptive
overhead versus Control. After two fresh small-local pairs showed a narrower
directional result, 0.3.0 was published without turning that exploratory result
into a general speed claim. The formal protocol remains `frozen:false` at 0/16
trials and 0/64 Arms. Its plan, dependency, lockfile, installed package, and
registry now match the public artifact; the 19/19 release gate passes, while
the private-key commitment, freeze commit, and protocol tag remain pending.

## Coverage

| Surface | Status | Evidence | Honest interpretation |
| --- | --- | --- | --- |
| Local clean package, CLI, and MCP | **Validated product gate** | Seven-file 0.3.0 tarball; clean install; 10 MCP tools; cross-platform CI | The exact release candidate passed before publication and is now public. This is not an Agent comparison. |
| TypeScript monorepo routing | **Validated product gate** | Pinned Zod, two identical routes, recall 1.000, strict precision 1.000 | The known issue-style implementation and test are retrieved in this fixed case. |
| Python repository routing | **Validated product gate** | Pinned Requests, two identical routes, recall 1.000, strict precision 1.000 | The known issue-style implementation and test are retrieved in this fixed case. |
| Independent small-OSS stratum | **Not separately tested** | Requests has 123 indexed files, but no size threshold was preregistered | Do not relabel Requests after seeing the result. Add a separately defined small-OSS case later. |
| Real-repository issue-style tasks | **Validated product gate** | Zod and Requests retrieval only | Routing is supported for two fixed tasks; end-to-end Agent repair is not tested. |
| Real-repository history-dependent task | **Not tested** | None | Memory value on a real project remains unknown. |
| Real-repository architecture/refactor task | **Not tested** | None | Cross-module architecture coverage remains unknown. |
| True adaptive bypass contract | **Candidate evidence** | 0.3.0 candidate: Adaptive selected bypass in 3/3 valid small-local runs; 177-byte payload | Palace payload shrank, but Agent cost still increased by +14,029 tokens and +2 calls versus Control. |
| Revised small-local bypass | **Post-candidate exploratory evidence** | Final candidate: 2 opposite-order pairs, 8/8 valid and successful Arms; 65-token payload; Adaptive median -17,316.5 reported tokens, -9.445 s, +1 call versus Control | A repeated directional improvement after removing package rereads; n=2 and one Control router error do not establish a general effect. |
| Memory-dependent tenant fixture | **Candidate exploratory evidence** | 4 trials: Adaptive and Full 4/4, Control 3/4, Route-only 1/4 | One Control scope violation was prevented; exact paired p=1.0, so the correctness effect is not established. |
| Stale-memory resistance | **Candidate exploratory evidence** | 0.3.0 candidate: 4 trials, 16/16 successful Arms, zero wrong-memory adoption | Guardrails were safe, but Adaptive carried two stale memories as warnings instead of excluding them. |
| Adaptive versus Control efficiency | **Candidate negative evidence** | 14 mutual successes: Adaptive +19,922.5 tokens, +10.135 s, +2.5 calls; all 95% CIs above zero | The tested 0.3.0 candidate did not improve end-to-end efficiency and should not be marketed as a speedup. |
| Control-first v3 formal study | **Ready to freeze, not run** | Public 0.3.0 binding gate 19/19; `frozen:false`; 0/16 trials; 0/64 Arms | Artifact provenance is aligned, but no formal Agent outcome exists before commitment, freeze, and tag. |
| Public npm and Codex plugin installation | **Validated release gate** | npm latest `0.3.0`; SHA-1 `9a04440d...`; clean registry install; GitHub Release `v0.3.0`; isolated Codex marketplace and plugin install | The public package and plugin path are installable. This verifies distribution, not an Agent efficiency effect. |

## Claims We Can Make

- The packed 0.3.0 candidate deterministically retrieves the exact known code
  and focused tests for the pinned Zod and Requests tasks.
- The candidate has a compact true-bypass contract and auditable memory
  inclusion/exclusion telemetry.
- In the completed non-formal candidate study, Adaptive prevented one Control
  tenant-scope error and never adopted stale memory.
- The same candidate study found higher end-to-end Token, time, and tool-call
  cost than Control across mutually successful pairs.
- In two fresh final-candidate small-local pairs, Adaptive inspected one file
  and used fewer reported tokens and less wall time than Control in both pairs;
  this is exploratory post-candidate evidence, not a universal result.
- In the retained v2.2 study, Adaptive reduced Palace's own payload relative to
  Full Palace, but did not demonstrate lower end-to-end Token use or wall time
  than Control.
- `vertex-palace@0.3.0` is publicly installable, and the GitHub `v0.3.0`
  marketplace installs the 0.3.0 Codex plugin in an isolated configuration.
- The unfrozen v3 plan and benchmark installation now agree with the immutable
  public 0.3.0 metadata, and all 19 release-binding checks pass.

## Claims We Cannot Make Yet

- Vertex Palace generally saves Agent Token, time, or tool calls.
- Vertex Palace improves correctness over ordinary Codex on real repositories.
- The current evidence covers a separately preregistered small-OSS stratum,
  real-repository historical decisions, or architecture/refactor tasks.
- The public 0.3.0 release by itself proves an end-to-end Agent performance
  advantage.

## Next Evidence

1. Generate the private 256-bit variant key outside Git, commit only its
   SHA-256 commitment, freeze the reviewed plan, and tag that exact commit.
2. Preregister a fresh confirmation that repeats the small-local result and
   tests bounded cross-stack behavior without changing treatment mid-study.
3. Run the 16 formal Control-first trials sequentially from the protocol tag,
   retaining every failed, invalid, or timed-out attempt.
4. Reveal the variant key only after all formal outcomes are locked, then
   reproduce the owner assignments and primary paired analysis.
5. In a separate future protocol, define a small-OSS size threshold before
   selecting a repository and add real-repository history and architecture
   tasks with hidden, objective oracles.
