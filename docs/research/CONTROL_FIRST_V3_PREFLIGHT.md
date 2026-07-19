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
  [`c835860d0d63f4c3ddd83b01c5cbb182b216bc9e`](https://github.com/lohchanhin/vertex-palace/commit/c835860d0d63f4c3ddd83b01c5cbb182b216bc9e)
- Machine-evidence commit:
  [`fd39421333414f615c6c47044898a538f8b41ee3`](https://github.com/lohchanhin/vertex-palace/commit/fd39421333414f615c6c47044898a538f8b41ee3)
- Candidate and evidence CI runs:
  [29696299788](https://github.com/lohchanhin/vertex-palace/actions/runs/29696299788),
  [29696392001](https://github.com/lohchanhin/vertex-palace/actions/runs/29696392001)
- [Machine-readable real-repository evidence](https://github.com/lohchanhin/vertex-palace/blob/fd39421333414f615c6c47044898a538f8b41ee3/docs/research/evidence/real-repository-validation-0.3.0.json)
- Core: 70/70 tests
- CLI: 2/2 tests
- MCP: 2/2 tests
- TypeScript, build, clean tarball install, package CLI, and MCP smoke: pass

Pinned Zod and Requests validation retrieved both known targets in both
repetitions, with deterministic boundaries and clean tracked worktrees. Each
repository had target recall 1.000 but strict target precision 0.333, with four
extra files. Product self-evaluation on the broad implementation task covered
only 5/25 changed files and was overconfident by 0.51. These are routing and
packaging findings, not evidence of lower Agent tokens or wall time.

## Benchmark Evidence

- v3 plan: `frozen:false`
- v3 public manifest: 0/16 trials
- v3 fixture baseline: public pass / hidden-oracle fail
- v3 strict-scope regression: a correct result with 50% changed-file precision
  is not protocol success
- old v2.2 analysis: exactly reproducible after ignoring only `generatedAt`
- Palace evaluation of this evidence-pin update matched 2/6 changed files:
  33% coverage, 20% route focus, confidence 0.58, and overconfidence error
  0.25. Exact-reference inspection was still required to find the protocol,
  plan generator, and matching test.

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

真实 Zod 与 Requests 仓库各重复两次，已知实现和测试目标均稳定命中，目标召回率
为 1.000；但严格目标精度只有 0.333，各多带 4 个文件。产品对自身宽任务的改动
覆盖率也只有 20%，且置信度偏高。这些都是冻结前工程验证，不是比赛结果，也不能
证明节省 Agent Token 或时间。

本 benchmark 更新证据 pin 时也出现同类问题：Palace 只覆盖 2/6 个实际改动文件，
覆盖率 33%、路线聚焦度 20%、过度自信误差 0.25；协议、计划生成器与对应测试仍靠
精确引用检索补齐。

v3 计划仍为 `frozen:false`，manifest 仍是 0/16；真实仓库门槛已经完成，但在 npm
0.3.0 发布与协议 tag 完成前不会启动正式 Arm。
