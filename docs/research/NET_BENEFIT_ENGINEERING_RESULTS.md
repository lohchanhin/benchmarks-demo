# Net Benefit Pilot: Engineering Stage Results

Status on 2026-09-09: **engineering gate not passed; no Agent study started**.
[Simplified Chinese](../zh-CN/NET_BENEFIT_ENGINEERING_RESULTS.md) |
[Protocol](../../protocol/net-benefit-v1/protocol.json) |
[Machine status](../../results/net-benefit-v1/stage-status.json).

## What Is Implemented

Product work is isolated on `codex/net-benefit-pilot`, currently at
`081cf5800335007023906c1be3e8a0742bfc0672`. It includes monotonic evidence
status, metadata/hash/parse reuse, complete-generation publication, request and
resident-MCP snapshots, advisory lookup and scoped memory search. CLI and MCP
interfaces, bounded delivery, relation provenance, same-name ambiguity and
source freshness checks have focused tests. Old tool names and modes remain.

Two create-only experimental plugin profiles expose memory alone or memory with
lookup/open. Neither was installed globally. The npm dist-tags observed during
this stage remain `latest: 0.4.0` and `next: 0.4.0`; no package was published.
The local packaging fixture still reports version 0.4.0, so source and binary
hashes, not that version string, identify these unpublished changes.

Functional validation passed: `pnpm lint`, `pnpm test` (290 core tests plus
CLI/MCP and research suites), `pnpm build`, `pnpm test:mcp-smoke` (12 tools),
release-candidate and temporary-directory installation. The benchmark repo's
full `npm test` passed 142 tests. The [packaging record](../../results/net-benefit-v1/release-candidate-081cf58.json)
binds the clean source commit and npm tarball integrity. It is not a release or
Agent performance certificate.

## Measured Query Performance

These timings belong to the earlier implementation `c383ccd`, whose CLI/MCP
SHA-256 values are in [attempt 01](../../results/net-benefit-v1/engineering-01.json).
They do **not** qualify the later `081cf58` binary. Node 24.13.1, Windows x64,
one machine; operations were sequential. Seven query kinds each have 30 CLI
and 30 resident-MCP observations per dataset: 840 measured warm operations in
total, not 840 Agent tasks. One initial MCP query per kind was excluded as
warm-up. CLI elapsed time includes process startup.

| Sample | Worst query-kind CLI p95 | Worst query-kind MCP p95 | Cold index | Unchanged rebuild | One-file addition refresh |
| --- | ---: | ---: | ---: | ---: | ---: |
| 1,000 synthetic files | 447.1 ms | 40.8 ms | 4.52 s | 2.35 s | 2.13 s |
| 10,000 synthetic files | 1,144.5 ms | 297.3 ms | 41.40 s | 25.74 s | 31.46 s |
| Private VVE snapshot | Not measured | Not measured | Timed out at 600 s | Not measured | Not measured |

All measured synthetic queries passed the 2 s CLI / 1 s MCP limits and the
determinism and output-budget checks. In the 10,000-file unchanged rebuild,
zero files were parsed and 10,000 were reused; adding one file parsed one and
reused 10,000. Cache reuse therefore works in this sample. Full graph/room
reconstruction still cost 23.44 s and 28.82 s respectively. Fast retrieval does
not remove preparation and refresh costs.

## Retained Failures and Diagnosis

1. Attempt 01 completed both synthetic samples, then rejected the VVE copy
   because live source bytes no longer matched the scanned hash. This is an
   invalid snapshot, not a product query failure; the incomplete result remains.
2. [Attempt 02](../../results/net-benefit-v1/engineering-02-vve-completion.json)
   copied a coherent snapshot using bounded I/O and identical hash checks:
   17,023 files, 1,184,093,307 bytes. Its cold index exceeded the harness's
   10-minute safety limit. No VVE warm-query observations exist. This is an
   incomplete engineering gate, not a measured hot-query p95 failure. The
   earlier snapshot race cannot explain this second failure.
3. A separate [90-second diagnostic](../../results/net-benefit-v1/vve-stage-diagnostic.json)
   used the same frozen snapshot and instrumented `081cf58` build. At 85.12 s,
   it was still parsing file 15,750 of 17,023, with observed RSS 3.32 GB. No
   graph phase was observed before the diagnostic stopped. Parsing is a real
   cost; this does not establish that parsing caused the entire 600 s timeout.

The snapshot manifest commitment is
`8e1918f63a4a275bc8a8d5a385bc5a298935eace69a3bd564fe9d6e6117d23a2`.
Private files and path-level manifests remain local and ignored by Git.
The live VVE repository was not modified. VVE remains performance-only and
permanently ineligible as a new blind task in this study.

## Limits and Unfinished Work

- Both synthetic datasets use short TypeScript files and synthetic history;
  they do not establish Python behavior at scale or useful real-project memory.
- Their top-level function names make qualified-symbol and ordinary-symbol
  queries overlap. Later class/method ambiguity tests cover correctness, not
  additional measured performance. Corpus improvements require a disclosed
  engineering revision, never rewriting these observations.
- A [self-route diagnostic](../../results/net-benefit-v1/self-route-diagnostic.json)
  matched 2 of 5 representative changed files, with confidence 0.4. It is not
  the lightweight lookup experiment or an independent task. Its legacy
  repository-to-pack "saved Tokens" field is a size comparison, **not actual
  Agent Token savings**.
- There is no matched old/new Agent experiment, no measured correctness gain,
  and no basis for faster/cheaper marketing. Missing measurements are unknown,
  never zero. The immutable earlier negative studies remain unchanged.
- Scheduling and retention functions have tests, but the candidate, mechanical
  target selection and actual 72-run runner binding are not frozen or complete.

## Gate and Next Bounded Work

The candidate remains null, targets remain empty, and Agent executions are
**0/72**. The gate rejects missing observations, empty timing objects,
diagnostic-only data and binary-hash mismatches. No high-cost Agent trials or
npm publication are authorized by these results.

The next engineering work is to measure parsing output size/retention and
graph/room materialization costs by phase, using language-neutral mechanisms.
Evaluate bounded retention and redundant materialization before adding any
complex graph-incremental machinery. Do not exclude VVE paths, add repository
rules, weaken thresholds or repeat Agent tasks to obtain better outcomes.
After a generic change, all required samples must be measured against the same
new binary. Their prior results remain public.

The original deadlines remain: engineering gate by **2026-09-15**, investment
decision by **2026-09-22** (Monday-Friday count, Asia/Kuala_Lumpur). These are
not background scheduling promises. If the engineering deadline is missed,
stop before the Agent matrix and publish the unmet-gate report. The overall
retention decision is still undecided, not a successful pilot or a reason to
automatically extend the research.
