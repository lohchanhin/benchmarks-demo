# Control-First v3 Preflight Record

Date: 2026-07-20 (UTC+08:00)

Status: engineering evidence only; **not a formal Agent trial**.

This record preserves the product and harness work performed before the v3
plan can be frozen. No Control, Route-only, Full, or Adaptive Codex arm was
started, and the public v3 result manifest remains empty.

## Fixture Gate

The new `decision-memory-dependent` fixture has 142 deterministic files. Its
baseline and canonical repair satisfy the intended information boundary:

| State | Public tests | Hidden oracle |
| --- | --- | --- |
| Unmodified baseline | pass | fail |
| Canonical one-file Aurora repair | pass | pass |

Public tests verify only the generic resolver contract. They do not identify
the launch tenant or enforce its contrast. The hidden oracle verifies Aurora
WCAG AA contrast and unchanged shared, Borealis, and Cedar behavior.

## Smoke 1: Failure Found

The local Palace 0.3.0 candidate initialized and seeded both Full and Adaptive
workspaces successfully. Adaptive then produced:

- mode: `guarded-memory-palace`;
- memory candidates: 2;
- memory included: 0;
- exclusions: 2 x `scope_mismatch`;
- static Primary: `src/themes/shared-article-tokens.mjs`;
- Aurora token: Deferred.

The task used the historical business alias "independently governed launch
tenant" while the record had `client=aurora`. Literal-only scope matching
discarded both relevant records.

## Smoke 2: Retrieval Fixed, Boundary Conflict Found

The first product correction conservatively inferred Aurora from four unique
alias tokens: `contrast`, `governed`, `independently`, and `launch`. Retrieval
became 2/2 with zero exclusions. The route bucket moved shared context to
Support, but the nested step still rendered `tier: primary`. This second defect
was retained and fixed rather than ignored.

## Smoke 3: Product Contract Passed

The final source and clean-tarball smoke report:

| Signal | Result |
| --- | --- |
| Selected mode | `guarded-memory-palace` |
| Memory | 2 candidates, 2 included, 0 excluded |
| Scope inference | `aurora` / `unique_historical_alias_match` |
| Primary | `clients/aurora/article-tokens.mjs` only |
| Shared token | Support |
| Ambiguous two-client tie | both excluded as `scope_mismatch` |
| Installed MCP | 10 tools, smoke passed |

The clean installed package also preserved four 3-field bypass trials and the
existing relevant-memory Full Palace contract.

## Product Evidence

