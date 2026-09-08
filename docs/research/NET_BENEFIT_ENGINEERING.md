# Net Benefit: Engineering Stage

Implementation started on 2026-09-09. The fixed deadlines count weekdays
(Monday-Friday); they do not automatically extend for public holidays.
No Agent experiment or npm publication has occurred in this stage.

## Frozen Starting Point

- Product baseline source: `2b87acdec1f415a2c84759e2f01a4c9c9ddd6877`.
- Public package reference: `vertex-palace@0.4.0`.
- A prior VVE diagnostic measured a 24,427.928 ms full scan/hash of 16,993 files
  (1,183,763,744 bytes), 637.584 ms initial index read, 610.295 ms second read,
  and 1,501.552 ms initial lexical scoring.
- That index was stale: 5,670 indexed files versus 16,993 discovered files.
  These are stage diagnostics, not matched task timings or efficiency evidence.
- Neutral defect: an explicit filename could upgrade an insufficient final
  evidence closure. The regression now covers all four mode overrides.

## Engineering Work

The product branch adds metadata/hash/parse reuse, coherent generation snapshots,
per-request index reuse, optional resident MCP snapshots, advisory lookup and
sourced decision/pitfall search. Old APIs and mode names remain available.
Only lookup, open and memory search are exposed in the isolated navigation
profile; the memory profile exposes memory search only. No global configuration
is overwritten. No production code names a research target.

`scripts/net-benefit-performance.mjs` creates new attempt directories and records
every observation. The two public synthetic scales are exactly 1,000 and 10,000
TypeScript files; the private VVE copy is only a performance diagnostic.
Seven fixed query kinds (path, qualified symbol, symbol, lexical, neighbors,
memory, miss) each receive 30 measured warm repetitions on CLI and resident MCP.
CLI and MCP observations are sequential. Index construction, process startup,
unchanged rebuild and one-file refresh are reported separately. Raw private
paths and source content stay under `.benchmark-runs/` and are not published.

Run after building the product:

```powershell
node scripts/net-benefit-performance.mjs --product="D:\path\vertex-palace" --output=".benchmark-runs/net-benefit-v1/attempt-01" --vve="D:\path\private-project"
node --test test/net-benefit.test.mjs
```

The synthetic data generator and selection logic are public. The history facts
used by this performance test are synthetic, equally unrelated to all real
tasks, and do not qualify memory usefulness.

## Decision Machinery

`src/net-benefit/protocol.mjs` refuses schedule creation without a qualified
candidate hash, 12 tasks, four eligible repositories and pre-fix history.
The six ABC permutations are balanced across 24 task/index-state blocks.
Retention uses task-level aggregates. Cost inputs must separately account for
Agent wall time and setup/maintenance outside that interval; do not double-count
cost already included in wall time. A missing metric stays unknown.

No target has been selected and no candidate package has been frozen for Agent
testing. Functional checks alone cannot open the Agent gate. Performance results
and final engineering status will be recorded separately, without rewriting
the protocol or earlier failed attempts.