- Vertex Palace candidate source commit:
  [`5cae580a67c3b8d3b6885abb900a69cd285ecbc0`](https://github.com/lohchanhin/vertex-palace/commit/5cae580a67c3b8d3b6885abb900a69cd285ecbc0)
- Machine-evidence commit:
  [`087d5c65a740c91f6ab849088c27c609d1f6e201`](https://github.com/lohchanhin/vertex-palace/commit/087d5c65a740c91f6ab849088c27c609d1f6e201)
- Candidate and evidence CI runs:
  [29698755147](https://github.com/lohchanhin/vertex-palace/actions/runs/29698755147),
  [29699008823](https://github.com/lohchanhin/vertex-palace/actions/runs/29699008823)
- [Machine-readable real-repository evidence](https://github.com/lohchanhin/vertex-palace/blob/087d5c65a740c91f6ab849088c27c609d1f6e201/docs/research/evidence/real-repository-validation-0.3.0.json)
- [Machine-readable clean-install evidence](https://github.com/lohchanhin/vertex-palace/blob/087d5c65a740c91f6ab849088c27c609d1f6e201/docs/research/evidence/release-candidate-0.3.0.json)
- [Machine-readable multi-surface routing evidence](https://github.com/lohchanhin/vertex-palace/blob/087d5c65a740c91f6ab849088c27c609d1f6e201/docs/research/evidence/multi-surface-evidence-routing-0.3.0.json)
- [Bilingual context-ceiling incident record](https://github.com/lohchanhin/vertex-palace/blob/087d5c65a740c91f6ab849088c27c609d1f6e201/docs/research/ADAPTIVE_CONTEXT_CEILING_0_3_0.md)
- [Bilingual multi-surface routing record](https://github.com/lohchanhin/vertex-palace/blob/087d5c65a740c91f6ab849088c27c609d1f6e201/docs/research/MULTI_SURFACE_EVIDENCE_ROUTING_0_3_0.md)
- Core: 73/73 tests
- CLI: 2/2 tests
- MCP: 2/2 tests
- TypeScript, build, clean tarball install, package CLI, and MCP smoke: pass

Pinned Zod and Requests validation retrieved both known targets in both
repetitions, with deterministic boundaries and clean tracked worktrees. Each
repository had target recall 1.000 and strict target precision 1.000, with no
extra boundary files. The clean installed package also kept 50 memory
candidates auditable while delivering JSON at 4,050 / 5,000 estimated tokens
and Markdown at 4,473 / 5,000. Product self-evaluation still exposes a broader
limitation: the six-file implementation revision matched 3/6 at confidence 0.35
and missed the classifier, regression test, and generated MCP bundle. A later
documentation-only update was misclassified as release work and matched 1/8.
These are routing and packaging findings, not evidence of lower Agent tokens or
wall time.

## Benchmark Evidence

- v3 plan: `frozen:false`
- v3 public manifest: 0/16 trials
- v3 fixture baseline: public pass / hidden-oracle fail
- v3 strict-scope regression: a correct result with 50% changed-file precision
  is not protocol success
- old v2.2 analysis: exactly reproducible after ignoring only `generatedAt`
- The fixed eight-file evidence-maintenance oracle progressed from 3/8 changed
  files, 38% coverage, 30% route focus, and confidence 0.78 to an exact 8/8
  route with 100% coverage, 100% focus, and conservatively capped confidence
  0.35. Intermediate 4/8, 6/8, and 7/8 failures remain in the public product
  evidence rather than being discarded.
- The actual follow-up pin-sync task matched 7/8 changed files with 0.88
  coverage and 0.88 focus. It selected the explicitly mentioned CI workflow but
  missed `test/study.test.mjs`, which the task did not name. The complete result
  is preserved in [machine-readable benchmark evidence](./evidence/vertex-palace-0.3.0-sync-evaluation.json).

## Remaining Freeze Gates

1. Publish immutable `vertex-palace@0.3.0` using interactive browser/device
   verification.
2. Update this repository and lockfile from 0.2.1 to the published 0.3.0.
3. Repeat the clean install, memory smoke, complete benchmark checks, and zero-
   outcome audit from a clean clone.
4. Change `frozen` to `true`, commit the reviewed plan, and create
   `protocol-v3.0.0` before any formal Agent run.

## 简体中文摘要

新的 fixture 第一次 smoke 找到 2 条 Aurora 记忆，却全部误判成
`scope_mismatch`，shared 还被放在 Primary。第一次修复后记忆变成 2/2，但
Support bucket 里的 shared step 仍显示 `tier: primary`。最终修复让 Aurora 成为
唯一 Primary、shared 成为 Support；两个 client 证据平手时仍全部拒绝。

真实 Zod 与 Requests 仓库各重复两次，都只返回已知实现和测试，目标召回率与严格
精度均为 1.000，没有额外边界文件。干净安装包在 50 条记忆候选下，JSON 为
4,050 / 5,000 estimated tokens，Markdown 为 4,473 / 5,000，并保留所有候选的
纳入或排除原因。产品六文件实现修正自评仍只有 3/6，漏掉分类模块、回归测试与生成
后的 MCP bundle；随后仅更新研究资料的任务又被误判成 release，只命中 1/8。
这些都是冻结前工程验证，不是比赛结果，也不能证明节省 Agent Token 或时间。

本 benchmark 的固定八文件证据维护 oracle 最初只覆盖 3/8，coverage 为 38%、focus
为 30%，置信度却有 0.78。修正后正好命中 8/8，coverage 与 focus 都为 100%，
置信度保守封顶在 0.35；4/8、6/8 与 7/8 的中间失败也保留在公开机器证据中。

本次真正执行的 pin 同步任务自评为 7/8，coverage 与 focus 都为 0.88。它因为任务
明确提到 CI 而选入 CI workflow，但漏掉任务没有点名的 `test/study.test.mjs`。完整结果
保存在[机器可读 benchmark 证据](./evidence/vertex-palace-0.3.0-sync-evaluation.json)中。

v3 计划仍为 `frozen:false`，manifest 仍是 0/16；真实仓库门槛已经完成，但在 npm
0.3.0 发布与协议 tag 完成前不会启动正式 Arm。
